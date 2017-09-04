const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const auth = require('../controllers/auth')
const fixt = require('./fixtures/auth')
const knex = require('./fixtures/knex-instance')

test.before('Create organization', async t => {
  const [organizationID] = await knex('organization')
        .insert(fixt.organization)
  fixt.user.organizationID = organizationID
  fixt.userIncomplete.organizationID = organizationID
  fixt.authUser.organizationID = organizationID
  fixt.authUserNoPassword.organizationID = organizationID
  fixt.authUserHash.organizationID = organizationID
  fixt.authUserWrong.organizationID = organizationID
  fixt.authUserWrongHash.organizationID = organizationID
  fixt.tokenUser.organizationID = organizationID
  fixt.refreshTokenUser.organizationID = organizationID
  fixt.refreshTokenInvalidUser.organizationID = organizationID
})

test('Make token', t => {
  const token = auth.makeToken(fixt.makeToken.userID,
    fixt.makeToken.organizationID,
    fixt.makeToken.roleID)
  t.truthy(token, 'returns token')
})

test('Registers a user', async t => {
  const req = {
    body: fixt.user,
    params: {}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await auth.register(req, res, next)

  const row = await knex(fixt.table)
          .where(fixt.primaryKey, res.send.args[0][1].userID)
          .first()

  t.truthy(row, 'user was created')
  t.true(res.send.calledOnce, 'response sent')
  t.true(res.send.calledWithMatch(201, sinon.match.object),
    'sent 201 response with object')
  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'no errors')
})

test('Returns error when registering user with missing data', async t => {
  const req = {
    body: fixt.userIncomplete
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await auth.register(req, res, next)

  const row = await knex(fixt.table)
          .where('firstName', fixt.userIncomplete.firstName)
          .where('lastName', fixt.userIncomplete.lastName)
          .first()

  t.falsy(row, 'user not created')
  t.false(res.send.called, 'does not send response')
  t.true(
    next.calledWithMatch(
      sinon.match.instanceOf(restify.BadRequestError)),
    'returns error')
})

test('Authenticates a user', async t => {
  const req = {
    body: fixt.authUser
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await knex(fixt.table).insert(fixt.authUserHash)
  await auth.authenticate(req, res, next)

  t.true(res.send.calledWithMatch(sinon.match.object), 'responds with an object')
  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'no errors')

  const resRefreshTokenUpdate = {
    send: sinon.spy()
  }

  await auth.authenticate(req, resRefreshTokenUpdate, next)

  t.true(resRefreshTokenUpdate.send.calledWithMatch(sinon.match.object),
    'responds with an object when refresh token already exists')
  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'no errors when refresh token already exists')

  const reqNoPassword = {
    body: fixt.authUserNoPassword
  }
  const nextNoPassword = sinon.spy()
  await auth.authenticate(reqNoPassword, null, nextNoPassword)
  t.true(nextNoPassword.calledWithMatch(
    sinon.match.instanceOf(restify.BadRequestError)),
    'throws error when request is missing fields')

  const reqBadEmail = {
    body: fixt.authUserBadEmail
  }
  const nextBadEmail = sinon.spy()
  await auth.authenticate(reqBadEmail, null, nextBadEmail)
  t.true(nextBadEmail.calledWithMatch(
    sinon.match.instanceOf(restify.UnauthorizedError)),
    'throws error when user does not exist')
})

test('Returns error when email and password do not match', async t => {
  const req = {
    body: fixt.authUserWrong
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await knex(fixt.table).insert(fixt.authUserWrongHash)
  await auth.authenticate(req, res, next)

  t.false(res.send.called, 'does not respond')
  t.true(next.called, 'returns an error')
})

test('Refresh token', async t => {
  // Insert user
  const [userID] = await knex(fixt.table).insert(fixt.refreshTokenUser)
  fixt.refreshTokenRow.userID = userID
  fixt.refreshTokenReq.body.userID = userID

  // Insert refresh token
  await knex('refreshToken').insert(fixt.refreshTokenRow)

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await auth.refresh(fixt.refreshTokenReq, res, next)

  t.true(res.send.calledOnce, 'response sent')
  t.true(next.called, 'calls next handler')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'no errors')

  // Clean up database
  await knex('refreshToken').where(fixt.refreshTokenRow).del()
  await knex(fixt.table).where('userID', userID).del()
})

test('Refresh token with invalid refresh token', async t => {
  // Insert user
  const [userID] = await knex(fixt.table).insert(fixt.refreshTokenInvalidUser)
  fixt.refreshTokenInvalidRow.userID = userID
  fixt.refreshTokenInvalidReq.body.userID = userID

  // Insert refresh token
  await knex('refreshToken').insert(fixt.refreshTokenInvalidRow)

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()

  await auth.refresh(fixt.refreshTokenInvalidReq, res, next)

  t.true(
    next.calledWithMatch(sinon.match.instanceOf(restify.UnauthorizedError)),
    'throws error')
  t.false(res.send.called, 'response not sent')

  // Clean up database
  await knex('refreshToken').where(fixt.refreshTokenInvalidRow).del()
  await knex(fixt.table).where('userID', userID).del()
})

test('Refresh token with wrong fields', t => {
  const next = sinon.spy()
  auth.refresh(fixt.refreshTokenReqWrongFields, null, next)

  t.true(next.calledWithMatch(sinon.match.instanceOf(restify.BadRequestError)),
    'throws error when wrong fields provided')
})

test('Authenticate token', async t => {
  // Insert user into db and add ID to test data
  const [userID] = await knex(fixt.table).insert(fixt.tokenUser)
  fixt.payload.userID = userID
  fixt.tokenUser.userID = userID

  const done = sinon.spy()
  await auth.authenticateToken(fixt.payload, done)
  t.true(done.calledWith(null, fixt.tokenUser),
    'authenticates user')

  const doneNoUser = sinon.spy()
  await auth.authenticateToken(fixt.payloadNoUser, doneNoUser)
  t.true(doneNoUser.calledWithMatch(sinon.match.instanceOf(Error)),
    'does not authenticate missing user')
})

test('Check user exists', t => {
  const req = {
    body: fixt.authUser
  }
  const reqWithUser = {
    body: fixt.authUser,
    user: {}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  auth.checkUserExists(reqWithUser, res, next)
  t.true(res.send.calledWith(200), 'success response sent')
  auth.checkUserExists(req, res, next)
  t.true(next.calledWith(sinon.match.instanceOf(restify.NotFoundError)),
    'error passed to next handler')
})

test('Check admin', t => {
  const next = sinon.spy()
  auth.checkAdmin(fixt.checkAdminReq, null, next)
  t.true(next.calledWithExactly(), 'next called with no args')

  const nextUnauthorized = sinon.spy()
  auth.checkAdmin(fixt.checkAdminReqUnauthorized, null, nextUnauthorized)
  t.true(nextUnauthorized.calledWithMatch(sinon.match.instanceOf(Error)),
    'next called with error')
})

test('Check user matches', t => {
  const next = sinon.spy()
  auth.checkUserMatches(fixt.checkUserReq, null, next)
  t.true(next.calledWithExactly(), 'next called with no args')

  const nextUnauthorized = sinon.spy()
  auth.checkUserMatches(fixt.checkUserReqUnauthorized, null, nextUnauthorized)
  t.true(nextUnauthorized.calledWithMatch(sinon.match.instanceOf(Error)),
    'next called with error')
})

test.after.always('Clean up database', async t => {
  // Delete created users
  await knex(fixt.table)
    .where('email', fixt.user.email)
    .del()
  await knex(fixt.table)
    .where('email', fixt.authUser.email)
    .del()
  await knex(fixt.table)
    .where('email', fixt.authUserWrong.email)
    .del()
  await knex(fixt.table)
    .where('email', fixt.tokenUser.email)
    .del()

  await knex(fixt.table)
    .where('email', fixt.tokenUser.email)
    .del()

  // Delete created organization
  await knex('organization')
    .where('organizationID', fixt.user.organizationID)
    .del()
})
