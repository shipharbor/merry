var multipartReadStream = require('multipart-read-stream')
var fastJsonParse = require('fast-json-parse')
var explain = require('explain-error')
var concat = require('concat-stream')
var pump = require('pump')

module.exports = {
  multipart: parseMultipart,
  string: parseString,
  text: parseString,
  json: parseJson
}

function parseString (req, res, cb) {
  if (!cb) cb = res
  pump(req, concat({ encoding: 'string' }, handler), function (err) {
    if (err) return cb(explain(err, 'pipe error'))
  })

  function handler (str) {
    cb(null, str)
  }
}

function parseMultipart (headers, opts, cb) {
  if (headers.headers) headers = headers.headers
  multipartReadStream(headers, opts, cb)
}

function parseJson (req, res, cb) {
  if (!cb) cb = res
  req.pipe(concat(handler), function (err) {
    if (err) return cb(explain(err, 'pipe error'))
  })

  function handler (buf) {
    var json = fastJsonParse(buf)
    if (json.err) {
      return cb(explain(json.err, 'merry.parse.json: error parsing JSON'))
    }
    cb(null, json.value)
  }
}

