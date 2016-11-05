const fromString = require('from2-string')
module.exports = fromJson

function fromJson (req, res, object) {
  res.setHeader('Content-Type', 'application/json')
  const json = JSON.stringify(object)
  return fromString(json)
}
