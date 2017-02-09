const test = require('ava')

const app = require('../index')

test('Exports Restify application', t => {
  t.truthy(app)
})
