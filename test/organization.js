const sinon = require('sinon')
const test = require('ava')

const organization = require('../controllers/organization')

test('Get returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await organization.get(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Create returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await organization.create(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Update returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await organization.update(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Delete returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await organization.delete(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})
