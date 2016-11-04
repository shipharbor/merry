const summary = require('server-summary')
const http = require('http')
const bole = require('bole')

const log = bole('merry')

module.exports = listen

function listen (port, handler) {
  const app = http.createServer(handler)
  app.listen(port, summary(app, log.info))
}
