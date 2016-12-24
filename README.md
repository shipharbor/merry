<h1 align="center">merry</h1>

<div align="center">
  🌊🌊⛵️🌊🌊
</div>
<div align="center">
  <strong>Nimble HTTP framework</strong>
</div>
<div align="center">
  Create tiny servers that run fast
</div>

<br />

---

<div align="center">
  <!-- Stability -->
  <a href="https://nodejs.org/api/documentation.html#documentation_stability_index">
    <img src="https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square"
      alt="API stability" />
  </a>
  <!-- NPM version -->
  <a href="https://npmjs.org/package/merry">
    <img src="https://img.shields.io/npm/v/merry.svg?style=flat-square"
      alt="NPM version" />
  </a>
  <!-- Build Status -->
  <a href="https://travis-ci.org/yoshuawuyts/merry">
    <img src="https://img.shields.io/travis/yoshuawuyts/merry/master.svg?style=flat-square"
      alt="Build Status" />
  </a>
  <!-- Test Coverage -->
  <a href="https://codecov.io/github/yoshuawuyts/merry">
    <img src="https://img.shields.io/codecov/c/github/yoshuawuyts/merry/master.svg?style=flat-square"
      alt="Test Coverage" />
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/merry">
    <img src="https://img.shields.io/npm/dm/merry.svg?style=flat-square"
      alt="Downloads" />
  </a>
  <!-- Standard -->
  <a href="https://codecov.io/github/yoshuawuyts/merry">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square"
      alt="Standard" />
  </a>
</div>


## Features
- __fast:__ using Node streams, merry handles request like no other
- __fun:__ helps with boring stuff like error handling
- __communicative:__ standardized [ndjson][ndjson] logs for everything
- __sincere:__ doesn't monkey patch Node's built-ins
- __linear:__ smooth sailing from tinkering to production
- __very cute:__ 🌊🌊⛵️🌊🌊

## Usage
Given the following `index.js`:
```js
var merry = require('merry')

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

app.listen(env.PORT)
```

Run using:
```sh
$ node index.js | merry-pretty
```

## Logging
Merry uses the `pino` logger under the hood. When you create a new `merry` app,
we enable a log forwarder that by default prints all logs to `process.stdout`.

To send a log, we must first create an instance of the logger. This is done by
requireing the `merry/log` file, and instantiating it with a name. The name is
used to help determine where the log was sent from, which is very helpful when
debugging applications:
```js
const Log = require('merry/log')
const log = Log('some-filename')
log.inf('logging!')
```

There are different log levels that can be used. The possible log levels are:
- __debug:__ used for developer annotation only, should not be enable in
  production
- __info:__ used for transactional messages
- __warn:__ used for expected errors
- __error:__ used for unexpected (critical) errors

```js
const Log = require('merry/log')
const log = Log('my-file-name')
log.debug('it works!')
log.info('hey')
log.warn('oh')
log.error('oh no!')
```

The difference between an expected and unexpected error is that the first is
generally caused by a user (e.g. wrong password) and the system knows how to
respond, and the latter is caused by the system (e.g. there's no database) and
the system doesn't know how to handle it.

## Error handling
The `send(err, stream)` callback can either take an error or a stream. If an
error has `.statusCode` property, that value will be used for `res.statusCode`.
Else it'll use any status code that was set previously, and default to `500`.

:warning: __If errors are in the 4xx range, the full error is returned to the
client__ and the error will be logged as loglevel `'info'`. It's important to
not disclose any internal information in `4xx` type errors, as it can lead to
serious security vulnerabilities. All errors in other ranges (typically `5xx`)
will send back the message `'server error'` and are logged as loglevel
`'error'`.

## Configuration
Generally there are two ways of passing configuration into an application.
Through files and through command line arguments. In practice it turns out
passing environment variables can be done with less friction than using files.
Especially in siloed environments such as Docker and Kubernetes where mounting
volumes can at times be tricky, but passing environment variables is trivial.

Merry ships with an environment argument validator that checks the type of
argument passed in, and optionally falls back to a default if no value is
passed in. To set the (very common) `$PORT` variable to default to `8080` do:
```js
const Env = require('merry/env')
const env = Env({ PORT: 8080 })
console.log('port: ' + env.PORT)
```

And then from the CLI do:
```sh
node ./server.js
// => port: 8080

PORT=1234 node ./server.js
// => port: 1234
```

## JSON
If `Object` and `Array` are the data primitives of JavaScript, JSON is the
primitive of APIs. To help create JSON there's `merry/json`. It sets the right
headers on `res` and efficiently turns JavaScript to JSON:
```js
const json = require('merry/json')
const merry = require('merry')
const http = require('http')

const app = merry()
app.router(['/', (req, res, params, done) => {
  done(null, json(req, res, { message: 'hello JSON' }))
}])
http.createServer(app.start()).listen(8080)
```

## Routing
Merry uses `server-router` under the hood to create its routes. Routes are
created using recursive arrays that are turned into an efficient `trie`
structure under the hood. You don't need to worry about any of this though; all
you need to know is that we've tested it and it's probably among the fastest
methods out there. Routes look like this:
```js
const merry = require('merry')
const app = merry()
app.router([
  ['/', handleIndex],
  ['/foo', handleFoo, [
    ['/:bar', handleFoobarPartial]
  ]]
])
```

Partial routes can be set using the `':'` delimiter. Any route that's
registered in this was will be passed to the `params` argument as a key. So
given a route of `/foo/:bar` and we call it with `/foo/hello`, it will show up
in `params` as `{ bar: 'hello' }`.

## CORS
To support `Cross Origin Resource Sharing` we wrap [corsify][corsify] and
expose it as `merry.cors`:

```js
var merry = require('merry')

var cors = merry.cors({
  'Access-Control-Allow-Methods': 'POST, GET'
})

var app = merry()
app.router([
  ['/verify', cors(function (req, res, ctx, done) {
    done(null, 'all is well!')
  })]
])
app.listen(8080)
```

## API
### app = merry(opts)
Create a new instance of `merry`. Takes optional opts:
- __opts.logLevel:__ defaults to `'info'`. Determine the cutoff point for
  logging.
- __opts.logStream:__ defaults to `process.stdout`. Set the output stream to
  write logs to

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
Create a handler that can be passed directly into an `http` server.
```js
const string = require('merry/string')
const merry = require('merry')
const http = require('http')

const app = merry()
app.router(['/', handleRoute])

const handler = app.start()
http.createHttpServer(handler).listen(8080)

function handleRoute (req, res, params, done) {
  done(null, string('hello planet'))
}
```

### string = merry/string(string)
Create a `readableStream` from a string. Uses `from2-string` under the hood

### json = merry/json(req, res, object)
Create a `readableStream` from an object. `req` and `res` must be passed in to
set the appropriate headers. Uses `from2-string` under the hood

### error = merry/error(statusCode, message, err?)
Create an HTTP error with a statusCode and a message. By passing an erorr as
the third argument it will wrap the error using `explain-error` to keep prior
stack traces.

### notFound = merry/404()
Create a naive `/404` handler that can be passed into a path.

### log = merry/log(name)
Create a new log client that forwards logs to the main `app`. See the [logging
section](#logging) for more details.

### log = merry/env(settings)
Create a new configuration client that reads environment variables from
`process.env` and validates them against configuration.

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
[pino]: https://github.com/pinojs/pino
[ndjson]: http://ndjson.org/
[corsify]: https://github.com/Raynos/corsify
