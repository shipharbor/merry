#!/usr/bin/env node

var pretty = require('pino-colada')

process.stdin
  .pipe(pretty())
  .pipe(process.stdout)
