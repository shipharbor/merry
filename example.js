var merry = require('./')
var http = require('http')

var notFound = merry.notFound
var error = merry.error

var env = merry.env({ PORT: 8080 })
var app = merry()

app.router([
  [ '/', function (req, res, ctx, done) {
    done(null, 'hello world')
  }],
  [ '/error', function (req, res, ctx, done) {
    done(error(500, 'server error!'))
  }],
  ['/api', {
    get: function (req, res, ctx, done) {
      done(null, 'hello very explicit GET')
    }
  }],
  [ '/404', notFound() ]
])

var server = http.createServer(app.start())
server.listen(env.PORT)
