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
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port + '/'
      request(uri, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 200, 'status is ok')
        server.close()
      })
    })
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
          t.pass('was called')
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
})
