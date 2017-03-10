var mapLimit = require('map-limit')
var assert = require('assert')

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
