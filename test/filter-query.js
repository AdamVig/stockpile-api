const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/filter-query')
const filterQuery = require('../services/filter-query')

test('Filter query', t => {
  t.true(typeof filterQuery(null) === 'function', 'returns a function')
  const queryBuilderNoEffect = {
    where: sinon.spy()
  }
  const wrongParamNames = new Map()
  wrongParamNames.set(d.wrongNames[0], d.wrongNames[0])
  wrongParamNames.set(d.wrongNames[1], d.wrongNames[1])
  filterQuery(d.req, wrongParamNames)(queryBuilderNoEffect)
  t.false(queryBuilderNoEffect.where.called,
          'has no effect when no params match')
  const queryBuilder = {
    where: sinon.spy()
  }
  const paramNames = new Map()
  paramNames.set(d.names[0], d.names[0])
  paramNames.set(d.names[1], d.names[1])
  filterQuery(d.req, paramNames)(queryBuilder)
  t.true(queryBuilder.where.calledTwice,
          'each param is added to query')
})
