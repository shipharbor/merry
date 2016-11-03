# merry [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

Nimble HTTP framework. Create tiny servers that run fast.

## Features
- __fast:__ using Node streams, merry handles request like no other
- __fun:__ helps with boring stuff like error handling
- __communicative:__ standardized [ndjson][ndjson] logs for everything
- __sincere:__ doesn't monkey patch Node's built-ins
- __linear:__ smooth sailing from tinkering to production
- __cute:__ 🌊🌊⛵️🌊🌊

## Usage
Given the following `index.js`:
```js
const string = require('merry/string')
const notFound = require('merry/404')
const error = require('merry/error')
const merry = require('merry')
const http = require('http')
const pump = require('pump')

const app = merry()

app.router({ default: '/404' }, [
  [ '/', (req, res, params, done) => {
    done(null, string('hello world'))
  }],
  [ '/error', (req, res, params, done) => {
    done(error(500, 'server error!'))
  }],
  [ '/404', notFound() ]
])

const handler = app.start()
http.createServer(handler).listen(8080)
```

Run using:
```sh
$ node index.js | merry-pretty
```

## Logging
[ tbi ] talk about `bole`

## Error handling
[ tbi ] talk about error handling using `send()` and
`merry/error`/`explain-error`

## API
### app = merry(opts)
Create a new instance of `merry`. Takes optional opts:
- __opts.logLevel:__ defaults to `'info'`. Determine the cutoff point for
  logging.

### app.router(opts?, [routes])
Register routes on the router. Take the following opts:
- __default:__ (default: `'/404'`) Default route handler if no route matches

#### routes
Each route has a signature of `(req, res, params, done)`:
- __req:__ the server's unmodified `req` object
- __res:__ the server's unmodified `res` object
- __params:__ the parameters picked up from the `router` using the `:route`
  syntax in the route
- __done:__ a handler with a signature of `(err, stream)`, that takes either an
  error or a stream. If an error is passed it sets a statusCode of `500` and
  prints out the error to `stdout` and sends a `'server error'` reply. If a
  stream is passed it pipes the stream to `res` until it is done.

### handler = app.start()
Create a handler that can be passed into an `http` server.

### string = merry/string(string)
Create a `readableStream` from a string. Uses `from2-string` under the hood

### error = merry/error(statusCode, message, err?)
Create an HTTP error with a statusCode and a message. Can optionally be used to
safely wrap errors.

### notFound = merry/404()
Create a naive `/404` handler that can be passed into a path.

### log = merry/log(name)
Create a new log client that forwards logs to the main `app`. Possible log
levels are:
- __debug:__ used for developer annotation only, should not be used in
  production
- __info:__ used for transactional messages
- __warn:__ used for expected errors
- __error:__ used for unexpected (critical) errors

## Installation
```sh
$ npm install merry
```

## See Also
- [choo](https://github.com/yoshuawuyts/choo) - fun frontend framework
- [bankai](https://github.com/yoshuawuyts/bankai) - streaming asset compiler

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
