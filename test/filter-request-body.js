const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/filter-request-body')
const filterRequestBody = require('../services/filter-request-body')

test('Filter request body', t => {
  const req = {
    body: d.bodyWithLinks
  }
  const next = sinon.spy()

  t.true(typeof filterRequestBody() === 'function', 'returns a function')

  filterRequestBody()(req, null, next)
  t.deepEqual(req.body, d.bodyWithoutLinks, 'removes correct properties')
  t.true(next.calledOnce, 'calls next handler')

  const reqNoBody = {}
  t.notThrows(() => filterRequestBody()(reqNoBody, null, next), {},
              'passes through when no request body exists')
})
