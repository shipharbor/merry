var isMyJsonValid = require('is-my-json-valid')
var mapLimit = require('map-limit')
var assert = require('assert')

var error = require('./error')
var parse = require('./parse')

middleware.schema = schemaMiddleware
middleware.cors = corsMiddleware
module.exports = middleware

function middleware (arr) {
  assert.ok(Array.isArray(arr), 'merry.middleware: arr should be an array')
  assert.ok(arr.length >= 1, 'merry.middleware: arr should contain at least one handler')

  var final = arr.pop()
  routeHandler._middleware = arr
  return routeHandler

  function routeHandler (req, res, ctx, done) {
    mapLimit(arr, 1, iterator, function (err) {
      if (err) return done(err)
      final(req, res, ctx, done)
    })

    function iterator (cb, done) {
      cb(req, res, ctx, done)
    }
  }
}

function schemaMiddleware (schema) {
  assert.ok(typeof schema === 'string' || typeof schema === 'object', 'middleware.schema: schema should be type string or type object')
  var validate = isMyJsonValid(schema)

  return function (req, res, ctx, done) {
    parse.json(req, function (err, json) {
      if (err) {
        var parseErr = error({
          message: 'body is not valid JSON',
          statusCode: 400
        })
        return done(parseErr)
      }
      validate(json)
      if (validate.errors) {
        res.statusCode = 400
        var validationErr = error({
          message: 'error validating JSON',
          statusCode: 400,
          data: validate.errors
        })
        return done(validationErr)
      }
      ctx.body = json
      done()
    })
  }
}

function corsMiddleware (opts) {
  opts = opts || {}
  assert.equal(typeof opts, 'object', 'merry.middleware.cors: opts should be type object')

  var headers = opts.headers || ['Content-Type', 'Accept', 'X-Requested-With']
  var methods = opts.methods || ['PUT', 'POST', 'DELETE', 'GET', 'OPTIONS']
  var credentials = opts.credentials || true
  var origin = opts.origin || '*'

  assert.ok(typeof headers === 'string' || typeof headers === 'object', 'merry.middleware.cors: cors headers should be type string or type object')
  assert.ok(typeof methods === 'string' || typeof methods === 'object', 'merry.middleware.cors: cors methods should be type string or type object')
  assert.equal(typeof credentials, 'boolean', 'merry.middleware.cors: cors credentials should be type boolean')
  assert.equal(typeof origin, 'string', 'merry.middleware.cors: cors origin should be type string')

  if (Array.isArray(headers)) {
    headers = headers.join(', ')
  }
  if (Array.isArray(methods)) {
    methods = methods.join(', ')
  }

  return function (req, res, ctx, done) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Headers', headers)
    res.setHeader('Access-Control-Allow-Credentials', credentials)
    res.setHeader('Access-Control-Allow-Methods', methods)
    done()
  }
}
