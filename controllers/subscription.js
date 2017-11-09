// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

const moment = require('moment')
const errors = require('restify-errors')
const stripe = require('stripe')(process.env.STRIPE_SECRET)

const auth = require('./auth')
const db = require('../services/db')
const endpoint = require('../services/endpoint')

const subscription = module.exports

// Status names and IDs from the `subscriptionStatus` table
subscription.subscriptionStatus = {
  TRIAL: 1,
  TRIAL_EXPIRED: 2,
  VALID: 3,
  EXPIRED: 4,
  CANCELED: 5
}

// Add name of current subscription status
subscription.withStatus = (req, queryBuilder) => {
  return queryBuilder
    .join('subscriptionStatus', 'subscription.subscriptionStatusID', 'subscriptionStatus.subscriptionStatusID')
    .select('subscription.*', 'subscriptionStatus.name as status')
}

subscription.mount = app => {
  /**
   * @api {post} /subscription Create a subscription for an organization
   * @apiName Subscription
   * @apiGroup Subscription
   * @apiVersion 3.0.0
   *
   * @apiDescription Create a new Stockpile subscription for an organization. First, using a Stripe token, creates a
   * Stripe customer with a subscription to Stockpile. Second, creates an organization using the request body and the
   * created Stripe customer's unique identifier. Lastly, creates a user using the request body and the created
   * organization's ID. This user, the first in the organization, will be an administrator by default.
   *
   * @apiParam {Object} token Stripe token identifying payment information
   * @apiParam {Object} organization Contains name and email
   * @apiParam {Object} user Contains `firstName`, `lastName`, `email`, and plaintext `password`
   *
   * @apiSuccess (201) {String} message Descriptive message
   * @apiSuccess (201) {String} organizationID
   * @apiSuccess (201) {String} userID
   */
  app.post({ name: 'subscription', path: 'subscription' }, subscription.subscription)

  /**
   * @api {post} /subscription/hook Receive subscription updates from Stripe
   * @apiName SubscriptionHook
   * @apiGroup Subscription
   * @apiVersion 3.0.0
   *
   * @apiDescription Stripe is configured to send requests to this endpoint when events occur with customer accounts.
   * See the [Stripe webhook documentation](https://stripe.com/docs/webhooks). **This endpoint should not be used by
   * any service other than Stripe.**
   *
   * @apiParam {string} id Unique identifier for the object.
   * @apiParam {string} object String representing the object’s type. Objects of the same type share the same value.
   * @apiParam {string} api_version The Stripe API version used to render `data`.
   * @apiParam {number} created Time at which the object was created. Measured in seconds since the Unix epoch.
   * @apiParam {object} data Object containing data associated with the event.
   * @apiParam {boolean} livemode Flag indicating whether the object exists in live mode or test mode.
   * @apiParam {number} pending_webhooks Number of webhooks yet to be delivered successfully (return a 20x response) to
   * the URLs you’ve specified.
   * @apiParam {object} request Information on the API request that instigated the event.
   * @apiParam {string} type Description of the event: e.g. `invoice.created`, `charge.refunded`, etc.
   *
   * @apiSuccess (200) empty Empty response body to acknowledge receipt
   */
  app.post({ name: 'subscription hook', path: 'subscription/hook' }, subscription.subscriptionHook)

  /**
   * @api {get} /subscription/:organizationID Get the subscription for an organization
   * @apiName GetSubscription
   * @apiGroup Subscription
   * @apiPermission Admin
   * @apiVersion 3.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   "organizationID": 0,
   *   "status": "VALID",
   *   "statusUntil": null,
   *   "stripeCustomer": "",
   *   "subscriptionID": 0,
   *   "subscriptionStatusID": 3,
   *   "valid": 1
   * }
   */
  app.get({ name: 'get subscription', path: 'subscription/:organizationID' }, auth.verify, auth.checkAdmin,
    subscription.get)
}

subscription.get = endpoint.get('subscription', 'organizationID', {modify: subscription.withStatus})

subscription.subscription = (req, res, next) => {
  if (req.body.organization && req.body.user) {
    // Create Stripe customer from token
    return stripe.customers.create({
      email: req.body.organization.email,
      source: req.body.token
    }).then(customer => {
      // Subscribe customer to monthly plan
      const creatingSubscription = stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            plan: 'monthly'
          }
        ],
        trial_period_days: 60
      })

      return Promise.all([creatingSubscription, customer])
    }).then(([stripeSubscription, customer]) => {
      // Create organization
      return Promise.all([
        stripeSubscription,
        customer,
        db.create('organization', 'organizationID', req.body.organization)
      ])
    }).then(([stripeSubscription, customer, organization]) => {
      // TODO abstract into a separate function
      // Convert Stripe timestamp to MySQL datetime format, maintaining UTC timezone
      const periodEnd = moment.unix(stripeSubscription.current_period_end).utcOffset(0).format('YYYY-MM-DD HH:mm:ss')
      const subscription = {
        organizationID: organization.organizationID,
        stripeCustomer: customer.id,
        valid: 1, // `1` means `true`
        subscriptionStatusID: 1, // `TRIAL` status
        statusUntil: periodEnd
      }

      // Create subscription
      return Promise.all([
        db.create('subscription', 'subscriptionID', subscription),
        organization
      ])
    }).then(([subscription, organization]) => {
      const user = req.body.user
      user.organizationID = organization.organizationID

      // Set first user in organization to 'Admin' role
      user.roleID = 1

      // Create user
      const creatingUser = auth.hashPassword(user.password)
        .then(hash => {
          user.password = hash
          return db.create('user', 'userID', user)
        })

      return Promise.all([
        organization.organizationID,
        creatingUser
      ])
    }).then(([organizationID, user]) => {
      res.send(201, {
        message: 'Subscription created',
        organizationID,
        userID: user.userID
      })
      return next()
    }).catch(err => {
      // A declined card error
      if (err.type === 'StripeCardError') {
        return next(new errors.PaymentRequiredError(err.message))
      } else {
        /**
         * Handle any other types of unexpected errors: StripeAPIError, StripeConnectionError,
         * StripeInvalidRequestError, and StripeAuthenticationError
         * See https://stripe.com/docs/api#errors for full reference
         */
        return next(new errors.InternalServerError(err.message))
      }
    })
  } else {
    return next(new errors.BadRequestError('Missing user or organization'))
  }
}

subscription.subscriptionHook = (req, res, next) => {
  // Get customer from request if it exists
  let customer
  if (req.body.data.object) {
    customer = req.body.data.object.customer
  }

  // Throw error and do not continue if customer is undefined
  if (!customer) {
    next(new errors.BadRequestError('could not get Stripe customer from webhook request'))
    return
  }

  return stripe.subscriptions.list({
    customer
  }).then((subscriptions) => {
    // Customer should only have one subscription, so use first one in list
    const stripeSubscription = subscriptions.data[0]

    // Change subscription to cancelled if customer has no active subscriptions
    if (!stripeSubscription) {
      return db.update('subscription', 'stripeCustomer', customer, {
        valid: false,
        subscriptionStatusID: subscription.subscriptionStatus.CANCELED,
        statusUntil: null
      })
    }

    // Get date when status is relevant until, default to `null`
    let statusUntil = null
    if (stripeSubscription.current_period_end) {
      statusUntil = moment.unix(stripeSubscription.current_period_end).utcOffset(0).format('YYYY-MM-DD HH:mm:ss')
    }

    if (stripeSubscription.status === 'trialing') {
      return db.update('subscription', 'stripeCustomer', customer, {
        valid: true,
        subscriptionStatusID: subscription.subscriptionStatus.TRIAL,
        statusUntil
      })
    } else if (stripeSubscription.status === 'active') {
      return db.update('subscription', 'stripeCustomer', customer, {
        valid: true,
        subscriptionStatusID: subscription.subscriptionStatus.VALID,
        statusUntil
      })
    } else if (stripeSubscription.status === 'past_due' || subscription.status === 'unpaid') {
      return db.update('subscription', 'stripeCustomer', customer, {
        valid: false,
        subscriptionStatusID: subscription.subscriptionStatus.EXPIRED,
        statusUntil: null
      })
    } else if (stripeSubscription.status === 'canceled') {
      return db.update('subscription', 'stripeCustomer', customer, {
        valid: false,
        subscriptionStatusID: subscription.subscriptionStatus.CANCELED,
        statusUntil: null
      })
    }
  }).then(() => {
    res.send(200)
    next()
  }).catch(next)
}
