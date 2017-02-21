var getPort = require('get-server-port')
var JSONstream = require('jsonstream')
var concat = require('concat-stream')
var devnull = require('dev-null')
var request = require('request')
var stream = require('stream')
var http = require('http')
var pump = require('pump')
var tape = require('tape')

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

  t.test('should call the onRequest hook', function (t) {
    t.plan(6)
    var app = merry({ logStream: devnull() })
    var index = 0

    app.use({
      onRequest: function (req, res, done) {
        t.pass(++index, 1, 'first onRequest was called')
        done()
      }
    })

    app.use({
      onRequest: function (req, res, done) {
        t.equal(++index, 2, 'second onRequest was called')
        res.end()
        setTimeout(done, 100)
      }
    })

    app.router(['/', function (req, res, ctx, done) {
      t.equal(++index, 3, 'done was called')
      t.pass('finished')
    }])

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port
      request(uri, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 200, 'status is ok')
        server.close()
      })
    })
  })
})

tape('status code', function (t) {
  t.test('should send back a 404 when no route is found', function (t) {
    t.plan(2)
    var app = merry({ logStream: devnull() })
    app.router([
      [ '/', function (req, res, ctx, done) {
        done(null, 'oi')
      }],
      [ '/404', merry.notFound() ]
    ])

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var opts = {
        method: 'GET',
        uri: 'http://localhost:' + port + '/hello'
      }
      request(opts, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 404, 'not found')
        server.close()
      })
    })
  })

  t.test('should log 400 errors as warn', function (t) {
    t.plan(4)
    var logStream = new stream.PassThrough()
    var app = merry({ logStream: logStream })
    app.router([
      [ '/', function (req, res, ctx, done) {
        done(null, 'oi')
      }],
      [ '/404', merry.notFound() ]
    ])

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var opts = {
        method: 'GET',
        uri: 'http://localhost:' + port + '/hello'
      }
      request(opts, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 404, 'not found')

        var jsonStream = JSONstream.parse('level')
        var sinkStream = concat({ encoding: 'object' }, sink)
        logStream.on('data', function () {
          logStream.end()
        })

        pump(logStream, jsonStream, sinkStream, function (err) {
          t.ifError(err, 'no err')
          server.close()
        })

        function sink (data) {
          t.equal(data[2], 40, 'warn log is recorded')
        }
      })
    })
  })

  t.test('should log 500 errors as error', function (t) {
    t.plan(4)
    var logStream = new stream.PassThrough()
    var app = merry({ logStream: logStream })
    app.router([ '/', function (req, res, ctx, done) {
      done(new Error('whoa grrrl'))
    }])

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var opts = {
        method: 'GET',
        uri: 'http://localhost:' + port
      }
      request(opts, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 500, 'not found')

        var jsonStream = JSONstream.parse('level')
        var sinkStream = concat({ encoding: 'object' }, sink)
        logStream.on('data', function () {
          logStream.end()
        })

        pump(logStream, jsonStream, sinkStream, function (err) {
          t.ifError(err, 'no err')
          server.close()
        })

        function sink (data) {
          t.equal(data[2], 50, 'error log is recorded')
        }
      })
    })
  })
})

tape('encoders', function (t) {
  t.test('should exit fine if no data is passed', function (t) {
    t.plan(2)
    var app = merry({ logStream: devnull() })
    app.router(['/', function (req, res, ctx, done) {
      done()
    }])
    var server = http.createServer(app.start())
    performGet(server, t)
  })
})

tape('plugins', function (t) {
  t.test('should assert input types', function (t) {
    t.plan(1)
    var app = merry()
    t.throws(app.use.bind(app), /object/)
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
