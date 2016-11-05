const serverRouter = require('server-router')
const walk = require('server-router/walk')
const serverSink = require('server-sink')
const assert = require('assert')
const xtend = require('xtend')
const bole = require('bole')
const pump = require('pump')

module.exports = Merry

function Merry (opts) {
  if (!(this instanceof Merry)) return new Merry(opts)
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'merry: opts should be an object')

  bole.output({
    level: opts.logLevel || 'info',
    stream: opts.logStream || process.stdout
  })

  this._router = null
  this._log = bole('merry')
}

Merry.prototype.router = function (opts, routes) {
  if (!routes) {
    routes = opts
    opts = {}
  }

  assert.equal(typeof opts, 'object', 'merry.router: opts should be a object')
  assert.ok(Array.isArray(routes), 'merry.router: routes should be an array')

  opts = xtend(opts, { thunk: false })

  const self = this

  const router = serverRouter(opts, routes)
  walk(router, wrap)
  this._router = router

  function wrap (route, handler) {
    return function (params, req, res) {
      handler(req, res, params, function (err, stream) {
        if (err) {
          res.statusCode = err.statusCode || res.statusCode || 500
          if ((res.statusCode / 100) === 4) {
            self._log.info(err)
            return res.end(JSON.stringify({ message: err }))
          } else {
            self._log.error(err)
            return res.end('{ "message": "server error" }')
          }
        }
        const sink = serverSink(req, res, self._log.info)
        pump(stream, sink)
      })
    }
  }
}

Merry.prototype.start = function () {
  assert.ok(this._router, 'merry: router was not found. Did you run app.router() ?')
  return this._router
}
