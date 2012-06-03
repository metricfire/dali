#!/usr/bin/env node

// Copyright 2012 Metricfire, Ltd.
// 
// Licensed under the Apache License, Version 2.0 (the "License"); 
// you may not use this file except in compliance with the License. 
// You may obtain a copy of the License at 
// 
// http://www.apache.org/licenses/LICENSE-2.0 
// 
// Unless required by applicable law or agreed to in writing, software 
// distributed under the License is distributed on an "AS IS" BASIS, 
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
// See the License for the specific language governing permissions and 
// limitations under the License.

var http = require('http');
var sprintf = require('sprintf').sprintf;
var crypto = require('crypto');
var util = require('util');
var daemon = require("daemon");
var fs = require('fs');
var args = require('commander');
var console = require('console');
var metricfire = require('metricfire');

// Handle command line args
args
   .option('-d, --daemonise', 'Daemonise')
   .option('-c, --config_path <path>', 'Path to configuration file', '/etc/dali.conf')
   .option('-p, --pidfile <path>', 'Path to pidfile', '/var/run/dali/dali.pid')
   .version('0.1.6')
   ;

// Reach into commander's arg parsing datastructures and force the daemonise
// option to be a boolean. I don't want to use the --no-daemonise syntax.
// This stupid hack means that daemonise must be first in the list above.
//args.options[0].bool = true;

args.parse(process.argv);

// Load config
try
{
   var config = JSON.parse(fs.readFileSync(args.config_path, encoding="ascii"));
} catch (ex) {
   console.log(sprintf("Error loading config from %s: %s", args.config_path, ex)); 
   process.exit(1);
}

if(args.daemonise)
{
   var SysLogger = require('ain2');
   var console = new SysLogger({tag: 'dali', transport: 'UDP'});

   // Replace the console with ain2 sending to syslog
   // Forced to use the UDP transport here because node 0.6 removes support
   // for unix datagram sockets.

   // Daemonise.
   daemon.start();

   daemon.lock(args.pidfile);

   // daemon.closeIO?
}

process.on('uncaughtException', function(excp) {
   console.error(excp.message);
   console.error(excp.stack);
});

metricfire.init(config.metricfire_key);

var libdali = require('libdali');

var server = http.createServer(function (req, res) {
   var bodycontent = "";
   req.start_time = new Date().getTime()

   req.on('data', function(chunk) {
      bodycontent += chunk.toString();
   });

   req.on('end', function() {
      body = JSON.parse(bodycontent);

      // Calculate a hash to uniquely identify this graph. The associated
      // chart object will be reused later if the request is repeated.
      // Include everything but the data, which will be added to the chart later.
      var graphhash_md5 = crypto.createHash('md5');
      graphhash_md5.update(String(body.width));
      graphhash_md5.update(String(body.height));
      graphhash_md5.update(JSON.stringify(body.config));
      var graphhash = graphhash_md5.digest('hex');

      util.debug(sprintf("Rendering %s at %dx%d", graphhash, body.width, body.height));
      
      libdali.render(graphhash, body, function(err, svg) {
      	if (err) {
            res.writeHead(500, {'Content-Type': 'text/plain'});
      		res.end('Error: ' + err);
            console.error(sprintf("Returned code 500 for %s: %s", graphhash, err));
            metricfire.send("request.error", 1);
      	} else {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end(svg);
	      }
         metricfire.send("request.time", new Date().getTime() - req.start_time)
      });
   });
});

server.listen(config.listen_port, config.listen_addr);
// Eventually, we'd like to use fugue, but it is currently broken under node 0.6.
//fugue.start(server, 3254, "0.0.0.0", 4, {});

console.info("dali started");



