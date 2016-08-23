# merry [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

:sailboat::skull: _ahoy mate!_

A framework for creating nimble HTTP services. Compose REST API's at the speed
of thought.

## Features
- __fast:__ using `streams` and `cluster`, merry handles request like no other
- __communicative:__ standardized [ndjson][ndjson] logs for everything
- __sincere:__ doesn't monkey patch Node's built-ins
- __linear:__ smoothless scaling from tinkering to production

## Usage
```js
// API
const merry = require('merry')
const pump = require('pump')

const app = merry()

app.router([
  ['/routes/foo', {
    post: (req, res, params) =>  pump(req, res)
  }]
])

app.start()
```

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

## Philosophy
HTTP services should not be a choice between fast and nice. HTTP services
should be standardized, we should not be hand-rolling our own logging, metrics
and option parsing. The "12 factor app" had some great ideas; how about we wrap
those up in a sweet framework using only the highest quality ingredients and
tune it for performance. How about it eh?

## Pretty printing
`merry` ships with a built-in pretty printer for [ndjson][ndjson] logs:

```sh
$ node ./my-app | merry-pretty
# [0000] http://localhost:8080/ (connect) (url)
# [0000] info (server)
#   "port": "8080"
#   "env": "undefined"
#   "pid": "78938"
# [0003] info  28ms          9B response GET    200 / (http)
# [0004] info  5ms           9B response GET    200 / (http)
```

## API
### app = merry(opts)
Create a new instance of `merry`. Takes optional opts:
- __opts.logLevel:__ defaults to `'info'`. Determine the cutoff point for
  logging.
- __opts.port:__ defaults to `8080`. The port the server should listen to

### app.router(dft?, routes)
Register routes. `dft` defaults to `/404`

### app.start()
Start listening for incoming HTTP requests.

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
