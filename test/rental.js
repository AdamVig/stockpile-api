const moment = require('moment')
const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/rental')
const rental = require('../controllers/rental')
const knex = require('./fixtures/knex-instance')

test.before(async t => {
  // Create an organization
  const [organizationID] = await knex('organization').insert(fixt.organization)
  fixt.organization.organizationID = organizationID

  // Create a user
  fixt.user.organizationID = organizationID
  const [userID] = await knex('user').insert(fixt.user)
  fixt.user.userID = userID

  // Create a category
  fixt.category.organizationID = organizationID
  const [categoryID] = await knex('category').insert(fixt.category)
  fixt.category.categoryID = categoryID

  // Create a brand
  fixt.brand.organizationID = organizationID
  const [brandID] = await knex('brand').insert(fixt.brand)

  // Create a model
  fixt.model.brandID = brandID
  fixt.model.organizationID = organizationID
  const [modelID] = await knex('model').insert(fixt.model)
  fixt.model.modelID = modelID

  // Create two items
  for (const item of fixt.items) {
    item.organizationID = organizationID
    item.categoryID = fixt.category.categoryID
    item.modelID = fixt.model.modelID
    await knex('item').insert(item)
  }

  // Add created IDs to rental
  fixt.create.req.body.organizationID = fixt.organization.organizationID
  fixt.create.req.body.userID = fixt.user.userID
  fixt.create.req.body.items = fixt.items.map(item => ({
    barcode: item.barcode
  }))
  fixt.createv2.req.body.organizationID = fixt.organization.organizationID
  fixt.createv2.req.body.userID = fixt.user.userID

  fixt.updatev2.rental.organizationID = fixt.organization.organizationID
  fixt.updatev2.rental.userID = fixt.user.userID

  // Set rental dates
  const dateFormat = 'YYYY/MM/DD'
  const startDate = moment().format(dateFormat)
  const endDate = moment().add(10, 'days').format(dateFormat)
  fixt.create.req.body.start = startDate
  fixt.create.req.body.end = endDate
  fixt.updatev2.rental.start = startDate
  fixt.updatev2.rental.end = endDate
  fixt.createv2.req.body.startDate = startDate
  fixt.createv2.req.body.endDate = endDate
  fixt.updatev2.req.body.returnDate = endDate
})

test('Add user ID', t => {
  const next = sinon.spy()
  rental.addUserID(fixt.req, null, next)
  t.true(fixt.req.body.userID === fixt.userID, 'user ID is added to body')
  t.true(next.calledWithExactly(), 'next is called with no args')

  const nextBad = sinon.spy()
  rental.addUserID(fixt.reqBad, null, nextBad)
  t.true(nextBad.calledWithMatch(sinon.match.instanceOf(Error)),
    'next called with error')
})

test('With external renter', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis()
  }
  const result = rental.withExternalRenter(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('Create rental', async t => {
  fixt.create.req.user.organizationID = fixt.organization.organizationID
  fixt.create.req.user.userID = fixt.user.userID
  fixt.create.req.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.create(fixt.create.req, res, next)
  t.true(res.send.called, 'sends response')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})

test('Create rental (missing list of items)', async t => {
  fixt.createMissingList.req.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.create(fixt.createMissingList.req, res, next)
  t.true(next.calledWithMatch(sinon.match.instanceOf(restify.BadRequestError)), 'throws error')
  t.false(res.send.called, 'does not send response')
})

test('Create rental (v1)', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.create.versions[0](null, res, next)
  t.true(res.send.called, 'sends response')
  t.true(next.called, 'calls next handler')
})

test('Create rental (v2)', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.create.versions[1](fixt.createv2.req, res, next)
  t.true(res.send.called, 'sends response')
  t.true(next.called, 'calls next handler')
})

test('Update rental (v1)', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.update.versions[0](null, res, next)
  t.true(res.send.called, 'sends response')
  t.true(next.called, 'calls next handler')
})

test('Update rental (v2)', async t => {
  const [rentalID] = await knex('rental').insert(fixt.updatev2.rental)
  fixt.updatev2.req.params.rentalID = rentalID
  fixt.updatev2.req.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.update.versions[1](fixt.updatev2.req, res, next)
  t.true(res.send.called, 'sends response')
  t.true(next.called, 'calls next handler')
})

test.after.always(async t => {
  // Delete items first because they cause organization cascade delete to fail
  for (const item of fixt.items) {
    await knex('item').where(item).del()
  }
  // Delete organization (and all associated entities, via relations)
  await knex('organization').where('organizationID', fixt.organization.organizationID).del()
})
