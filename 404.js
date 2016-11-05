const fromString = require('from2-string')

module.exports = notFound

function notFound () {
  return function (req, res, params, done) {
    res.statusCode = 404
    done(null, fromString('{ "message": "not found" }'))
  }
}
