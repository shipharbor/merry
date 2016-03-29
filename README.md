# merry [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

merry is a modular server framework built for speed. It's grounded in years of
experience building solid HTTP services. A transparent CLI coupled with a set
of battle-tested components provide everything needed to efficiently build
performant Node servers.

## Features
- Covers most common use cases
- Doesn't override Node built-ins
- Consistent error handling
- Super cute logs
- Fast routing
- Basically a giant grab bag of best practices

## Usage
```sh
$ merry index.js -p 1337 -l debug -e development
```
```js
const NotFound = require('merry/not-found')
const Cluster = require('merry/cluster')
const Config = require('merry/config')
const Signal = require('merry/signal')
const Logger = require('merry/logger')
const Router = require('merry/router')
const Info = requre('merry/info')
const bankai = require('bankai')
const http = require('http')

const log = Logger('main')
const info = Info(log)

module.exports = main

// allow interfacing through CLI
if (!module.parent) {
  const config = Config({
    LOG_LEVEL: 'info',
    API_PORT: 1337,
    NODE_ENV: String
  })

  const cluster = Cluster()
  cluster.master(function () {
    info.config(config)
    Signal(log.error, cluster.close)
  })
  cluster.worker(function () {
    main(config)
  })
  cluster.start()
}

// load configuration and init server
function main (config) {
  Logger.output({ level: config.LOG_LEVEL, stream: process.stdout })

  const router = createRouter(config)
  const server = http.createServer(function (req, res) {
    router(req, res).pipe(Sink(req, res, log.debug))
  }).listen(config.API_PORT)

  return info.server(server)
}

// bootstrap a router
function createRouter (config) {
  const router = serverRouter('/404')
  router.on('/404', NotFound())
  router.on('/', bankai.html())
  return router
}
```

## API
### merry/body
### merry/cluster
### merry/cookie
### merry/error
### merry/http
### merry/logger
### merry/mime
### merry/multipart
### merry/redirect
### merry/router
### merry/uncaught

## Why?
npm offers a great selection of packages, but they're [not very
discoverable][12]. This package bundles the ecosystem to cover 90% of what
servers should do, allowing you to customize it where needed. If there's
something you don't like, that's fine - everything is built around
`require('http')` and plays well with others.

## Installation
```sh
$ npm install merry
```

## See Also
- [http-framework](https://github.com/raynos/http-framework) - the original
  modular http framework
- [mississippi](https://github.com/maxogden/mississippi) - modular streams
  framework
- [yo-yo](https://github.com/maxogden/yo-yo) - modular DOM framework
- [virtual-app](https://github.com/sethvincent) - modular client framework
- [level](https://github.com/Level/level) - modular database
- [bankai](https://github.com/yoshuawuyts/bankai) - modular asset framework
- [abstract-blob-store](https://github.com/maxogden/abstract-blob-store) -
  modular object storage framework
- [tape](https://github.com/substack/tape) - TAP test runner

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
[12]: https://twitter.com/seldo/status/658802369983938560
