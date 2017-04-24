const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/item')
const item = require('../controllers/item')

test('With fields and filters', t => {
  const queryBuilder = {
    leftJoin: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  item.withFieldsAndFilters(fixt.req, queryBuilder)
  t.true(queryBuilder.modify.called, 'filters are added to request')
})

test('With rentals', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  const result = item.withRentals(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})
