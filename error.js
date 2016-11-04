const explain = require('explain-error')
const assert = require('assert')

module.exports = error

// TODO: perhaps we should allow string values for statusCodes too?
function error (statusCode, message, err) {
  assert.equal(typeof statusCode, 'number', 'merry/error: statusCode should be a number')
  assert.equal(typeof message, 'string', 'merry/error: message should be a string')

  err = (err)
    ? explain(err, message)
    : new Error(message)
  err.statusCode = statusCode
  return err
}
