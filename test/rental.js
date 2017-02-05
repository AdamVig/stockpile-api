const sinon = require('sinon')
const test = require('ava')

const rental = require('../controllers/rental')

test('Get all returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await rental.getAll(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Get returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await rental.get(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Create returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await rental.create(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Update returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await rental.update(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Delete returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await rental.delete(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})
