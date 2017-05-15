var merry = require('./')

var app = merry()

app.route('GET', '/', function (req, res, ctx) {
  ctx.log.info('Hello World')
  ctx.send(200, { foo: 'butts' })
})

app.default(function (req, res, ctx) {
  ctx.log.info('Route doesnt exist')
  ctx.send(404, { cuteError: 'nada here' })
})

app.listen(8080)
