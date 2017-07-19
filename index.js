var jsonToObject = require('json-stream-to-object')
var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var fromString = require('from2-string')
var loghttp = require('log-http')
var envobj = require('envobj')
var assert = require('assert')
var http = require('http')
var pino = require('pino')
var pump = require('pump')

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'Merry: opts should be type object')

  this.log = pino({ level: opts.logLevel || 'info', name: 'merry' }, opts.logStream || process.stdout)
  this.router = serverRouter({ default: '/notFoundHandlerRoute' })
  this.env = envobj(opts.env || {})
  this._port = null
}

Merry.prototype.route = function (method, route, handler) {
  // if a default method is provided, second param is handler
  if (method === 'default') return this.defaultRoute(route)

  assert.ok(Array.isArray(method) || typeof method === 'string', 'Merry.route: method should be type string or an array of strings')
  assert.equal(typeof handler, 'function', 'Merry.route: handler should be type function')
  assert.equal(typeof route, 'string', 'Merry.route: route should be type string')

  var self = this
  self.router.route(method, route, routeHandler)

  function routeHandler (req, res, params) {
    var ctx = new Ctx(req, res, self)
    ctx.params = params.params
    handler(req, res, ctx)
  }
}

Merry.prototype.defaultRoute = function (handler) {
  var self = this
  var method = 'GET'
  var route = '/notFoundHandlerRoute'
  self.router.route(method, route, routeHandler)

  function routeHandler (req, res, params) {
    var ctx = new Ctx(req, res, self)
    ctx.params = params.params
    handler(req, res, ctx)
  }
}

Merry.prototype.start = function () {
  assert.ok(this.router, 'merry.start: router was not found. Did you run app.route() ?')
  this._onerror()

  return this.router.start()
}

Merry.prototype.listen = function (port) {
  this._port = port || this.env.PORT
  assert.equal(typeof this._port, 'number', 'Merry.listen: port should be type number')

  var server = http.createServer(this.router.start())

  var self = this
  var stats = loghttp(server)
  stats.on('data', function (level, data) {
    self.log[level](data)
  })

  server.listen(this._port, this.onlisten.bind(this))
}

Merry.prototype.onlisten = function () {
  this.log.info({
    message: 'listening on port:' + this._port,
    env: process.env.NODE_ENV || 'undefined'
  })
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

Ctx.prototype.parse = jsonToObject

function Ctx (req, res, ctx) {
  this.log = ctx.log.child({ parent: 'merry:ctx' })
  this.env = ctx.env
  this.req = req
  this.res = res
}

Ctx.prototype.send = function (statusCode, body, headers) {
  headers = headers || {}

  assert.equal(typeof statusCode, 'number', 'Merry.Ctx.send: statusCode should be type number')
  assert.equal(typeof headers, 'object', 'Merry.Ctx.send: headers should be type object')
  assert.ok(body || body === '', 'Merry.Ctx.send: body should exist')

  if (typeof body === 'object') {
    body = stringify(body)
    headers['content-type'] = 'application/json'
  }

  this.res.writeHead(statusCode, headers)
  pump(fromString(body), this.res, this.ondone)
}

Ctx.prototype.ondone = function (err) {
  if (err) this.log.error(err)
}
