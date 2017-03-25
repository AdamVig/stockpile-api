const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/log')
const log = require('../services/log')

test('Log exports an object', t => {
  t.true(typeof log === 'object')
})

test('Logs request', t => {
  const req = {
    log: {
      info: sinon.spy()
    }
  }
  const next = sinon.spy()
  log.onRequest(req, null, next)
  t.true(req.log.info.calledOnce, 'should output to log once')
  t.true(req.log.info.calledWithExactly({req}, sinon.match.string),
         'should log request with description')
  t.true(next.calledOnce, 'should call next() once')
})

test('Logs app start', t => {
  const logSpy = sinon.spy(log, 'info')
  log.onAppStart(fixt.app)
  t.true(logSpy.calledOnce, 'should output to log once')
  t.true(logSpy.calledWith(sinon.match.string, fixt.app.name, fixt.app.url),
        'should log application name and URL')
})
