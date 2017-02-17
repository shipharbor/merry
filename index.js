var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var fromString = require('from2-string')
var walk = require('server-router/walk')
var serverSink = require('server-sink')
var isStream = require('is-stream')
var corsify = require('corsify')
var envobj = require('envobj')
var assert = require('assert')
var xtend = require('xtend')
var http = require('http')
var pino = require('pino')
var pump = require('pump')

Merry.notFound = notFound
Merry.env = envobj
Merry.cors = cors

Merry.middleware = require('./middleware')
Merry.error = require('./error')
Merry.parse = require('./parse')

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'merry: opts should be an object')

  this.log = pino({ level: opts.logLevel || 'info' }, opts.logStream || process.stdout)
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
          if (!err.isBoom) err = Merry.error.wrap(err)

          var payload = err.output.payload
          if (err.data) payload.data = err.data

          var body = (typeof payload === 'string')
           ? payload
           : stringify(payload)

          var statusCode = err.output.statusCode ||
            (res.statusCode >= 400 ? res.statusCode : 500)

          if (statusCode >= 500) {
            self.log.error(err)
          } else if (statusCode >= 400) {
            self.log.warn(err)
          }

          res.statusCode = statusCode
          res.end(body)
        }

        var stream = null
        if (isStream(val)) {
          stream = val
        } else if (typeof val === 'object') {
          res.setHeader('Content-Type', 'application/json')
          stream = fromString(stringify(val))
        } else if (typeof val === 'string') {
          stream = fromString(val)
        }
        // TODO: remove the need for callback
        var sink = serverSink(req, res, function (msg) {
          self.log.info(msg)
        })
        if (stream) {
          pump(stream, sink)
        } else {
          sink.end()
        }
      })
    }
  }
}

Merry.prototype.start = function () {
  assert.ok(this._router, 'merry.start: router was not found. Did you run app.router() ?')
  this._onerror()
  return this._router
}

Merry.prototype.listen = function (port, cb) {
  assert.ok(this._router, 'merry.listen: router was not found. Did you run app.router() ?')
  var self = this
  var server = http.createServer(this._router)

  cb = cb || noop

  this._onerror()
  server.listen(port, function () {
    self.log.info({
      message: 'listening',
      port: server.address().port,
      env: process.env.NODE_ENV || 'undefined'
    })
    cb()
  })

  return server
}

Merry.prototype._onerror = function () {
  var self = this

  if (process.listenerCount('uncaughtException') === 0) {
    process.once('uncaughtException', function (err) {
      self.log.fatal(err)
      console.error(err.stack)
      process.exit(1)
    })
  }

  if (process.listenerCount('unhandledRejection') === 0) {
    process.once('unhandledRejection', function (err) {
      self.log.fatal(err)
      console.error(err.stack)
      process.exit(1)
    })
  }
}

function notFound () {
  var err = Merry.error({
    statusCode: 404,
    message: 'not found'
  })

  return function (req, res, params, done) {
    done(err)
  }
}

function cors (opts) {
  var _cors = corsify(opts)
  return function (handler) {
    var obj = {}
    if (typeof handler === 'object') {
      var keys = Object.keys(handler)

      assert.equal(keys.length, 1, 'merry.cors: we can only corsify a single method per endpoint')

      keys.forEach(function (key) {
        var _handler = toCors(handler[key])
        obj.options = _handler
        obj[key] = _handler
      })
    } else {
      var _handler = toCors(handler)
      obj.options = _handler
      obj.get = _handler
    }

    return obj

    function toCors (handler) {
      return function (req, res, ctx, done) {
        var _handler = _cors(function (req, res) {
          handler(req, res, ctx, done)
        })
        _handler(req, res)
      }
    }
  }
}

function noop () {}
