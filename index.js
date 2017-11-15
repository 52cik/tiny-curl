const qs = require('qs');
const zlib = require('zlib');
const http = require('http');
const https = require('https');
const { parse } = require('url');
const { name, version } = require('./package');

/**
 * lowercase keys
 *
 * @param {object} obj
 * @return {object}
 */
function lowercaseKeys(obj) {
  const ret = {};
  Object.keys(Object(obj)).forEach((key) => {
    ret[key.toLowerCase()] = obj[key];
  });
  return ret;
}

/**
 * 请求方法
 *
 * @param {string} url
 * @param {object} opts
 */
function curl(url, opts) {
  opts = Object.assign({ path: '' }, parse(url), opts);
  opts.headers = Object.assign({}, curl.defaults.headers, lowercaseKeys(opts.headers));

  const { query, body } = opts;

  if (query) {
    if (typeof query !== 'string') {
      opts.query = qs.stringify(query);
    }
    opts.path = `${opts.path.split('?')[0]}?${opts.query}`;
    delete opts.query;
  }

  if (opts.json && opts.headers.accept === undefined) {
    opts.headers.accept = 'application/json';
  }

  if (body !== null && body !== undefined) {
    const { headers } = opts;
    if (typeof body !== 'string') {
      headers['content-type'] = headers['content-type'] || 'application/x-www-form-urlencoded';
      opts.body = qs.stringify(body);
    } else if (opts.json) {
      headers['content-type'] = headers['content-type'] || 'application/json';
      opts.body = JSON.stringify(body);
    }
    opts.method = (opts.method || 'POST').toUpperCase();
  } else {
    opts.method = (opts.method || 'GET').toUpperCase();
  }

  return new Promise((resolve, reject) => {
    const lib = opts.protocol === 'https:' ? https : http;
    const req = lib.request(opts, (res) => {
      const encoding = res.headers['content-encoding'];
      const chunks = [];

      if (encoding === undefined) {
        res.setEncoding('utf8');
      }

      function done(err, buffer) {
        if (err) {
          reject(err);
        } else {
          // TODO: 二进制/文本处理
          resolve(buffer.toString());
        }
      }

      res.on('data', chunk => chunks.push(chunk));

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (encoding === 'gzip') {
          zlib.gunzip(buffer, done);
        } else if (encoding === 'deflate') {
          zlib.inflate(buffer, done);
        } else {
          resolve(null, buffer);
        }
      });
    });

    req.on('error', reject);
    req.end(opts.body);
  });
}

/**
 * 默认配置
 */
curl.defaults = {
  method: 'GET',
  headers: {
    'user-agent': `${name}/${version}`,
    'accept-encoding': 'gzip,deflate',
  },
  retries: 2, // 重定向
  decompress: true, // 解压缩
};

// 别名绑定
['get', 'post', 'put', 'patch', 'head', 'delete'].forEach((method) => {
  curl[method] = (url, opts) => curl(url, Object.assign({}, opts, { method }));
});

module.exports = curl;
