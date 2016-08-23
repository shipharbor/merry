const fromString = require('from2-string')
const merry = require('../../')

const app = merry()
app.router([
  ['/', (req, res, params) => fromString('sup merry')],
  ['/404', (req, res, params) => fromString('omg no merry')]
])

app.start()

