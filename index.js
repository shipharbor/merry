var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var assert = require('assert')
var http = require('http')
var pino = require('pino')

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'Merry: opts should be type object')

  this.log = pino({ level: opts.logLevel || 'info' }, opts.logStream || process.stdout)
  this.router = serverRouter()
}

Merry.prototype.route = function (method, route, handler) {
  assert.equal(typeof handler, 'function', 'Merry.route: handler should be type function')
  assert.equal(typeof method, 'string', 'Merry.route: method should be type string')
  assert.equal(typeof route, 'string', 'Merry.route: route should be type string')
  var self = this

  this.router.route(method, route, function (params, req, res) {
    var ctx = new Ctx(req, res, self.log)
    handler(req, res, ctx)
  })
}

Merry.prototype.listen = function (port) {
  assert.equal(typeof port, 'number', 'Merry.listen: port should be type number')
  var self = this

  http.createServer(this.router.start()).listen(port, function () {
    self.log.info('Merry server listening at port ' + port)
  })
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
  this.res.end(body)
}
