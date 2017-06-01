var merry = require('./')

var env = {
  PORT: 8080
}

var app = merry({ env: env })

app.route('GET', '/', function (req, res, ctx) {
  ctx.log.info('oh hey, a request here')
  ctx.send(200, { cute: 'butts' })
})

app.route('default', function (req, res, ctx) {
  ctx.log.info('Route doesnt exist')
  ctx.send(404, { message: 'nada butts here' })
})

app.listen(app.env.PORT)
