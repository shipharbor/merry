var getPort = require('get-server-port')
var devnull = require('dev-null')
var request = require('request')
var test = require('tape')
var http = require('http')
var merry = require('../')

test('merry()', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(1)
    t.throws(merry.bind(null, 'oi'), /object/)
  })
})

test('http handlers', function (t) {
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
