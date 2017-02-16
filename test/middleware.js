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

tape('middleware.schema', function (t) {
  t.test('should validate input types', function (t) {
    t.plan(2)
    var mw = merry.middleware
    t.throws(mw.schema.bind(null, 123), /string/)
    t.throws(mw.schema.bind(null, 123), /object/)
  })

  t.test('should validate a schema', function (t) {
    t.plan(3)
    var app = merry({ logStream: devnull() })
    var mw = merry.middleware

    var schema = `
      {
        "required": true,
        "type": "object",
        "properties": {
          "hello": {
            "required": true,
            "type": "string"
          }
        }
      }
    `

    app.router(['/', {
      'put': mw([ mw.schema(schema), handler ])
    }])

    function handler (req, res, ctx, done) {
      var expected = { hello: 'butts' }
      t.deepEqual(ctx.body, expected, 'body matches expected')
      done()
    }

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port + '/'
      var req = request.put(uri, function (err, req) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 200, 'status is ok')
        server.close()
      })
      req.end('{ "hello": "butts" }')
    })
  })

  t.test('should return a 4xx error if json is invalid', function (t) {
    t.plan(3)
    var app = merry({ logStream: devnull() })
    var mw = merry.middleware

    var schema = `
      {
        "required": true,
        "type": "object",
        "properties": {
          "hello": {
            "required": true,
            "type": "string"
          }
        }
      }
    `

    app.router(['/', {
      'put': mw([ mw.schema(schema), handler ])
    }])

    function handler (req, res, ctx, done) {
      done()
    }

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port + '/'
      var req = request.put(uri, function (err, req, body) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 400, 'status is not ok')

        var expected = {
          error: 'Bad Request',
          message: 'body is not valid JSON',
          statusCode: 400
        }

        t.deepEqual(JSON.parse(body), expected, 'body was expected')
        server.close()
      })
      req.end('beepboopdefnotjson1234345')
    })
  })

  t.test('should return a 4xx error if schema does not match', function (t) {
    t.plan(3)
    var app = merry({ logStream: devnull() })
    var mw = merry.middleware

    var schema = `
      {
        "required": true,
        "type": "object",
        "properties": {
          "hello": {
            "required": true,
            "type": "string"
          }
        }
      }
    `

    app.router(['/', {
      'put': mw([ mw.schema(schema), handler ])
    }])

    function handler (req, res, ctx, done) {
      done()
    }

    var server = http.createServer(app.start())
    server.listen(function () {
      var port = getPort(server)
      var uri = 'http://localhost:' + port + '/'
      var req = request.put(uri, function (err, req, body) {
        t.ifError(err, 'no err')
        t.equal(req.statusCode, 400, 'status is not ok')

        var expected = {
          data: [{
            field: 'data.hello',
            message: 'is the wrong type'
          }],
          error: 'Bad Request',
          message: 'error validating JSON',
          statusCode: 400

        }
        t.deepEqual(JSON.parse(body), expected, 'body was expected')
        server.close()
      })
      req.end('{ "hello": 123 }')
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
