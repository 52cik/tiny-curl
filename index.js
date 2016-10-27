'use strict'

const parse = require('url').parse
const http = require('http')
const qs = require('qs')

const headers = {
  'Accept': 'text/html',
  // 'Accept-Encoding': 'gzip, deflate, sdch',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
}

function curl(url, data, cb) {
  let isPOST = typeof cb === 'function'

  if (isPOST) {
    data = typeof data === 'string' ? data : qs.stringify(data)
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    headers['Content-Length'] = Buffer.byteLength(data)
  } else {
    cb = data
    data = ''
  }

  let uri = parse(url)
  let options = {
    headers,
    method: isPOST ? 'POST' : 'GET',
    hostname: uri.hostname,
    port: uri.port,
    path: uri.path,
  }

  let req = http.request(options, res => {
    let data = []
    res.on('data', chunk => data.push(chunk))
    res.on('end', _ => cb(Buffer.concat(data)))
  })

  req.on('error', (e) => {
    console.log(`problem with request: ${e.message}`)
  })

  req.write(data)
  req.end()

  return req
}

module.exports = curl
