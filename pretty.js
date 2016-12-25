#!/usr/bin/env node

var pretty = require('pino/pretty')

process.stdin
  .pipe(pretty())
  .pipe(process.stdout)
