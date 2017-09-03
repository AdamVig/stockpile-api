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
const subscriptionController = require('../controllers/subscription')

/**
 * Create a subscription
 * @return {object} Contains organizationID and stripeCustomer
 */
const createSubscription = async () => {
  const {req} = fixt.base
  req.body.organization.email = `${knex.randomizeName('subscription')}@stockpileapp.co`
  req.body.user.email = `${knex.randomizeName('subscription-user')}@stockpileapp.co`
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscription(req, res, next)

  // Get data from response sent by endpoint
  const {organizationID} = res.send.args[0][1]

  // Get Stripe customer from database
  const [stripeCustomer] = await knex('subscription').where('organizationID', organizationID).pluck('stripeCustomer')

  fixt.organizationsToDelete.push(organizationID)

  return {
    organizationID,
    stripeCustomer
  }
}

/**
 * Check that a subscription matches the given parameters
 * @param {object} t Ava test utility object
 * @param {number} organizationID Organization to check subscription for
 * @param {boolean} isValid Whether subscription is valid or not
 * @param {number} subscriptionStatus Status that subscription should have
 */
const checkSubscriptionStatus = async (t, organizationID, isValid, subscriptionStatus) => {
  const [subscription] = await knex('subscription').where('organizationID', organizationID)

  t.is(subscription.valid, isValid ? 1 : 0, `subscription is${!isValid ? ' not' : ''} valid`)
  t.is(subscription.subscriptionStatusID, subscriptionController.subscriptionStatus[subscriptionStatus],
    `subscription has status ${subscription.subscriptionStatus}`)
}

test('Subscribe successfully', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscription(fixt.successful.req, res, next)

  if (res.send.args[0]) {
    const result = res.send.args[0][1]
    fixt.organizationsToDelete.push(result.organizationID)
  }

  t.true(res.send.calledOnce, 'response sent')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})

test('Without user or organization', async t => {
  const req = {
    body: {}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscription(req, res, next)

  t.true(next.calledWithMatch(
    sinon.match.instanceOf(restify.BadRequestError)), 'throws bad request error')
  t.false(res.send.called, 'response not sent')
})

test('With missing user data', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscription(fixt.missing.req, res, next)

  t.true(next.calledWithMatch(
    sinon.match.instanceOf(restify.InternalServerError)), 'throws internal server error')
  t.false(res.send.called, 'response not sent')
})

test('With declined card', async t => {
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscription(fixt.declined.req, res, next)

  t.true(next.calledWithMatch(
    sinon.match.instanceOf(restify.PaymentRequiredError)), 'throws payment required error')
  t.false(res.send.called, 'response not sent')
})

test('Subscription hook with missing customer', async t => {
  const next = sinon.spy()
  await subscriptionController.subscriptionHook(fixt.hookMissingCustomerReq, null, next)

  t.true(next.calledWithMatch(
    sinon.match.instanceOf(restify.BadRequestError)), 'throws bad request error')
})

test('Subscription canceled', async t => {
  const {organizationID, stripeCustomer} = await createSubscription()

  // Get subscription
  const subscriptions = await stripe.subscriptions.list({customer: stripeCustomer})
  const subscriptionID = subscriptions.data[0].id

  // Cancel subscription
  await stripe.subscriptions.del(subscriptionID)

  // Add created customer ID to request body for endpoint to use
  fixt.hookCanceledReq.body.data.object.customer = stripeCustomer

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscriptionHook(fixt.hookCanceledReq, res, next)

  t.true(res.send.calledWith(200), 'sends success response')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
  await checkSubscriptionStatus(t, organizationID, false, 'CANCELED')
})

test('Subscription trialing', async t => {
  const {organizationID, stripeCustomer} = await createSubscription()

  // Add created customer ID to request body for endpoint to use
  fixt.hookTrialingReq.body.data.object.customer = stripeCustomer

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscriptionHook(fixt.hookTrialingReq, res, next)

  t.true(res.send.calledWith(200), 'sends success response')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
  await checkSubscriptionStatus(t, organizationID, true, 'TRIAL')
})

test('Subscription trialing to subscription active', async t => {
  const {organizationID, stripeCustomer} = await createSubscription()

  // Get subscription
  const subscriptions = await stripe.subscriptions.list({customer: stripeCustomer})
  const subscriptionID = subscriptions.data[0].id

  // End trial
  await stripe.subscriptions.update(subscriptionID, {
    trial_end: 'now'
  })

  // Add created customer ID to request body for endpoint to use
  fixt.hookTrialToActiveReq.body.data.object.customer = stripeCustomer

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await subscriptionController.subscriptionHook(fixt.hookTrialToActiveReq, res, next)

  t.true(res.send.calledWith(200), 'sends success response')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
  await checkSubscriptionStatus(t, organizationID, true, 'VALID')
})

test.after.always('Clean up created data', async t => {
  const customers = await stripe.customers.list()

  // Delete all created organizations
  for (const organizationID of fixt.organizationsToDelete) {
    await knex('organization').where('organizationID', organizationID).del()
  }

  // Delete organization by email address, because IDs were not returned from failed subscription
  await knex('organization').where('email', fixt.missing.req.body.organization.email).del()

  // Delete Stripe customers by email
  const createdCustomers = customers.data
    .filter(customer => customer.email.includes('@stockpileapp.co'))

  for (const customer of createdCustomers) {
    await stripe.customers.del(customer.id)
  }
})
