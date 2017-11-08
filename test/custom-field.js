const errors = require('restify-errors')
const sinon = require('sinon')
const test = require('ava')

const customFieldController = require('../controllers/custom-field')
const fixt = require('./fixtures/custom-field')
const knex = require('./fixtures/knex-instance')

test.before(async t => {
  // Create an organization
  const [organizationID] = await knex('organization').insert(fixt.organization)
  fixt.organization.organizationID = organizationID

  // Add organizationID to all categories
  fixt.categories = fixt.categories.map(category => {
    category.organizationID = organizationID
    return category
  })

  // Create categories
  for (const category of fixt.categories) {
    const [categoryID] = await knex('category').insert(category)
    category.categoryID = categoryID
  }

  // Create custom fields
  fixt.customFields[0].organizationID = organizationID
  fixt.customFields[1].organizationID = organizationID
  fixt.updateCategories.req.params.customFieldID = await knex('customField').insert(fixt.customFields[0])
  fixt.addMissingCategory.req.params.customFieldID = await knex('customField').insert(fixt.customFields[1])

  // Add categories to requests
  fixt.updateCategoriesMissingField.req.body.categories = fixt.categories
  fixt.updateCategories.req.body.categories = fixt.categories
})

test('With names', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis()
  }
  const result = customFieldController.withNames(fixt.withCategoryName.req, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('Update categories with no body', async t => {
  const next = sinon.spy()
  await customFieldController.updateCategories(fixt.updateCategoriesNoBody.req, null, next)
  t.true(next.calledWithMatch(sinon.match.instanceOf(errors.BadRequestError)), 'throws bad request error')
})

// Tests that update categories must be run serially because they create deadlock when run asynchronously

test.serial('Update categories on nonexistent custom field', async t => {
  const next = sinon.spy()
  await customFieldController.updateCategories(fixt.updateCategoriesMissingField.req, null, next)
  t.true(next.calledWithMatch(sinon.match.instanceOf(errors.BadRequestError)), 'throws bad request error')
})

test.serial('Add nonexistent category to custom field', async t => {
  const next = sinon.spy()
  await customFieldController.updateCategories(fixt.addMissingCategory.req, null, next)
  t.true(next.calledWithMatch(sinon.match.instanceOf(errors.BadRequestError)), 'throws bad request error')
})

test.serial('Update categories on custom field', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await customFieldController.updateCategories(fixt.updateCategories.req, res, next)
  t.true(res.send.called, 'sends response')
  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'no errors')
})

test.after.always(async t => {
  await knex('customField').where('organizationID', fixt.organization.organizationID).del()
  await knex('category').where('organizationID', fixt.organization.organizationID).del()
  await knex('organization').where('organizationID', fixt.organization.organizationID).del()
})
