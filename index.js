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
 * Flattens the underlying C structures of a concatenated JavaScript string
 * @see https://github.com/davidmarkclements/flatstr
 *
 * @param {string} s
 */
function flatstr(s) {
  Number(s);
  return s;
}

/**
 * query string stringify
 *
 * @param {any} obj
 * @param {string} prefix
 */
function queryStringify(obj, prefix) {
  const pairs = [];

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      const enkey = encodeURIComponent(key);
      let pair;

      if (typeof value === 'object') {
        pair = queryStringify(value, prefix ? `${prefix}[${enkey}]` : enkey);
      } else {
        pair = `${prefix ? `${prefix}[${enkey}]` : enkey}=${encodeURIComponent(value)}`;
      }
      pairs.push(pair);
    }
  }

  return pairs.join('&');
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
      opts.query = queryStringify(query);
      flatstr(opts.query);
    }
    opts.path = `${opts.path.split('?')[0]}?${opts.query}`;
    delete opts.query;
  }

  if (opts.json && opts.headers.accept === undefined) {
    opts.headers.accept = 'application/json';
  }

  if (body !== null && body !== undefined) {
    const { headers } = opts;
    const isString = Object.prototype.toString.call(body) === '[object String]';

    if (!isString) {
      if (opts.json) {
        headers['content-type'] = headers['content-type'] || 'application/json';
        opts.body = JSON.stringify(body);
      } else {
        headers['content-type'] = headers['content-type'] || 'application/x-www-form-urlencoded';
        opts.body = queryStringify(body);
      }
      flatstr(opts.body);
    }

    if (headers['content-length'] === undefined && headers['transfer-encoding'] === undefined) {
      headers['content-length'] = Buffer.byteLength(opts.body);
    }

    opts.method = (opts.method || 'POST').toUpperCase();
  } else {
    opts.method = (opts.method || 'GET').toUpperCase();
  }

  return new Promise((resolve, reject) => {
    const lib = opts.protocol === 'https:' ? https : http;
    const req = lib.request(opts, (res) => {
      let { encoding } = opts;
      const isBuffer = encoding === 'buffer' || encoding === null;
      const contentEncoding = res.headers['content-encoding'];
      const chunks = [];

      if (!isBuffer) {
        encoding = encoding || 'utf8';
        // res.setEncoding(encoding || 'utf8');
      }

      // 统一回复结果
      function done(err, buffer) {
        if (err) {
          reject(err);
        } else {
          res.body = isBuffer ? buffer : buffer.toString(encoding);

          if (opts.json && res.body) {
            try {
              res.body = JSON.parse(res.body);
            } catch (er) {
              reject(er);
            }
          }

          resolve(res);
        }
      }

      let len = 0;
      res.on('data', (chunk) => {
        chunks.push(chunk);
        len += chunk.length;
      });

      res.on('end', () => {
        if (opts.method === 'HEAD') {
          return done(null, '');
        }

        const buffer = Buffer.concat(chunks, len);

        if (contentEncoding === 'gzip') {
          zlib.gunzip(buffer, done);
        } else if (contentEncoding === 'deflate') {
          zlib.inflate(buffer, done);
        } else {
          done(null, buffer);
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
  // encoding: 'utf8', // 输出编码类型
  retries: 2, // 重定向
  decompress: true, // 解压缩
};

// 别名绑定
['get', 'post', 'put', 'patch', 'head', 'delete'].forEach((method) => {
  curl[method] = (url, opts) => curl(url, Object.assign({}, opts, { method }));
});

module.exports = curl;
