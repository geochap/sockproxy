var express = require('express')
  , http = require('http');

var io = require('socket.io');

var app = express();

var _requestid = 0;
var _cbs = {};
var _socket;

app.configure(function () {
  app.set('port', process.env.PORT || 3200);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function () {
  app.use(express.errorHandler());
});

app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
 });

app.get('*', function (req, res, next) {
  proxyRequest(req, function (err, data) {
    if (err)
      sendError(err);
    else {
      res.statusCode = data.statusCode;
      for (var key in data.headers)
        res.setHeader(key, data.headers[key]);

      res.send(new Buffer(data.responseText, 'base64'));
    }
  });
});

var server = http.createServer(app);

server.listen(app.get('port'), function () {
  console.log("Express server listening on port " + app.get('port'));
});

io = io.listen(server);

io.sockets.on('connection', function (socket) {
  _socket = socket;

  socket.emit('status', { status: 'ok' });
  socket.on('response', function (data) {
    if (_cbs[data.id]) {
      var cb = _cbs[data.id];
      delete _cbs[data.id];
      cb(null, data);
    }
    else {
      console.log('unknown request');
    }
  });
});

function proxyRequest(req, cb) {
  var request = {
    id:_requestid++,
    method: req.method,
    url: req.url,
    headers: req.headers
  };
  
  _cbs[request.id] = cb;

  _socket.emit('request', request);
}
