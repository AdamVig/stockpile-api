const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/item')
const item = require('../controllers/item')

test('With fields and filters', t => {
  const queryBuilder = {
    leftJoin: function () { return this },
    modify: sinon.spy(),
    select: function () { return this }
  }
  item.withFieldsAndFilters(fixt.req, queryBuilder)
  t.true(queryBuilder.modify.called, 'filters are added to request')
})
