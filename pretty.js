#!/usr/bin/env node

const garnish = require('garnish')

process.stdin
  .pipe(garnish())
  .pipe(process.stdout)
