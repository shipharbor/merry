var getPort = require('get-server-port')
var devnull = require('dev-null')
var request = require('request')
var tape = require('tape')
var http = require('http')
var merry = require('../')

tape('merry()', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(1)
    t.throws(merry.bind(null, 'oi'), /object/)
  })
})

tape('http handlers', function (t) {
  t.test('should handle GET requests by default', function (t) {
    t.plan(3)
    var app = merry({ logStream: devnull() })
    app.router(['/', function (req, res, ctx, done) {
      t.pass('was called')
      done(null, 'oi')
    }])
    var server = http.createServer(app.start())
    performGet(server, t)
  })

  t.test('should handle custom methods', function (t) {
    t.plan(3)
    var app = merry({ logStream: devnull() })
    app.router(['/', {
      options: function (req, res, ctx, done) {
        t.pass('was called')
        done(null, 'oi')
      }
    }])
    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var opts = {
        method: 'options',
        uri: 'http://localhost:' + port + '/'
      }
      request(opts, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 200, 'status is ok')
        server.close()
      })
    })
  })
})

tape('parsers', function (t) {
  t.test('should parse JSON', function (t) {
    t.plan(4)
    var app = merry({ logStream: devnull() })
    app.router(['/', {
      post: function (req, res, ctx, done) {
        merry.parse.json(req, function (err, json) {
          t.ifError(err, 'no error in parser')
          var expected = { foo: 'bar' }
          t.deepEqual(json, expected, 'parsed object was cool')
          done(null, 'oi')
        })
      }
    }])
    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port + '/'

      var req = request.post(uri, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 200, 'status is ok')
        server.close()
      })
      req.end('{ "foo": "bar" }')
    })
  })

  t.test('should parse text', function (t) {
    t.plan(4)
    var app = merry({ logStream: devnull() })
    app.router(['/', {
      post: function (req, res, ctx, done) {
        merry.parse.string(req, function (err, string) {
          t.ifError(err, 'no error in parser')
          var expected = "now who's the funky monkey"
          t.equal(string, expected, 'string was parsed correctly')
          done(null, 'oi')
        })
      }
    }])
    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port + '/'

      var req = request.post(uri, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 200, 'status is ok')
        server.close()
      })
      req.end("now who's the funky monkey")
    })
  })
})

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
      done(null, '')
    }

    var server = http.createServer(app.start())
    performGet(server, t)
  })

  t.test('should handle the error case')
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
