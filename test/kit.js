const sinon = require('sinon')
const test = require('ava')

const kit = require('../controllers/kit')

test('With models', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  const result = kit.withModels(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})
