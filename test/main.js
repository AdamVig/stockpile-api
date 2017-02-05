const sinon = require('sinon')
const test = require('ava')

const main = require('../controllers/main')

test('Returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await main.get(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})
