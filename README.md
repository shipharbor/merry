# merry [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

:sailboat::skull: _performance ahoy!_

A framework for creating nimble HTTP services. Compose REST API's at the speed
of thought.

## Features
- __fast:__ using `streams` and `cluster`, merry handles request like no other
- __communicative:__ standardized [ndjson][ndjson] logs for everything
- __sincere:__ doesn't monkey patch Node's built-ins
- __linear:__ smoothless scaling from tinkering to production

## Usage
```js
// asset serving
const browserify = require('browserify')
const bankai = require('bankai')
const merry = require('merry')

const assets = bankai()
const app = merry()
app.router([
  ['/', assets.html()],
  ['/bundle.js', assets.js(browserify)],
  ['/bundle.css', assets.css()]
])
app.start()
```
```js
// API
const merry = require('merry')
const pull = require('pull')

const app = merry()

app.router([
  ['/routes/foo', {
    post: (http$) => pull(http$) // echo request back to response
  }]
])

app.start()
```
```js
// expose to cli
const browserify = require('browserify')
const bankai = require('bankai')
const merry = require('merry')

if (module.parent) module.exports = createApp
else createApp({ port: 8080 })

function createApp (config) {
  const assets = bankai()
  const app = merry(config)
  app.router([
    ['/', assets.html()],
    ['/bundle.js', assets.js(browserify)],
    ['/bundle.css', assets.css()]
  ])
  app.start()
}
```

## Concepts
### router
The `router` acts as the site map to the application. It matches incoming
requests to their corresponding `routes`.

### routes
`routes` are individual functions that act as the doorway to application logic.
Each `route` validates an incoming request, and then either rejects it or calls
logic defined in any of the `models`.

### models
The application logic is `stored` in the `models`.

## Installation
```sh
$ npm install merry
```

## See Also
- [choo](https://github.com/yoshuawuyts/choo) - framework for creating sturdy
  web applications

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/merry.svg?style=flat-square
[3]: https://npmjs.org/package/merry
[4]: https://img.shields.io/travis/yoshuawuyts/merry/master.svg?style=flat-square
[5]: https://travis-ci.org/yoshuawuyts/merry
[6]: https://img.shields.io/codecov/c/github/yoshuawuyts/merry/master.svg?style=flat-square
[7]: https://codecov.io/github/yoshuawuyts/merry
[8]: http://img.shields.io/npm/dm/merry.svg?style=flat-square
[9]: https://npmjs.org/package/merry
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
[ndjson]: http://ndjson.org/
