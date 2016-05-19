# merry [![stability][0]][1]
[![npm version][2]][3] [![build status][4]][5] [![test coverage][6]][7]
[![downloads][8]][9] [![js-standard-style][10]][11]

:sailboat::skull: _performance ahoy!_

A framework for creating nimble HTTP services. Compose REST API's at the speed
of thought.

## Features
- __fast:__ using `streams` and `cluster`, merry handles request like no other
- __secure:__ keep a leash on unix privileges
- __communicative:__ standardized [ndjson][ndjson] logs for everything
- __sincere:__ doesn't monkey patch Node's built-ins
- __linear:__ smoothless scaling from tinkering to production

## Usage
```js
const merry = require('merry')
const server = merry()

server.router((route) => [
  route('/', (req, res, param) => 'hello world!', [
    route(':name', {
      GET: (req, res, param) => `hello ${param.name}`),
      PUT: (req, res, param) => `updated ${param.name}`)
    }
  ])
])

server.listen(1337)
```

## Validation
`merry` provides you with the right handles to validate incoming requests. It
uses `JSON-schema` for request bodies, and allows you to pass custom validators
for all other fields:
```js
const merry = require('merry')

const server = merry()

const schema = `
  {
    "type": "object",
    "properties": {
      "message": {
        "type": "string"
      }
    },
    "required": [ "message" ]
  }
`

server.router((route) => [
  route('/message', {
    POST: {
      accepts: [ 'application/json' ],
      responds: [ 'application/json' ],
      body: schema,
      handler: (req, res, params, body) => 'received message: ${body.message}'
    })
  }
])

server.listen(1337)
```

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
