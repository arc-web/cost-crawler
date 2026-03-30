#!/usr/bin/env node

const { createCLI } = require('../dist/cli/index.js');

createCLI().parse(process.argv);
