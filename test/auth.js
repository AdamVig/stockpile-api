const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const auth = require('../controllers/auth')
const fixt = require('./fixtures/auth')
const knex = require('./fixtures/knex-instance')

test('Registers an organization', async t => {
  const req = {
    body: fixt.organization
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await auth.register(req, res, next)

  const row = await knex(fixt.table)
          .where('name', fixt.organization.name)
          .first()

  t.truthy(row, 'organization was created')
  t.true(res.send.calledOnce, 'response sent')
  t.true(res.send.calledWithMatch(201, sinon.match.object),
         'sent 201 response with object')
  t.false(next.called, 'no error')
})

test('Returns error when registering organization with missing data', async t => {
  const req = {
    body: fixt.organizationIncomplete
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await auth.register(req, res, next)

  const row = await knex(fixt.table)
          .where('name', fixt.organization.name)
          .first()

  t.falsy(row, 'organization not created')
  t.false(res.send.called, 'does not send response')
  t.true(
    next.calledWithMatch(
      sinon.match.instanceOf(restify.BadRequestError)),
    'returns error')
})

test('Authenticates an organization', async t => {
  const req = {
    body: fixt.authOrganization
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await knex(fixt.table).insert(fixt.authOrganizationHash)
  await auth.authenticate(req, res, next)

  t.true(res.send.calledWithMatch(sinon.match.object), 'responds with an object')
  t.false(next.called, 'no errors')

  const reqNoPassword = {
    body: fixt.authOrganizationNoPassword
  }
  const nextNoPassword = sinon.spy()
  await auth.authenticate(reqNoPassword, null, nextNoPassword)
  t.true(nextNoPassword.calledWithMatch(
    sinon.match.instanceOf(restify.BadRequestError)),
         'throws error when request is missing fields')
})

test('Returns error when email and password do not match', async t => {
  const req = {
    body: fixt.authOrganizationWrong
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await knex(fixt.table).insert(fixt.authOrganizationWrongHash)
  await auth.authenticate(req, res, next)

  t.false(res.send.called, 'does not respond')
  t.true(next.called, 'returns an error')
})

test('Authenticate token', async t => {
  // Insert organization into db and add ID to test data
  const [organizationID] = await knex(fixt.table).insert(fixt.tokenOrganization)
  fixt.payload.sub = organizationID
  fixt.tokenOrganization.organizationID = organizationID

  const done = sinon.spy()
  await auth.authenticateToken(fixt.payload, done)
  t.true(done.calledWith(null, fixt.tokenOrganization),
         'authenticates organization')

  const doneNoUser = sinon.spy()
  await auth.authenticateToken(fixt.payloadNoUser, doneNoUser)
  t.true(doneNoUser.calledWithMatch(sinon.match.instanceOf(Error)),
         'does not authenticate missing organization')
})

test('Check user', t => {
  const req = {
    body: fixt.authOrganization
  }
  const reqWithUser = {
    body: fixt.authOrganization,
    user: {}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  auth.checkUser(reqWithUser, res, next)
  t.true(res.send.calledWith(200), 'success response sent')
  auth.checkUser(req, res, next)
  t.true(next.calledWith(restify.NotFoundError()), 'error passed to next handler')
})

test.after.always('Clean up database', async t => {
  // Delete created organizations
  await knex(fixt.table)
    .where('email', fixt.organization.email)
    .del()
  await knex(fixt.table)
    .where('email', fixt.authOrganization.email)
    .del()
  await knex(fixt.table)
    .where('email', fixt.authOrganizationWrong.email)
    .del()
  await knex(fixt.table)
    .where('email', fixt.tokenOrganization.email)
    .del()
})
