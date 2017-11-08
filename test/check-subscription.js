const errors = require('restify-errors')
const test = require('ava')
const sinon = require('sinon')

const checkSubscription = require('../services/check-subscription')
const fixt = require('./fixtures/check-subscription')
const knex = require('./fixtures/knex-instance')
const subscription = require('../controllers/subscription')

/**
 * Create an organization and a subscription for that organization
 * @param {boolean} valid Whether subscription should be valid or not
 * @param {number} subscriptionStatusID ID of subscription status
 * @return {number} ID of created organization
 */
const createSubscription = async (valid, subscriptionStatusID) => {
  const organizationData = {
    name: knex.randomizeName('check-subscription'),
    email: knex.randomizeName('check-subscription')
  }
  const [organizationID] = await knex('organization').insert(organizationData)
  const subscriptionData = {
    organizationID,
    stripeCustomer: knex.randomizeName('cus'),
    valid: valid ? 1 : 0,
    subscriptionStatusID
  }
  await knex('subscription').insert(subscriptionData)

  fixt.organizationsToDelete.push(organizationID)

  return organizationID
}

test.before(async t => {
  const createdOrganizations = await Promise.all([
    // Create trialing subscription
    createSubscription(true, subscription.subscriptionStatus.TRIAL),
    // Create valid subscription
    createSubscription(true, subscription.subscriptionStatus.VALID),
    // Create expired subscription
    createSubscription(false, subscription.subscriptionStatus.EXPIRED),
    // Create canceled subscription
    createSubscription(false, subscription.subscriptionStatus.CANCELED),
    // Create valid subscription for missing test
    createSubscription(false, subscription.subscriptionStatus.VALID)
  ])

  fixt.trial.req.user.organizationID = createdOrganizations[0]
  fixt.valid.req.user.organizationID = createdOrganizations[1]
  fixt.expired.req.user.organizationID = createdOrganizations[2]
  fixt.canceled.req.user.organizationID = createdOrganizations[3]
  fixt.missing.req.user.organizationID = createdOrganizations[4]

  fixt.trial.req.log.warn = sinon.spy()
  fixt.valid.req.log.warn = sinon.spy()
  fixt.expired.req.log.warn = sinon.spy()
  fixt.canceled.req.log.warn = sinon.spy()
  fixt.missing.req.log.warn = sinon.spy()
  fixt.noBody.req.log.warn = sinon.spy()
})

test('Check trial subscription', async t => {
  const next = sinon.spy()

  await checkSubscription(fixt.trial.req, null, next)

  t.true(next.calledOnce, 'calls next handler')
  t.false(fixt.trial.req.log.warn.called, 'does not log warning')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})

test('Check valid subscription', async t => {
  const next = sinon.spy()

  await checkSubscription(fixt.valid.req, null, next)

  t.true(next.calledOnce, 'calls next handler')
  t.false(fixt.valid.req.log.warn.called, 'does not log warning')
  t.false(next.calledWithMatch(sinon.match.instanceOf(Error)), 'does not throw error')
})

test('Check expired subscription', async t => {
  const next = sinon.spy()

  await checkSubscription(fixt.expired.req, null, next)

  t.true(next.calledOnce, 'calls next handler')
  t.false(fixt.expired.req.log.warn.called, 'does not log warning')
  t.true(next.calledWithMatch(sinon.match.instanceOf(errors.PaymentRequiredError)), 'throws payment required error')
})

test('Check canceled subscription', async t => {
  const next = sinon.spy()

  await checkSubscription(fixt.canceled.req, null, next)

  t.true(next.calledOnce, 'calls next handler')
  t.false(fixt.canceled.req.log.warn.called, 'does not log warning')
  t.true(next.calledWithMatch(sinon.match.instanceOf(errors.PaymentRequiredError)), 'throws payment required error')
})

test('Check subscription with missing subscription', async t => {
  const next = sinon.spy()

  // Delete subscription
  await knex('subscription').where('organizationID', fixt.missing.req.user.organizationID).del()

  await checkSubscription(fixt.missing.req, null, next)

  t.true(next.calledOnce, 'calls next handler')
  t.false(fixt.missing.req.log.warn.called, 'does not log warning')
  t.true(next.calledWithMatch(sinon.match.instanceOf(errors.PaymentRequiredError)), 'throws payment required error')
})

test('Check subscription with no request body', async t => {
  const next = sinon.spy()
  await checkSubscription(fixt.noBody.req, null, next)
  t.true(fixt.noBody.req.log.warn.called, 'logs a warning')
  t.true(next.calledOnce, 'calls next handler')
})

test.after(async t => {
  // Delete all created organizations
  for (const organizationID of fixt.organizationsToDelete) {
    await knex('organization').where('organizationID', organizationID).del()
  }
})
