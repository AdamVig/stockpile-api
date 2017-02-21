const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/options')
const options = require('../controllers/options')

test('Responds with 204 NO CONTENT when method is OPTIONS', t => {
  const res = {
    send: sinon.spy()
  }
  options.handle(d.reqOptions, res, null)
  t.true(res.send.called, 'response sent')
  t.true(res.send.calledWithMatch(sinon.match.same(204)),
         'responds with 204')
})

test('Responds with 405 METHOD NOT ALLOWED when method is not OPTIONS', t => {
  const res = {
    send: sinon.spy()
  }
  options.handle(d.req, res, null)
  t.true(res.send.called, 'response sent')
  t.true(res.send.calledWithMatch(new restify.MethodNotAllowedError()),
         'responds with Restify 405 error')
})
