const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/item')
const item = require('../controllers/item')

test('With fields and filters', t => {
  const queryBuilder = {
    leftJoin: function () { return this },
    modify: sinon.spy(),
    select: function () { return this }
  }
  const actual = item.withFieldsAndFilters(d.req, queryBuilder)
  t.true(queryBuilder.modify.called, 'filters are added to request')
  t.true(typeof actual === 'object', 'returns an object')
})
