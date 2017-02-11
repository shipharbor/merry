var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var fromString = require('from2-string')
var walk = require('server-router/walk')
var serverSink = require('server-sink')
var isStream = require('is-stream')
var mapLimit = require('map-limit')
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
Merry.gateway = require('./gateway')
Merry.error = require('./error')
Merry.parse = require('./parse')

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'merry: opts should be type object')

  this.log = pino({ level: opts.logLevel || 'info' }, opts.logStream || process.stdout)
  this._requestHandlers = []
  this._router = null
}

Merry.prototype.use = function (obj) {
  assert.equal(typeof obj, 'object', 'merry.use: obj should be type object')
  if (obj.onRequest) this._requestHandlers.push(obj.onRequest)
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

  this._router = function (req, res) {
    if (!self._requestHandlers.length) {
      return router(req, res)
    } else {
      mapLimit(self._requestHandlers, 1, iterator, function () {
        router(req, res)
      })
    }

    function iterator (fn, cb) {
      fn(req, res, cb)
    }
  }

  return this

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
  opts = opts || {}
  assert.equal(typeof opts, 'object', 'merry.cors: opts should be type object')

  var headers = opts.headers || ['Content-Type', 'Accept', 'X-Requested-With']
  var methods = opts.methods || ['PUT', 'POST', 'DELETE', 'GET', 'OPTIONS']
  var credentials = opts.credentials || true
  var origin = opts.origin || '*'

  assert.ok(typeof headers === 'string' || typeof headers === 'object', 'merry.cors: cors headers should be type string or type object')
  assert.ok(typeof methods === 'string' || typeof methods === 'object', 'merry.cors: cors methods should be type string or type object')
  assert.equal(typeof credentials, 'boolean', 'merry.cors: cors credentials should be type boolean')
  assert.equal(typeof origin, 'string', 'merry.cors: cors origin should be type string')

  if (Array.isArray(headers)) {
    headers = headers.join(', ')
  }
  if (Array.isArray(methods)) {
    methods = methods.join(', ')
  }

  return function (handler) {
    var _handler = null
    if (typeof handler === 'object') {
      var keys = Object.keys(handler)

      assert.equal(keys.length, 1, 'merry.cors: we can only corsify a single method per endpoint')

      keys.forEach(function (key) {
        _handler = toCors(handler[key])
      })
    } else {
      _handler = toCors(handler)
    }

    return _handler

    function toCors (handler) {
      return function (req, res, ctx, done) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Headers', headers)
        res.setHeader('Access-Control-Allow-Credentials', credentials)
        res.setHeader('Access-Control-Allow-Methods', methods)
        handler(req, res, ctx, done)
      }
    }
  }
}

function noop () {}
