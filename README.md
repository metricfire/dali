# dali

A node.js implementation of a server-side Highcharts rendering service.

Accepts Highcharts JSON configuration structures and responds with the corresponding SVG.

# Features

* Accepts Highcharts JSON configuration structures
* Responds with SVG
* Caches chart objects, re-uses them for requests that only change the data
* Cleans up old chart objects and SVG
* Well behaved daemon
  * priv dropping (nobody)
  * init script (/etc/init.d/dali)
  * pidfile (/var/run/dali/dali.pid)
  * config file (/etc/dali.conf)
  * logs to syslog

# Dependencies

All dependencies are available from npm:

* sprintf
* ain2 
* commander
* daemon
* jsdom
* metricfire

# Configuration

As dali is a completely standalone service, there is very little to configure.

    {
          "listen_addr": "127.0.0.1"
       ,  "listen_port": 3254
       ,  "metricfire_key": null
    }

# Example

First, start dali in debug mode:

    $ NODE_PATH=lib node src/dali.js
    dali started

Send the example response, example/request.json, to dali and capture the SVG output

    $ curl -s http://localhost:3254 --data-binary @example/request.json > response.svg

response.svg should now contain an SVG rendering of the chart.

# Using dali from Python

See example/example.py.

    cd example
    python example.py
    [ large SVG output snipped ]

# Building a .deb package

    $ dpkg-buildpackage -tc

Don't forget to update the changelog in debian/changelog and make sure the
version number matches the one in src/dali.js!

# Building deb packages for dependencies

Use something like https://github.com/metricfire/deb-npm-autopackage to produce
deb packages for all the dependency modules listed above.

