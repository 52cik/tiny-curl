'use strict'

const http = require('http')

function curl(url, data, cb) {

}

curl.get = (url, cb) => curl(url, null, cb)
curl.post = (url, data, cb) => curl(url, data, cb)

module.exports = curl
