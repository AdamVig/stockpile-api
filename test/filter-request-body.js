const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/filter-request-body')
const filterRequestBody = require('../services/filter-request-body')

test('Filter request body', t => {
  const req = {
    body: fixt.bodyWithLinks
  }
  const next = sinon.spy()

  t.true(typeof filterRequestBody() === 'function', 'returns a function')

  filterRequestBody()(req, null, next)
  t.deepEqual(req.body, fixt.bodyWithoutLinks, 'removes correct properties')
  t.true(next.calledOnce, 'calls next handler')

  const reqNoBody = {}
  t.notThrows(() => filterRequestBody()(reqNoBody, null, next), {},
              'passes through when no request body exists')
})
