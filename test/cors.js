const sinon = require('sinon')
const test = require('ava')

const cors = require('../controllers/cors')

test('Sets headers', t => {
  const req = {
    header: sinon.spy()
  }
  const res = {
    header: sinon.spy()
  }
  const next = sinon.spy()
  cors.handle(req, res, next)
  t.true(res.header.calledWith('Access-Control-Allow-Origin') &&
    res.header.calledWith('Access-Control-Allow-Headers') &&
    res.header.calledWith('Access-Control-Allow-Methods'),
  'sets headers')
  t.true(next.called, 'calls next handler')
})
