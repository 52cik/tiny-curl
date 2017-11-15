const http = require('http');
const https = require('https');
const pify = require('pify');
const getPort = require('get-port');

const host = 'localhost';
exports.host = host;

exports.createServer = () =>
  getPort().then((port) => {
    const s = http.createServer((req, resp) => s.emit(req.url, req, resp));

    s.host = host;
    s.port = port;
    s.url = `http://${host}:${port}`;
    s.protocol = 'http';

    s.listen = pify(s.listen, Promise);
    s.close = pify(s.close, Promise);

    return s;
  });

exports.createSSLServer = opts =>
  getPort().then((port) => {
    const s = https.createServer(opts, (req, resp) => s.emit(req.url, req, resp));

    s.host = host;
    s.port = port;
    s.url = `https://${host}:${port}`;
    s.protocol = 'https';

    s.listen = pify(s.listen, Promise);
    s.close = pify(s.close, Promise);

    return s;
  });
