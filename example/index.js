const listen = require('../listen')
const string = require('../string')
const notFound = require('../404')
const error = require('../error')
const json = require('../json')
const merry = require('../')

const app = merry()

app.router({ default: '/404' }, [
  [ '/', function (req, res, params, done) {
    done(null, string('hello world'))
  }],
  [ '/error', (req, res, params, done) => {
    done(error(500, 'server error!'))
  }],
  ['/api', {
    get: (req, res, params, done) => {
      done(null, json(req, res, { message: 'so explicit!' }))
    }
  }],
  [ '/404', notFound() ]
])

const handler = app.start()
listen(8080, handler)
