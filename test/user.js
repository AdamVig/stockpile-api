const restify = require('restify')
const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/user')
const knex = require('./fixtures/knex-instance')
const user = require('../controllers/user')

test.before('Insert data', async t => {
  // Insert organization
  const [organizationID] = await knex('organization').insert(fixt.organization)
  fixt.user.organizationID = organizationID
  fixt.req.user.organizationID = organizationID
  fixt.reqWrong.user.organizationID = organizationID

  // Insert user
  const [userID] = await knex('user').insert(fixt.user)
  fixt.user.userID = userID
  fixt.req.params.userID = userID
  fixt.reqWrong.params.userID = userID
})

test('Without password', t => {
  const queryBuilder = {
    join: function () { return this },
    select: function () { return this }
  }
  const result = user.removePasswordAddRole(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('Change password', async t => {
  // Successful password change
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await user.changeUserPassword(fixt.req, res, next)
  const updatedUser = await knex('user')
        .where('userID', fixt.user.userID)
        .first()
  t.true(res.send.calledOnce, 'response sent')
  t.false(next.called, 'next not called')
  t.true(updatedUser.password !== fixt.user.password, 'password is updated')

  // Update password in fixture
  fixt.user.password = updatedUser.password

  // Current password is incorrect
  const resWrong = {
    send: sinon.spy()
  }
  const nextWrong = sinon.spy()
  await user.changeUserPassword(fixt.reqWrong, resWrong, nextWrong)
  const notUpdatedUser = await knex('user')
        .where('userID', fixt.user.userID)
        .first()
  t.true(nextWrong.calledWithMatch(
    sinon.match.instanceOf(restify.BadRequestError)), 'throws bad request error')
  t.false(resWrong.send.calledOnce, 'response not sent')
  t.true(notUpdatedUser.password === fixt.user.password,
         'password is not updated')
})

test.after.always('Clean up database', async t => {
  await knex('user').where('userID', fixt.user.userID).del()
  await knex('organization')
    .where('organizationID', fixt.user.organizationID).del()
})
