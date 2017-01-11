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
var pump = require('pump')
var http = require('http')

var notFound = merry.notFound
var error = merry.error

var env = merry.env({ PORT: 8080 })
var app = merry()

app.router([
  [ '/', homePath ],
  [ '/error', errorPath ],
  [ '/api', {
    put: apiPutPath,
    get: apiGetPath
  } ],
  [ '/404', notFound() ]
])

var server = http.createServer(app.start())
server.listen(env.PORT)

function homePath (req, res, ctx, done) {
  done(null, 'hello world')
}

function errorPath (req, res, ctx, done) {
  done(null, 'hello world')
}

function apiGetPath (req, res, ctx, done) {
  done(null, 'hello HTTP GET')
}

function apiPutPath (req, res, ctx, done) {
}
```

The application will now start printing log messages to stdout. `merry` ships
with a CLI tool called `merry` that formats the messages for humans:
```sh
$ node index.js | merry
```

## Logging
Merry uses the `pino` logger under the hood. When you create a new `merry` app,
we enable a log forwarder that by default prints all logs to `process.stdout`:
```js
var merry = require('merry')
var app = merry()

app.log.info('look at the logs!')
```

There are different log levels that can be used. The possible log levels are:
- __debug:__ used for developer annotation only, should not be enable in
  production
- __info:__ used for transactional messages
- __warn:__ used for expected errors
- __error:__ used for unexpected errors
- __fatal:__ used for critical errors that should terminate the process

```js
var merry = require('merry')
var app = merry()

app.log.debug('it works!')
app.log.info('hey')
app.log.warn('oh')
app.log.error('oh no!')
app.log.fatal('send help')
```

The difference between an expected and unexpected error is that the first is
generally caused by a user (e.g. wrong password) and the system knows how to
respond, and the latter is caused by the system (e.g. there's no database) and
the system doesn't know how to handle it.

## Error handling
The `done(err, stream)` callback can either take an error or a stream. If an
error has `.statusCode` property, that value will be used for `res.statusCode`.
Else it'll use any status code that was set previously, and default to `500`.

:warning: __If errors are in the 4xx range, the full error is returned to the
client__ and the error will be logged as loglevel `'warn'`. It's important to
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
var merry = require('merry')
var env = merry.env({ PORT: 8080 })
console.log('port: ' + env.PORT)
```

And then from the CLI do:
```sh
node ./server.js
// => port: 8080

PORT=1234 node ./server.js
// => port: 1234
```

## Encoding 
If `Object` and `Array` are the data primitives of JavaScript, JSON is the
primitive of APIs. To create JSON there's . It sets the right
headers on `res` and efficiently turns JavaScript to JSON:
```js
var merry = require('merry')
var http = require('http')

var app = merry()
app.router(['/', function (req, res, ctx, done) {
  done(null, { message: 'hello JSON' })
}])

var server = http.createServer(app.start())
server.listen(8080)
```

## Routing
Merry uses `server-router` under the hood to create its routes. Routes are
created using recursive arrays that are turned into an efficient `trie`
structure under the hood. You don't need to worry about any of this though; all
you need to know is that we've tested it and it's probably among the fastest
methods out there. Routes look like this:
```js
var merry = require('merry')
var app = merry()
app.router([
  ['/', handleIndex],
  ['/foo', handleFoo, [
    ['/:bar', handleFoobarPartial]
  ]]
])
```

Partial routes can be set using the `':'` delimiter. Any route that's
registered in this was will be passed to the `ctx` argument as a key. So
given a route of `/foo/:bar` and we call it with `/foo/hello`, it will show up
in `ctx` as `{ bar: 'hello' }`.

## Body Parsing
To make it easy to operate on common data types, we've included body parsers.
These functions take the `req` stream, concatenate it and return the resulting
data, or an error if it didn't succeed. Check out [#parsers](#parsers) for more
details.

```js
var merry = require('merry')
var app = merry()
app.router([
  [ '/json', {
    put: function (req, res, ctx, done) {
      merry.parse.json(req, function (err, json) {
        if (err) return done(err)
        ctx.json = json
        done(null, 'done parsing json')
      })
    }
  } ],
  [ '/string', {
    put: function (req, res, ctx, done) {
      merry.parse.string(req, function (err, string) {
        if (err) return done(err)
        ctx.string = string
        done(null, 'done parsing string')
      })
    }
  } ]
])
```

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
Each route has a signature of `(req, res, ctx, done)`:
- __req:__ the server's unmodified `req` object
- __res:__ the server's unmodified `res` object
- __ctx:__ an object that can contain values and methods. Includes `.params`
  which are the parameters picked up from the `router` using the `:route`
  syntax in the route
- __done:__ a handler with a signature of `(err, stream)`, that takes either an
  error or a stream. If an error is passed it sets a statusCode of `500` and
  prints out the error to `stdout` and sends a `'server error'` reply. If a
  stream is passed it pipes the stream to `res` until it is done.

### handler = app.start()
Create a handler that can be passed directly into an `http` server.
```js
var merry = require('merry')
var http = require('http')

var app = merry()
app.router(['/', handleRoute])

var handler = app.start()
var server = http.createHttpServer()
server.listen(8080)

function handleRoute (req, res, ctx, done) {
  done(null, 'hello planet')
}
```

### app.listen()
Start the application directly
```js
var merry = require('merry')

var app = merry()
app.router(['/', handleRoute])
app.listen(8080)

function handleRoute (req, res, ctx, done) {
  done(null, 'hello planet')
}
```

### error = app.error(statusCode, message, err?)
Create an HTTP error with a statusCode and a message. By passing an erorr as
the third argument it will wrap the error using `explain-error` to keep prior
stack traces.

### app.log.method(log)
Send a log to the log output stream. See the [logging section](#logging) for
more details.

### env = merry.env(settings)
Create a new configuration client that reads environment variables from
`process.env` and validates them against configuration.

### notFound = merry.notFound()
Create a naive `/404` handler that can be passed into a path.

### routeHandler = merry.cors(handler)
Add CORS support for handlers. Adds an handler for the HTTP `OPTIONS` method to
catch preflight requests.

### merry.parse.json(req, handler(err, object))
Parse json in request body. Returns an object.

### merry.parse.text(req, handler(err, text))
Parse text in request body. Returns a string. You can alternativel use an alias 
of `merry.parse.string`.

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
