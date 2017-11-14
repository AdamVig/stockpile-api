const sinon = require('sinon')
const test = require('ava')

const knex = require('./fixtures/knex-instance')
const fixt = require('./fixtures/item')
const item = require('../controllers/item')

test.before(async t => {
  const [organizationID] = await knex('organization').insert(fixt.updateCustomField.organization)
  fixt.updateCustomField.organization.organizationID = organizationID
  fixt.getCustomField.req.user.organizationID = organizationID
  fixt.getCustomFields.req.user.organizationID = organizationID

  fixt.updateCustomField.category.organizationID = organizationID
  const [categoryID] = await knex('category').insert(fixt.updateCustomField.category)
  fixt.updateCustomField.category.categoryID = categoryID

  fixt.updateCustomField.brand.organizationID = organizationID
  const [brandID] = await knex('brand').insert(fixt.updateCustomField.brand)
  fixt.updateCustomField.brand.brandID = brandID

  fixt.updateCustomField.model.organizationID = organizationID
  fixt.updateCustomField.model.brandID = brandID
  const [modelID] = await knex('model').insert(fixt.updateCustomField.model)
  fixt.updateCustomField.model.modelID = modelID

  fixt.updateCustomField.item.organizationID = organizationID
  fixt.updateCustomField.item.categoryID = categoryID
  fixt.updateCustomField.item.modelID = modelID
  await knex('item').insert(fixt.updateCustomField.item)

  fixt.getCustomFields.item.organizationID = organizationID
  fixt.getCustomFields.item.categoryID = categoryID
  fixt.getCustomFields.item.modelID = modelID
  await knex('item').insert(fixt.getCustomFields.item)

  fixt.updateCustomField.customField.organizationID = organizationID
  const [customFieldID] = await knex('customField').insert(fixt.updateCustomField.customField)
  fixt.updateCustomField.customField.customFieldID = customFieldID
  fixt.updateCustomField.req.params.customFieldID = customFieldID
  fixt.getCustomFields.itemCustomField.customFieldID = customFieldID
  fixt.getCustomField.req.params.customFieldID = customFieldID

  await knex('itemCustomField').insert(fixt.getCustomFields.itemCustomField)
})

test('With fields and filters', t => {
  const queryBuilder = {
    leftJoin: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  item.withFieldsAndFilters(fixt.req, queryBuilder)
  t.true(queryBuilder.modify.called, 'filters are added to request')
})

test('Paginate rentals', t => {
  const queryBuilder = {
    modify: sinon.stub().returnsThis()
  }
  const result = item.paginateRentals(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('With active rental', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis(),
    orderBy: sinon.stub().returnsThis()
  }
  const result = item.withActiveRental(fixt.activeRentalReq, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('For item', t => {
  const queryBuilder = {
    where: sinon.stub().returnsThis()
  }
  const result = item.forItem(fixt.reqForItem, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('With field type', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  const result = item.withFieldType(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('With custom field details', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  const result = item.withCustomFieldDetails(fixt.reqForItem, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('With custom fields', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    leftJoin: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis()
  }
  const result = item.withCustomFields(fixt.reqForItem, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})
test('Update item custom field', async t => {
  fixt.updateCustomField.req.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.updateCustomField(fixt.updateCustomField.req, res, next)

  t.true(res.send.calledOnce, 'sends response')
  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})
test('Get all item custom fields', async t => {
  fixt.getCustomFields.req.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.getCustomFields(fixt.getCustomFields.req, res, next)

  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})
test('Get item custom field', async t => {
  fixt.getCustomField.req.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.getCustomField(fixt.getCustomField.req, res, next)

  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})
test('Update item custom field with invalid data', async t => {
  fixt.updateCustomFieldInvalid.req.log = {
    error: sinon.spy()
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await item.updateCustomField(fixt.updateCustomFieldInvalid.req, res, next)

  t.false(res.send.called, 'does not send response')
  t.true(next.called, 'calls next handler')
  t.true(next.calledWithMatch(sinon.match.instanceOf(Error)), 'throws error')
})
test.after.always(async t => {
  await knex('itemCustomField').where({
    barcode: fixt.updateCustomField.item.barcode,
    customFieldID: fixt.updateCustomField.customField.customFieldID
  }).del()
  await knex('itemCustomField').where({
    barcode: fixt.getCustomFields.item.barcode,
    customFieldID: fixt.getCustomFields.itemCustomField.customFieldID
  }).del()
  await knex('customField').where(fixt.updateCustomField.customField).del()
  await knex('item').where(fixt.updateCustomField.item).del()
  await knex('item').where(fixt.getCustomFields.item).del()
  await knex('model').where(fixt.updateCustomField.model).del()
  await knex('brand').where(fixt.updateCustomField.brand).del()
  await knex('category').where(fixt.updateCustomField.category).del()
  await knex('organization').where(fixt.updateCustomField.organization).del()
})
