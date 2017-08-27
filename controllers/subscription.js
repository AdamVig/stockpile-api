// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

const moment = require('moment')
const restify = require('restify')
const stripe = require('stripe')(process.env.STRIPE_SECRET)

const auth = require('./auth')
const db = require('../services/db')

const subscription = module.exports

subscription.mount = app => {
  /**
   * @api {post} /subscription Create a subscription for an organization
   * @apiName Subscription
   * @apiGroup Subscription
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
}

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
        ]
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
      return res.send(201, {
        message: 'Subscription created',
        organizationID,
        userID: user.userID
      })
    }).catch(err => {
      // A declined card error
      if (err.type === 'StripeCardError') {
        return next(new restify.PaymentRequiredError(err.message))
      } else {
        /**
         * Handle any other types of unexpected errors: StripeAPIError, StripeConnectionError,
         * StripeInvalidRequestError, and StripeAuthenticationError
         * See https://stripe.com/docs/api#errors for full reference
         */
        return next(new restify.InternalServerError(err.message))
      }
    })
  } else {
    return next(new restify.BadRequestError('Missing user or organization'))
  }
}
