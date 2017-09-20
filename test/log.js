const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/log')
const log = require('../services/log')

test('Log exports an object', t => {
  t.true(typeof log === 'object')
})

const logLevel = {
  info: 30,
  debug: 20
}

test('Sets default log level correctly', t => {
  t.true(log.streams.every(stream => stream.level === logLevel.info), 'all streams have info level')
})

test('Sets log level correctly in dev environment', t => {
  const previousNodeEnv = process.env.NODE_ENV

  process.env.NODE_ENV = 'development'
  // Remove cached module so it instantiates itself again
  delete require.cache[require.resolve('../services/log')]
  const logDev = require('../services/log')

  t.true(logDev.streams.every(stream => stream.level === logLevel.debug), 'all streams have debug level')

  process.env.NODE_ENV = previousNodeEnv
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

test('Logs request with no body or parameters', t => {
  const req = {
    log: {
      debug: sinon.spy(),
      info: sinon.spy()
    }
  }
  const next = sinon.spy()
  log.onRequest(req, null, next)
  t.true(req.log.info.calledWith({req}, 'request'), 'logs request')
  t.false(req.log.debug.calledWith({body: undefined}, 'request body'), 'does not log body')
  t.false(req.log.debug.calledWith({params: undefined}, 'request parameters'), 'does not log params')
  t.true(next.called, 'calls next handler')
})

test('Logs request with body', t => {
  const req = {
    body: {},
    log: {
      debug: sinon.spy(),
      info: sinon.spy()
    }
  }
  const next = sinon.spy()
  log.onRequest(req, null, next)
  t.true(req.log.info.calledWith({req}, 'request'), 'logs request')
  t.true(req.log.debug.calledWith({body: req.body}, 'request body'), 'logs body')
  t.false(req.log.debug.calledWith({params: undefined}, 'request parameters'), 'does not log params')
  t.true(next.called, 'calls next handler')
})

test('Redacts password from request body', t => {
  const req = {
    // Copy fixture body so it can be used for checking body later
    body: Object.assign({}, fixt.redactsPassword.body),
    log: {
      debug: sinon.spy(),
      info: sinon.spy()
    }
  }
  const next = sinon.spy()
  log.onRequest(req, null, next)
  t.true(req.log.debug.calledWith({body: fixt.redactsPassword.expectedLoggedBody}, 'request body'),
    'logs body with redacted password')
  t.deepEqual(req.body, fixt.redactsPassword.body, 'does not modify actual request body')
  t.true(next.called, 'calls next handler')
})

test('Logs request with parameters', t => {
  const req = {
    log: {
      debug: sinon.spy(),
      info: sinon.spy()
    },
    params: {}
  }
  const next = sinon.spy()
  log.onRequest(req, null, next)
  t.true(req.log.info.calledWith({req}, 'request'), 'logs request')
  t.false(req.log.debug.calledWith({body: undefined}, 'request body'), 'does not log body')
  t.true(req.log.debug.calledWith({params: req.params}, 'request parameters'), 'logs params')
  t.true(next.called, 'calls next handler')
})

test('Logs error', t => {
  const req = {
    log: {
      error: sinon.spy()
    }
  }
  const err = {}
  const callback = sinon.spy()
  log.onError(req, null, err, callback)
  t.true(req.log.error.calledWith(err), 'logs error')
  t.true(callback.called, 'calls next handler')
})

test('Logs response', t => {
  const req = {
    log: {
      info: sinon.spy()
    }
  }
  const res = {}
  log.onResponse(req, res, null, null)
  t.true(req.log.info.calledWith({res}, 'response'), 'logs response')
})

test('Does not log response with error', t => {
  const req = {
    log: {
      info: sinon.spy()
    }
  }
  const res = {}
  const err = {}
  log.onResponse(req, res, null, err)
  t.false(req.log.info.called, 'does not log response')
})

test('Logs app start', t => {
  const logSpy = sinon.spy(log, 'info')
  log.onAppStart(fixt.app)
  t.true(logSpy.calledOnce, 'should output to log once')
  t.true(logSpy.calledWith(sinon.match.string, fixt.app.name, fixt.app.url),
    'should log application name and URL')
})
