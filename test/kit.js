const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/kit')
const kit = require('../controllers/kit')

test('With model details', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis()
  }
  const result = kit.withModelDetails(fixt.req, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('With kit ID', t => {
  const queryBuilder = {
    where: sinon.stub().returnsThis()
  }
  const result = kit.withKitID(fixt.req, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('Create kit model', async t => {
  // Add log method for error caused by invalid data
  fixt.createKitModelReq.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  // Causes error in the endpoint service, but tests kit controller properly
  await kit.createKitModel(fixt.createKitModelReq, res, next)
  t.truthy(next.called, 'causes an error within the endpoint service')
})

test('Create kit model with no model ID', async t => {
  const req = {
    body: {}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await kit.createKitModel(req, res, next)
  t.true(next.calledWithMatch(sinon.match.instanceOf(restify.BadRequestError)),
    'throws bad request error')
})
