// this file is just a js file that a typescript worker can be loaded
// from as node runtime
/* eslint-disable @typescript-eslint/no-var-requires */
const { resolve } = require('path');
const { register } = require('ts-node');

register();
require(resolve(__dirname, './MochaEsbuildWorker.ts'));
