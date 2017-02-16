var assert = require('assert')
var boom = require('boom')

createError.wrap = wrapError
module.exports = createError

function createError (opts) {
  assert.equal(typeof opts, 'object', 'merry.error: opts should be type object')
  assert.equal(typeof opts.statusCode, 'number', 'merry.error: statusCode should be type number')

  var statusCode = opts.statusCode
  var message = opts.message
  var data = opts.data

  return boom.create(statusCode, message, data)
}

function wrapError (err, opts) {
  opts = opts || {}

  assert.equal(typeof err, 'object', 'merry.wrapError: err should be type object')
  assert.equal(typeof opts, 'object', 'merry.wrapError: opts should be type object')

  var statusCode = opts.statusCode
  var message = opts.message

  return boom.wrap(err, statusCode, message)
}

