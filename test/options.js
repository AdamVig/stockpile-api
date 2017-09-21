const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/options')
const options = require('../controllers/options')

test('Responds with 204 NO CONTENT when method is OPTIONS', t => {
  fixt.reqOptions.header = sinon.spy()
  const res = {
    header: sinon.spy(),
    send: sinon.spy()
  }
  const callback = sinon.spy()
  options.handle(fixt.reqOptions, res, null, callback)
  t.true(res.send.called, 'response sent')
  t.true(res.send.calledWithMatch(sinon.match.same(204)),
    'responds with 204')
})

test('Responds with 405 METHOD NOT ALLOWED when method is not OPTIONS', t => {
  fixt.req.header = sinon.spy()
  const res = {
    header: sinon.spy(),
    send: sinon.spy()
  }
  const callback = sinon.spy()
  options.handle(fixt.req, res, null, callback)
  t.true(res.send.called, 'response sent')
  t.true(res.send.calledWithMatch(new restify.MethodNotAllowedError()),
    'responds with Restify 405 error')
})
