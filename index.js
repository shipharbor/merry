var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var fromString = require('from2-string')
var assert = require('assert')
var http = require('http')
var pino = require('pino')
var pump = require('pump')

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'Merry: opts should be type object')

  this.log = pino({ level: opts.logLevel || 'info' }, opts.logStream || process.stdout)
  this.router = serverRouter()
  this._port = null
}

Merry.prototype.route = function (method, route, handler) {
  assert.equal(typeof handler, 'function', 'Merry.route: handler should be type function')
  assert.equal(typeof method, 'string', 'Merry.route: method should be type string')
  assert.equal(typeof route, 'string', 'Merry.route: route should be type string')

  // ease things for V8 by setting handler as prototype
  var handle = new Handler(this.log, handler)
  this.router.route(method, route, handle.handle)
}

Merry.prototype.listen = function (port) {
  assert.equal(typeof port, 'number', 'Merry.listen: port should be type number')

  this._port = port
  http.createServer(this.router.start()).listen(this._port, this.onlisten)
}

Merry.prototype.onlisten = function () {
  this.log.info('Merry server listening at port ' + this._port)
}

function Ctx (req, res, log) {
  this.log = log.child()
  this.req = req
  this.res = res
}

Ctx.prototype.send = function (statusCode, body, headers) {
  headers = headers || {}

  assert.equal(typeof statusCode, 'number', 'Merry.Ctx.send: statusCode should be type number')
  assert.equal(typeof headers, 'object', 'Merry.Ctx.send: headers should be type object')
  assert.ok(body, 'Merry.Ctx.send: body should exist')

  if (typeof body === 'object') {
    var message = stringify(body)
    if (message.error) throw message.err
    body = message.value
    headers['content-type'] = 'json'
  }

  this.res.writeHead(statusCode, headers)
  pump(fromString(body), this.res, this.ondone)
}

Ctx.prototype.ondone = function (err) {
  if (err) this.log.error(err)
}

function Handler (log, handler) {
  this.handler = handler
  this.log = log
}

Handler.prototype.handle = function (params, req, res) {
  var ctx = new Ctx(req, res, this.log)
  ctx.params = params
  this.handler(req, res, this.ctx)
}
