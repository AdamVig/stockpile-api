const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/category')
const category = require('../controllers/category')

test('With custom fields', t => {
  const queryBuilder = {
    leftJoin: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis()
  }
  const result = category.withCustomFields(fixt.withCustomFields.req, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})
