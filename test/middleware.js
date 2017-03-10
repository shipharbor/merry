var getPort = require('get-server-port')
var devnull = require('dev-null')
var request = require('request')
var http = require('http')
var tape = require('tape')

var merry = require('../')

tape('middleware', function (t) {
  t.test('should handle the happy case', function (t) {
    t.plan(5)
    var app = merry({ logStream: devnull() })
    var mw = merry.middleware

    app.router(['/', mw([ contextHandler, anotherOne, finalHandler ])])

    function contextHandler (req, res, ctx, done) {
      ctx.foo = 'bar'
      done()
    }

    function anotherOne (req, res, ctx, done) {
      t.equal(ctx.foo, 'bar', 'was equal')
      ctx.bin = 'baz'
      done()
    }

    function finalHandler (req, res, ctx, done) {
      t.equal(ctx.foo, 'bar', 'was equal')
      t.equal(ctx.bin, 'baz', 'was equal')
      done()
    }

    var server = http.createServer(app.start())
    performGet(server, t)
  })

  t.test('should handle the error case', function (t) {
    t.plan(2)
    var app = merry({ logStream: devnull() })
    var mw = merry.middleware

    app.router(['/', mw([ errorMaker, finalHandler ])])

    function errorMaker (req, res, ctx, done) {
      done(new Error('oi mate'))
    }

    function finalHandler (req, res, ctx, done) {
      done()
    }

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port + '/'
      request(uri, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 500, 'status is not ok')
        server.close()
      })
    })
  })
})

function performGet (server, t, cb) {
  cb = cb || noop
  server.listen(function () {
    var port = getPort(server)
    var uri = 'http://localhost:' + port + '/'
    request(uri, function (err, req) {
      t.ifError(err, 'no err')
      t.equal(req.statusCode, 200, 'status is ok')
      server.close()
    })
  })
}

function noop () {}
