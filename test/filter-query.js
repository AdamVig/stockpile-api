const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/filter-query')
const filterQuery = require('../services/filter-query')

test('Filter query', t => {
  t.true(typeof filterQuery(null) === 'function', 'returns a function')
  const queryBuilderNoEffect = {
    where: sinon.spy()
  }
  const wrongParamNames = new Map()
  wrongParamNames.set(fixt.wrongNames[0], fixt.wrongNames[0])
  wrongParamNames.set(fixt.wrongNames[1], fixt.wrongNames[1])
  filterQuery(fixt.req, wrongParamNames)(queryBuilderNoEffect)
  t.false(queryBuilderNoEffect.where.called,
          'has no effect when no params match')
  const queryBuilder = {
    where: sinon.spy()
  }
  const paramNames = new Map()
  paramNames.set(fixt.names[0], fixt.names[0])
  paramNames.set(fixt.names[1], fixt.names[1])
  filterQuery(fixt.req, paramNames)(queryBuilder)
  t.true(queryBuilder.where.calledTwice,
          'each param is added to query')
})
