var stringify = require('fast-safe-stringify')
var serverRouter = require('server-router')
var assert = require('assert')
var http = require('http')
var pino = require('pino')

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'merry: opts should be type object')

  this.log = pino({ level: opts.logLevel || 'info' }, opts.logStream || process.stdout)
  this.router = serverRouter()
}

Merry.prototype.route = function (method, route, handler) {
  this.router.route(method, route, handler)
}

Merry.prototype.listen = function (port) {
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

  if (typeof body === 'object') {
    var message = stringify(body)
    if (message.error) throw message.err
    headers['content-type'] = 'json'
    body = message.value
  }

  this.res.writeHead(statusCode, headers)
  this.res.end(body)
}
