const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/filter-query')
const filterQuery = require('../services/filter-query')

test('Filter query', t => {
  t.true(typeof filterQuery(null) === 'function', 'returns a function')
  const queryBuilderNoEffect = {
    where: sinon.spy()
  }
  filterQuery(d.req, d.wrongNames)(queryBuilderNoEffect)
  t.false(queryBuilderNoEffect.where.called,
          'has no effect when no params match')
  const queryBuilder = {
    where: sinon.spy()
  }
  filterQuery(d.req, d.names)(queryBuilder)
  t.true(queryBuilder.where.calledTwice,
          'each param is added to query')
})
