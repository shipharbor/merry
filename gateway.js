var mutate = require('xtend/mutable')
var assert = require('assert')
var middleware = require('./middleware')

module.exports = gateway

// Create an API gateway
// obj -> fn(obj) -> fn
function gateway (opts) {
  opts = opts || {}

  assert.equal(typeof opts, 'object', 'merry.gateway: opts should be type object')

  // apply built-in middleware & user middleware
  var mw = {}
  mutate(mw, middleware)
  if (opts.middleware) mutate(mw, opts.middleware)

  // Use a buch of config to create a router handler from middleware
  return function (methods) {
    assert.equal(typeof methods, 'object', 'merry.gateway: methods should be type object')
    assert.equal(typeof methods.handler, 'function', 'merry.gateway: methods.handler should be type function')

    var _mw = []
    var keys = opts.order || Object.keys(methods)
    for (var i = 0, len = keys.length; i < len; i++) {
      var key = keys[i]
      var handler = mw[key]
      var config = methods[key]

      if (key === 'handler') continue
      _mw.push(handler(config))
    }

    _mw.push(methods.handler)
    return middleware(_mw)
  }
}
