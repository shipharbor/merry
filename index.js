var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var walk = require('server-router/walk')
var fromString = require('from2-string')
var serverSink = require('server-sink')
var explain = require('explain-error')
var isStream = require('is-stream')
var envobj = require('envobj')
var assert = require('assert')
var xtend = require('xtend')
var from = require('from2')
var http = require('http')
var pino = require('pino')
var pump = require('pump')

Merry.notFound = notFound
Merry.error = error
Merry.env = envobj

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'merry: opts should be an object')

  this._log = pino(opts.logStream || process.stdout)
  this._router = null
}

Merry.prototype.router = function (opts, routes) {
  if (!routes) {
    routes = opts
    opts = {}
  }

  assert.equal(typeof opts, 'object', 'merry.router: opts should be a object')
  assert.ok(Array.isArray(routes), 'merry.router: routes should be an array')

  opts = xtend(opts, { thunk: false })

  var self = this

  var router = serverRouter(opts, routes)
  walk(router, wrap)
  this._router = router

  // change server-router signature
  function wrap (route, handler) {
    return function (params, req, res) {
      var ctx = { params: params }

      // val should ideally be a stream already, but if it's not we got you bae
      handler(req, res, ctx, function (err, val) {
        if (err) {
          res.statusCode = err.statusCode || res.statusCode || 500
          if ((res.statusCode / 100) === 4) {
            self._log.warn(err)
            return res.end(JSON.stringify({ message: err }))
          } else {
            self._log.error(err)
            return res.end('{ "message": "server error" }')
          }
        }

        var stream = null
        if (isStream(val)) {
          stream = val
        } else if (typeof val === 'object') {
          res.setHeader('Content-Type', 'application/json')
          stream = fromString(stringify(val))
        } else if (typeof val === 'string') {
          stream = from(val)
        } else {
          throw new Error('merry: cannot convert value ' + typeof val + ' to stream')
        }

        // TODO: remove the need for callback
        var sink = serverSink(req, res, function (msg) {
          self._log.info(msg)
        })
        pump(stream, sink)
      })
    }
  }
}

Merry.prototype.start = function () {
  assert.ok(this._router, 'merry.start: router was not found. Did you run app.router() ?')
  return this._router
}

Merry.prototype.listen = function (port) {
  assert.ok(this._router, 'merry.listen: router was not found. Did you run app.router() ?')
  var self = this
  var server = http.createServer(this._router)

  server.listen(port, function () {
    self._log.info({
      message: 'listening',
      port: server.address().port,
      env: process.env.NODE_ENV || 'undefined'
    })
  })
}

Merry.prototype._onerror = function () {
  var self = this

  process.once('uncaughtException', function (err) {
    self._log.fatal(err)
    console.error(err.stack)
    process.exit(1)
  })

  process.once('unhandledRejection', function (err) {
    self._log.fatal(err)
    console.error(err.stack)
    process.exit(1)
  })
}

function notFound () {
  return function (req, res, params, done) {
    res.statusCode = 404
    done(null, fromString('{ "message": "not found" }'))
  }
}

function error (statusCode, message, err) {
  assert.equal(typeof statusCode, 'number', 'merry.error: statusCode should be a number')
  assert.equal(typeof message, 'string', 'merry.error: message should be a string')

  err = (err)
    ? explain(err, message)
    : new Error(message)

  err.statusCode = statusCode
  return err
}
