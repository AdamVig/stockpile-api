const test = require('ava')

const log = require('../services/log')

test('Log exports an object', t => {
  t.true(typeof log === 'object')
})
