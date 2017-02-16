const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const auth = require('../controllers/auth')
const d = require('./fixtures/auth')
const knex = require('./fixtures/knex-instance')

test('Registers an organization', async t => {
  const req = {
    body: d.organization
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await auth.register(req, res, next)

  const row = await knex(d.table)
          .where('name', d.organization.name)
          .first()

  t.truthy(row, 'organization was created')
  t.true(res.send.calledOnce, 'response sent')
  t.true(res.send.calledWithMatch(201, sinon.match.object),
         'sent 201 response with object')
  t.false(next.called, 'no error')
})

test('Returns error when registering organization with missing data', async t => {
  const req = {
    body: d.organizationIncomplete
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await auth.register(req, res, next)

  const row = await knex(d.table)
          .where('name', d.organization.name)
          .first()

  t.falsy(row, 'organization not created')
  t.false(res.send.called, 'does not send response')
  t.true(
    next.calledWithMatch(
      sinon.match.instanceOf(restify.UnprocessableEntityError)),
    'returns error')
})

test('Authenticates an organization', async t => {
  const req = {
    body: d.authOrganization
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await knex(d.table).insert(d.authOrganizationHash)
  await auth.authenticate(req, res, next)

  t.true(res.send.calledWithMatch(sinon.match.object), 'responds with an object')
  t.false(next.called, 'no errors')
})

test.after.always('Clean up database', async t => {
  // Delete created organizations
  await knex(d.table)
    .where('email', d.organization.email)
    .del()
  await knex(d.table)
    .where('email', d.authOrganization.email)
    .del()
})
