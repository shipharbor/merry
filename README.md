<h1 align="center">merry</h1>

<div align="center">
  🌊🌊⛵️🌊🌊
</div>
<div align="center">
  <strong>Cute streaming API framework</strong>
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
  <a href="https://travis-ci.org/shipharbor/merry">
    <img src="https://img.shields.io/travis/shipharbor/merry/master.svg?style=flat-square"
      alt="Build Status" />
  </a>
  <!-- Test Coverage -->
  <a href="https://codecov.io/github/shipharbor/merry">
    <img src="https://img.shields.io/codecov/c/github/shipharbor/merry/master.svg?style=flat-square"
      alt="Test Coverage" />
  </a>
  <!-- Downloads -->
  <a href="https://npmjs.org/package/merry">
    <img src="https://img.shields.io/npm/dm/merry.svg?style=flat-square"
      alt="Downloads" />
  </a>
  <!-- Standard -->
  <a href="https://codecov.io/github/shipharbor/merry">
    <img src="https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square"
      alt="Standard" />
  </a>
</div>

<br />

Merry is a little Node framework that helps you build performant applications
with little effort. We don't think that "fast" and "cute" should be mutually
exclusive. Out of the box we've included consistent logging, standardized error
handling, a clean streams API and plenty of nuts, bolts and options to
customize merry to fit your use case. We hope you have a good time using it.
:v: _-Team Merry_

## Features
- __fast:__ using Node streams, merry handles request like no other
- __fun:__ helps with boring stuff like error handling
- __communicative:__ standardized [ndjson][ndjson] logs for everything
- __sincere:__ doesn't monkey patch Node's built-ins
- __linear:__ smooth sailing from tinkering to production
- __very cute:__ 🌊🌊⛵️🌊🌊

## Table of Content
- [Usage](#usage)
- [Logging](#logging)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Routing](#routing)
- [API](#api)
- [Installation](#installation)
- [See Also](#see-also)

## Usage
```js
var merry = require('./')

var app = merry()

app.route('GET', '/', function (req, res, ctx) {
  ctx.log.info('oh hey, a request here')
  ctx.send(200, { cute: 'butts' })
})

app.route('default', function (req, res, ctx) {
  ctx.log.info('Route doesnt exist')
  ctx.send(404, { message: 'nada butts here' })
})

app.listen(8080)
```

```sh
$ node index.js | merry
```

## Logging
Merry uses the `pino` logger under the hood. When you create a new `merry` app,
we enable a log forwarder that by default prints all logs to `process.stdout`.

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

app.route('GET', '/', function (req, res, ctx) {
  ctx.log.debug('it works!')
  ctx.log.info('hey')
  ctx.log.warn('oh')
  ctx.log.error('oh no!')
  ctx.log.fatal('send help')
})
```

The difference between an expected and unexpected error is that the first is
generally caused by a user (e.g. wrong password) and the system knows how to
respond, and the latter is caused by the system (e.g. there's no database) and
the system doesn't know how to handle it.

## Error handling
[tbi]

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
var env = { PORT: 8080 }
var app = merry({ env: env })
app.listen(app.env.PORT)
```

And then from the CLI do:
```sh
node ./server.js
// => port: 8080

PORT=1234 node ./server.js
// => port: 1234
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
app.route('GET', '/', handleIndex)
app.route('PUT', '/foo', handleFoo)
app.route('GET', '/foo/:bar', handleFoobarPartial)
app.listen()
```

Partial routes can be set using the `':'` delimiter. Any route that's
registered in this was will be passed to the `ctx` argument as a key. So
given a route of `/foo/:bar` and we call it with `/foo/hello`, it will show up
in `ctx` as `{ bar: 'hello' }`.

## API
### app = merry(opts)
Create a new instance of `merry`. Takes optional opts:
- __opts.logLevel:__ defaults to `'info'`. Determine the cutoff point for
  logging
- __opts.logStream:__ defaults to `process.stdout`. Set the output writable stream to
  write logs to
- __opts.env:__ pass an object containing env var assertions

### app.route(method, route, handler)
Register a new handler for a route and HTTP method.

### app.route('default', handler)
Register a new default handler that will be called if no other handlers match.

#### routes
Each route has a signature of `(req, res, ctx, done)`:
- __req:__ the server's unmodified `req` object
- __res:__ the server's unmodified `res` object
- __ctx:__ an object that can contain values and methods. Includes `.params`
  which are the parameters picked up from the `router` using the `:route`
  syntax in the route. Includes `.log[loglevel]` which can be used for logging
  and `.send(statusCode, data, [headers])` which can be used to send data.
  `send()` efficiently encodes objects to JSON and will set the appropriate
  headers

### handler = app.start()
Create a handler that can be passed directly into an `http` server. Useful if
you want https or http2 support:
```js
var merry = require('merry')
var http = require('http')

var app = merry()
app.route('GET', '/', handleRoute)

var handler = app.start()
var server = http.createServer(handler)
server.listen(8080)

function handleRoute (req, res, ctx, done) {
  done(null, 'hello planet')
}
```

### app.listen(port)
Start the application directly and listen on a port:
```js
var merry = require('merry')

var app = merry()
app.route('GET', '/', handleRoute)
app.listen(8080)

function handleRoute (req, res, ctx, done) {
  done(null, 'hello planet')
}
```

## Installation
```sh
$ npm install merry
```

## See Also
- [yoshuawuyts/choo](https://github.com/yoshuawuyts/choo) - fun frontend framework
- [yoshuawuyts/bankai](https://github.com/yoshuawuyts/bankai) - streaming asset compiler
- [yoshuawuyts/server-router](https://github.com/yoshuawuyts/server-router) - efficient server router
- [lrlna/pino-colada](https://github.com/lrlna/pino-colada) - cute ndjson formatter 

## License
[MIT](https://tldrlegal.com/license/mit-license)

[0]: https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square
[1]: https://nodejs.org/api/documentation.html#documentation_stability_index
[2]: https://img.shields.io/npm/v/merry.svg?style=flat-square
[3]: https://npmjs.org/package/merry
[4]: https://img.shields.io/travis/shipharbor/merry/master.svg?style=flat-square
[5]: https://travis-ci.org/shipharbor/merry
[6]: https://img.shields.io/codecov/c/github/shipharbor/merry/master.svg?style=flat-square
[7]: https://codecov.io/github/shipharbor/merry
[8]: http://img.shields.io/npm/dm/merry.svg?style=flat-square
[9]: https://npmjs.org/package/merry
[10]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square
[11]: https://github.com/feross/standard
[pino]: https://github.com/pinojs/pino
[ndjson]: http://ndjson.org/
[corsify]: https://github.com/Raynos/corsify
