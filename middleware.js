var isMyJsonValid = require('is-my-json-valid')
var concat = require('concat-stream')
var mapLimit = require('map-limit')
var assert = require('assert')
var pump = require('pump')

var error = require('./error')
var parse = require('./parse')

middleware.multipart = multipartMiddleware
middleware.schema = schemaMiddleware
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

function multipartMiddleware () {
  return function (req, res, ctx, done) {
    // TODO: validate headers
    if (!ctx.files) ctx.files = {}

    var multipartStream = parse.multipart(req, handler)
    pump(req, multipartStream, function (err) {
      if (err) {
        var parseErr = error({
          message: 'Error parsing multipart upload',
          statusCode: 400
        })
        return done(parseErr)
      }
      res.end()
    })

    function handler (fieldname, file, filename, encoding, mimetype) {
      // FIXME: handle errors and timeouts
      pump(file, concat(function (buf) {
        var file = {
          encoding: encoding,
          fieldname: fieldname,
          file: buf,
          filename: filename,
          mimetype: mimetype
        }
        ctx.files[fieldname] = file
      }))
    }
  }
}
