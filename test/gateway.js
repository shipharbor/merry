var tape = require('tape')

var gateway = require('../').gateway

tape('gateway', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(1)
    t.throws(gateway.bind(null, 123), /object/)
  })

  t.test('should create a routeHandler', function (t) {
    t.plan(1)
    var gw = gateway()
    var handler = gw({
      handler: noop
    })
    t.equal(handler._middleware.length, 0, 'gateway is ok')
  })

  t.test('should allow passing custom middleware', function (t) {
    t.plan(1)
    function custom () {
      return customInner
    }

    function customInner () {}

    var gw = gateway({
      middleware: { foo: custom }
    })

    var handler = gw({
      handler: noop,
      foo: 'bar'
    })
    t.equal(handler._middleware[0], customInner, 'allows custom middleware')
  })

  t.test('should allow specifying an execution order', function (t) {
    t.plan(2)

    function customInner () {}
    function anotherCustomInner () {}
    function custom () {
      return customInner
    }

    function anotherCustom () {
      return anotherCustomInner
    }

    var gw = gateway({
      middleware: { foo: custom, bar: custom },
      order: [ 'bar', 'foo' ]
    })

    var handler = gw({
      bar: 'bar',
      handler: noop,
      foo: 'bar'
    })
    t.equal(handler._middleware[0], customInner, 'allows custom middleware')

    var gw2 = gateway({
      middleware: { foo: custom, buzz: anotherCustom },
      order: [ 'buzz', 'foo' ]
    })

    var handler2 = gw2({
      buzz: 'fizz',
      handler: noop,
      foo: 'bar'
    })
    t.equal(handler2._middleware[1], customInner, 'allows custom middleware')
  })
})

function noop () {}
