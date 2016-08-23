const serverRouter = require('server-router')
const serverSink = require('server-sink')
const summary = require('server-summary')
const assert = require('assert')
const bole = require('bole')
const http = require('http')
const pump = require('pump')

module.exports = merry

// Modular http framework
// obj? -> null
function merry (opts) {
  opts = opts || {}

  const port = opts.port || 8080
  const logLevel = opts.logLevel || 'info'

  assert.equal(typeof opts, 'object', 'merry: opts should be an object')

  bole.output({ level: logLevel, stream: process.stdout })
  const _log = bole('merry')
  var _router = null

  return {
    router: createRouter,
    start: start
  }

  // create a router
  // (str, [[str, fn]..]) -> null
  function createRouter (dft, routes) {
    _router = serverRouter(dft, routes)
  }

  // start the server
  // null -> null
  function start () {
    const server = http.createServer((req, res) => {
      const sink = serverSink(req, res, _log.info)
      console
      pump(_router(req, res), sink)
    })

    server.listen(port, summary(server, _log.info))
  }
}
