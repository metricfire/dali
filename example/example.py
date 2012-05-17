import httplib

requestbody = open("request.json").read()

conn = httplib.HTTPConnection("localhost:3254")
conn.request("POST", "", body = requestbody)
response = conn.getresponse()

print response.read()

