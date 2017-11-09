const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/filter-query')
const filterQuery = require('../services/filter-query')

test('Filter query', t => {
  const queryBuilder = {
    where: sinon.spy()
  }
  const paramNames = new Map()
  paramNames.set(fixt.names[0], fixt.names[0])
  paramNames.set(fixt.names[1], fixt.names[1])
  const result = filterQuery(queryBuilder, fixt.req, paramNames)
  t.true(queryBuilder.where.calledTwice, 'each param is added to query')
  t.is(result, queryBuilder, 'returns query builder')
})

test('Filter query when no params match', t => {
  const queryBuilder = {
    where: sinon.spy()
  }
  const wrongParamNames = new Map()
  wrongParamNames.set(fixt.wrongNames[0], fixt.wrongNames[0])
  wrongParamNames.set(fixt.wrongNames[1], fixt.wrongNames[1])
  const result = filterQuery(queryBuilder, fixt.req, wrongParamNames)
  t.false(queryBuilder.where.called, 'has no effect when no params match')
  t.is(result, queryBuilder, 'returns query builder')
})

test('Filter query when no params provided', t => {
  const queryBuilder = {
    where: sinon.spy()
  }
  const result = filterQuery(queryBuilder, fixt.req)
  t.false(queryBuilder.where.called, 'has no effect when no params provided')
  t.is(result, queryBuilder, 'returns query builder')
})
