const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/model')
const model = require('../controllers/model')

test('With kits', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis()
  }
  const result = model.withKits(fixt.req, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})
