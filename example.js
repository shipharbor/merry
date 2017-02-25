var merry = require('./')
var http = require('http')

var notFound = merry.notFound
var mw = merry.middleware
var error = merry.error
var cors = mw.cors({
  methods: 'POST, GET'
})

var env = merry.env({ PORT: 8080 })
var app = merry()

app.router([
  [ '/', function (req, res, ctx, done) {
    done(null, 'hello world')
  }],
  [ '/error', function (req, res, ctx, done) {
    done(error(500, 'server error!'))
  }],
  [ '/cors', mw([cors, myOtherEndPoint]) ],
  [ '/404', notFound() ]
])

function myOtherEndPoint (req, res, ctx, done) {
  done(null, 'its so shiny... again')
}

var server = http.createServer(app.start())
server.listen(env.PORT)
