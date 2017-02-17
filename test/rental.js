const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/rental')
const knex = require('./fixtures/knex-instance')
const rental = require('../controllers/rental')

test.before('Insert fixtures', async t => {
  // Role
  const [roleID] = await knex('role').insert(d.role)

  // Organization
  const [organizationID] = await knex('organization').insert(d.organization)

  // User
  d.user.organizationID = organizationID
  d.user.roleID = roleID
  const [userID] = await knex('user').insert(d.user)

  // Item
  d.item.organizationID = organizationID
  const [itemID] = await knex('item').insert(d.item)

  // Rental
  d.rental.userID = userID
  d.rental.itemID = itemID
  d.rental.organizationID = organizationID
  const [rentalID] = await knex('rental').insert(d.rental)
  d.rentalID = rentalID
})

test('Get all returns a response', async t => {
  const req = {
    user: {organizationID: d.user.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.getAll(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
  t.false(next.called, 'no errors')
})

test('Get returns a response', async t => {
  const req = {
    params: {rentalID: d.rentalID},
    user: {organizationID: d.user.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.get(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
  t.false(next.called, 'no errors')
})

test('Create returns a response', async t => {
  const req = {
    body: d.rental,
    user: {organizationID: d.user.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await rental.create(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
  t.false(next.called, 'no errors')
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

test.after.always('Clean up database', async t => {
  await knex('rental').where(d.rental).del()
  await knex('item').where(d.item).del()
  await knex('user').where(d.user).del()
  await knex('organization').where('email', d.organization.email).del()
  await knex('role').where(d.role).del()
})
