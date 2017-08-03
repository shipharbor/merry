var getPort = require('get-server-port')
var devnull = require('dev-null')
var request = require('request')
var http = require('http')
var tape = require('tape')

require('./context')

var merry = require('../')

tape('merry()', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(1)
    t.throws(merry.bind(null, 'oi'), /object/)
  })
})

tape('http handlers', function (t) {
  t.test('should handle GET requests by default', function (t) {
    t.plan(4)
    var app = merry({ logStream: devnull() })
    app.route('GET', '/', function (req, res, ctx) {
      t.pass('was called')
      ctx.send(200, { message: 'butts' })
    })
    var server = http.createServer(app.start())
    performGet(server, t)
  })

  t.test('should handle custom methods', function (t) {
    t.plan(4)
    var app = merry({ logStream: devnull() })
    app.route('OPTIONS', '/', function (req, res, ctx) {
      t.pass('was called')
      ctx.send(200, { message: 'butts' })
    })
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
        t.equal(req.headers['content-type'], 'application/json', 'content-type is ok')
        server.close()
      })
    })
  })
})

tape('middleware', function (t) {
  t.test('should be able to modify context', function (t) {
    t.plan(4)
    var app = merry({ logStream: devnull() })
    app.use(function (req, res, ctx) {
      ctx.foo = function () {
        t.pass('was called')
      }
    })
    app.route('GET', '/', function (req, res, ctx) {
      ctx.foo()
      ctx.send(200, { message: 'butts' })
      res.end()
    })
    var server = http.createServer(app.start())
    performGet(server, t)
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
      t.equal(req.headers['content-type'], 'application/json', 'content-type is ok')
      server.close()
    })
  })
}

function noop () {}
