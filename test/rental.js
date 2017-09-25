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
  fixt.create.req.body.items = fixt.items

  // Set rental dates
  const dateFormat = 'YYYY/MM/DD'
  fixt.create.req.body.startDate = moment().format(dateFormat)
  fixt.create.req.body.endDate = moment().add(10, 'days').format(dateFormat)
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

test('Create rental', async t => {
  fixt.create.req.user.organizationID = fixt.organization.organizationID
  fixt.create.req.user.userID = fixt.user.userID
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.create(fixt.create.req, res, next)
  t.true(res.send.called, 'sends response')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})

test('Create rental (missing list of items)', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await rental.create(fixt.createMissingList.req, res, next)
  t.true(next.calledWithMatch(sinon.match.instanceOf(restify.BadRequestError)), 'throws error')
  t.false(res.send.called, 'does not send response')
})

test.after.always(async t => {
  // Delete items first because they cause organization cascade delete to fail
  for (const item of fixt.items) {
    await knex('item').where(item).del()
  }
  // Delete organization (and all associated entities, via relations)
  await knex('organization').where('organizationID', fixt.organization.organizationID).del()
})
