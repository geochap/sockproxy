var http = require('http');
var io = require('socket.io-client');
var querystring = require('querystring');

var remote = 'http://www.example.org:2000';

var socket = io.connect(remote);

socket.on('connect', function () {
  console.log('connect');
});
socket.on('status', function (data) {
  console.log(data);
});
socket.on('disconnect', function () {
  console.log('disconnect');
});
socket.on('request', function (req) {
  forwardRequest(req);
});


function forwardRequest(desc) {

  var options = {
    host: 'localhost',
    port: 3100,
    path: desc.url,
    method: desc.method,
    headers: desc.headers
  };

  var req = http.request(options, function (res) {
    var content = [];
    res
        .on('end', function () {
          socket.emit('response', {
            id: desc.id,
            responseText: Buffer.concat(content).toString('base64'),
            statusCode: res.statusCode,
            headers: res.headers
          });
        })
        .on('data', function (chunk) {
          content.push(chunk);
        });
  });

  if (desc.body)
    req.write(new Buffer(desc.body, 'base64'));

  req.end();
}

