var getPort = require('get-server-port')
var devnull = require('dev-null')
var request = require('request')
var http = require('http')
var tape = require('tape')

var merry = require('../')

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

