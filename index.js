const serverRouter = require('server-router')
const walk = require('server-router/walk')
const serverSink = require('server-sink')
const assert = require('assert')
const bole = require('bole')
const pump = require('pump')

module.exports = Merry

function Merry (opts) {
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'merry: opts should be an object')

  bole.output({
    level: opts.logLevel || 'info',
    stream: process.stdout
  })

  this._router = null
}

Merry.prototype.router = function (opts, routes) {
  this.router = serverRouter(opts, routes)
  walk(this.router, wrap)

  function wrap (route, handler) {
    return function (req, res, params) {
      handler(req, res, params, function (err, stream) {
      })
    }
  }
}

Merry.prototype.start = function () {
  assert.ok(this._router, 'merry: router was not found. Did you run app.router() ?')
  return this.router
}
