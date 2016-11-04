// const listen = require('merry/listen')
const string = require('../string')
const notFound = require('../404')
const error = require('../error')
const merry = require('../')
const http = require('http')

const app = merry()

app.router({ default: '/404' }, [
  [ '/', (req, res, params, done) => {
    done(null, string('hello world'))
  }],
  [ '/error', (req, res, params, done) => {
    done(error(500, 'server error!'))
  }],
  ['/api', {
    get: (req, res, params, done) => {
      done(null, string('hello very explicit GET'))
    }
  }],
  [ '/404', notFound() ]
])

const handler = app.start()
http.createServer(handler).listen(8080)
// listen(8080, handler)
