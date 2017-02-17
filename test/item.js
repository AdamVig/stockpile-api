const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/item')
const item = require('../controllers/item')

test('Get all returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await item.getAll(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Get returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await item.get(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Create returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await item.create(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Update returns a response', async t => {
  const res = {
    send: sinon.spy()
  }
  await item.update(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test('Delete returns a response', async t => {
  const req = {
    params: {itemID: d.itemID},
    user: {organizationID: d.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.getAll(null, res, null)
  await item.delete(req, res, next)
  t.true(res.send.calledTwice, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
})
