var getPort = require('get-server-port')
var devnull = require('dev-null')
var request = require('request')
var http = require('http')
var tape = require('tape')
var spok = require('spok')

var merry = require('../')

tape('context.parse should parse json', function (assert) {
  assert.plan(4)
  var app = merry({ logStream: devnull() })

  app.route('PUT', '/', function (req, res, ctx) {
    ctx.parse(req, function (err, data) {
      assert.ifError(err, 'no error parsing body')
      spok(assert, data, { foo: 'bar' })
      res.end()
    })
  })

  var server = http.createServer(app.start())
  server.listen(function () {
    var uri = 'http://localhost:' + getPort(server) + '/'
    var req = request.put(uri, function (err, res) {
      assert.ifError(err, 'no err')
      assert.equal(res.statusCode, 200, 'status is ok')
      server.close()
    })
    req.end(JSON.stringify({ foo: 'bar' }))
  })
})

tape('context.env exposes env vars', function (assert) {
  assert.plan(3)
  var env = { FOO: 'bar' }
  var app = merry({ logStream: devnull(), env: env })

  app.route('GET', '/', function (req, res, ctx) {
    spok(assert, ctx.env, { FOO: 'bar' })
    res.end()
  })

  var server = http.createServer(app.start())
  server.listen(function () {
    var uri = 'http://localhost:' + getPort(server) + '/'
    request.get(uri, function (err, res) {
      assert.ifError(err, 'no err')
      assert.equal(res.statusCode, 200, 'status is ok')
      server.close()
    })
  })
})
