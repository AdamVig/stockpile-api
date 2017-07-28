// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

const restify = require('restify')
const sinon = require('sinon')
const stripe = require('stripe')(process.env.STRIPE_SECRET)
const test = require('ava')

const fixt = require('./fixtures/subscription')
const knex = require('./fixtures/knex-instance')
const subscription = require('../controllers/subscription')

test('Subscribe Successfully', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscription.subscription(fixt.successful.req, res, next)

  if (res.send.args[0]) {
    const result = res.send.args[0][1]
    fixt.successful.userID = result.userID
    fixt.successful.organizationID = result.organizationID
    fixt.successful.stripeCustomerID = result.stripeCustomerID
  }

  t.true(res.send.calledOnce, 'response sent')
  t.false(next.called, 'next not called')
})

test('Without user or organization', async t => {
  const req = {
    body: {}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscription.subscription(req, res, next)

  t.true(next.calledWithMatch(
    sinon.match.instanceOf(restify.BadRequestError)), 'throws bad request error')
  t.false(res.send.called, 'response not sent')
})

test('With missing user data', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscription.subscription(fixt.missing.req, res, next)

  t.true(next.calledWithMatch(
    sinon.match.instanceOf(restify.InternalServerError)), 'throws internal server error')
  t.false(res.send.called, 'response not sent')
})

test('With declined card', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscription.subscription(fixt.declined.req, res, next)

  t.true(next.calledWithMatch(
    sinon.match.instanceOf(restify.PaymentRequiredError)), 'throws payment required error')
  t.false(res.send.called, 'response not sent')
})

test.after.always('Clean up created data', async t => {
  const customers = await stripe.customers.list()

  await knex('user').where('userID', fixt.successful.userID).del()
  await knex('organization').where('organizationID', fixt.successful.organizationID).del()
  await stripe.customers.del(fixt.successful.stripeCustomerID)

  // Delete organization and customer by email address, because IDs were not returned from failed subscription
  await knex('organization').where('email', fixt.missing.req.body.organization.email).del()
  customers.data
    .filter(customer => customer.email === fixt.missing.req.body.organization.email)
    .map(async customer => stripe.customers.del(customer.id))

  customers.data
    .filter(customer => customer.email === fixt.declined.req.body.organization.email)
    .map(async customer => stripe.customers.del(customer.id))
})
