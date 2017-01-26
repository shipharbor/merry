var isMyJsonValid = require('is-my-json-valid')
var fastJsonParse = require('fast-json-parse')
var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var fromString = require('from2-string')
var walk = require('server-router/walk')
var serverSink = require('server-sink')
var explain = require('explain-error')
var concat = require('concat-stream')
var isStream = require('is-stream')
var mapLimit = require('map-limit')
var corsify = require('corsify')
var envobj = require('envobj')
var assert = require('assert')
var xtend = require('xtend')
var boom = require('boom')
var http = require('http')
var pino = require('pino')
var pump = require('pump')

Merry.notFound = notFound
Merry.env = envobj
Merry.cors = cors

Merry.parse = {
  json: parseJson,
  text: parseString,
  string: parseString
}

Merry.middleware = middleware
middleware.schema = schemaMiddleware

Merry.error = createError
Merry.error.wrap = wrapError

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
          if (!err.isBoom) err = wrapError(err)

          var payload = err.output.payload
          if (err.data) payload.data = err.data
          var body = stringify(payload)

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
  return this._router
}

Merry.prototype.listen = function (port, cb) {
  assert.ok(this._router, 'merry.listen: router was not found. Did you run app.router() ?')
  var self = this
  var server = http.createServer(this._router)

  cb = cb || noop

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

  process.once('uncaughtException', function (err) {
    self.log.fatal(err)
    console.error(err.stack)
    process.exit(1)
  })

  process.once('unhandledRejection', function (err) {
    self.log.fatal(err)
    console.error(err.stack)
    process.exit(1)
  })
}

function notFound () {
  var err = createError({
    statusCode: 404,
    message: 'not found'
  })

  return function (req, res, params, done) {
    done(err)
  }
}

function createError (opts) {
  assert.equal(typeof opts, 'object', 'merry.error: opts should be type object')
  assert.equal(typeof opts.statusCode, 'number', 'merry.error: statusCode should be type number')

  var statusCode = opts.statusCode
  var message = opts.message
  var data = opts.data

  return boom.create(statusCode, message, data)
}

function wrapError (err, opts) {
  opts = opts || {}

  assert.equal(typeof err, 'object', 'merry.wrapError: err should be type object')
  assert.equal(typeof opts, 'object', 'merry.wrapError: opts should be type object')

  var statusCode = opts.statusCode
  var message = opts.message

  return boom.wrap(err, statusCode, message)
}

function middleware (arr) {
  assert.ok(Array.isArray(arr), 'merry.middleware: arr should be an array')
  assert.ok(arr.length >= 1, 'merry.middleware: arr should contain at least one handler')

  var final = arr.pop()

  return function (req, res, ctx, done) {
    mapLimit(arr, 1, iterator, function (err) {
      if (err) return done(err)
      final(req, res, ctx, done)
    })

    function iterator (cb, done) {
      cb(req, res, ctx, done)
    }
  }
}

function schemaMiddleware (schema) {
  assert.ok(typeof schema === 'string' || typeof schema === 'object', 'middleware.schema: schema should be type string or type object')
  var validate = isMyJsonValid(schema)

  return function (req, res, ctx, done) {
    parseJson(req, function (err, json) {
      if (err) {
        var parseErr = createError({
          message: 'body is not valid JSON',
          statusCode: 400
        })
        return done(parseErr)
      }
      validate(json)
      if (validate.errors) {
        res.statusCode = 400
        var validationErr = createError({
          message: 'error validating JSON',
          statusCode: 400,
          data: validate.errors
        })
        return done(validationErr)
      }
      ctx.body = json
      done()
    })
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

function parseString (req, res, cb) {
  if (!cb) cb = res
  pump(req, concat({ encoding: 'string' }, handler), function (err) {
    if (err) return cb(explain(err, 'pipe error'))
  })

  function handler (str) {
    cb(null, str)
  }
}

function noop () {}
