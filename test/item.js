const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/item')
const item = require('../controllers/item')
const knex = require('./fixtures/knex-instance')

test.before('Add fixtures to database', async t => {
  // Add organization
  const organizationID = await knex('organization').insert(d.organization)
  d.organizationID = organizationID

  // Assign organization ID of created organization to each item
  d.items.forEach(item => { item.organizationID = organizationID[0] })

  // Add items
  const firstItemID = await knex('item').insert(d.items[0])
  const secondItemID = await knex('item').insert(d.items[1])

  // Assign item ID of each created item to item fixtures
  d.items[0].itemID = firstItemID[0]
  d.items[1].itemID = secondItemID[0]
})

test('Get all returns a response', async t => {
  const req = {
    user: {organizationID: d.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.getAll(req, res, next)
  t.true(res.send.calledOnce, 'sends one response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'responds with an object')
  // Two items inserted, so should be two or more in the table
  t.true(res.send.calledWithMatch(sinon.match(({items}) =>
                                              items.length >= 2)),
         'responds with the right number of items')
  t.false(next.called, 'no errors')
})

test('Get returns a response', async t => {
  const req = {
    params: {itemID: d.items[0].itemID},
    user: {organizationID: d.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.get(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
  t.false(next.called, 'no errors')
})

test('Create returns a response', async t => {
  const req = {
    body: d.items[2],
    user: {organizationID: d.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.create(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
  t.false(next.called, 'no errors')
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
  const res = {
    send: sinon.spy()
  }
  await item.delete(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test.after.always('Clean up database', async t => {
  // Delete all items
  for (const item of d.items) {
    await knex('item').where(item).del()
  }
  // Delete organization
  await knex('organization').where(d.organization).del()
})
