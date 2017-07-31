// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

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
   * @apiSuccess (201) {String} stripeCustomerID
   * @apiSuccess (201) {String} userID
   */
  app.post({ name: 'subscription', path: 'subscription' }, subscription.subscription)
}

subscription.subscription = (req, res, next) => {
  if (req.body.organization && req.body.user) {
    return stripe.customers.create({
      email: req.body.organization.email,
      source: req.body.token,
      plan: 'monthly-normal'
    }).then(customer => {
      const organization = req.body.organization
      organization.stripeCustomerID = customer.id
      return db.create('organization', 'organizationID', organization)
    }).then(organization => {
      const user = req.body.user
      user.organizationID = organization.organizationID

      // Set first user in organization to 'Admin' role
      user.roleID = 1

      const creatingUser = auth.hashPassword(user.password)
        .then(hash => {
          user.password = hash
          return db.create('user', 'userID', user)
        })

      return Promise.all([
        organization.organizationID,
        organization.stripeCustomerID,
        creatingUser
      ])
    }).then(([organizationID, stripeCustomerID, user]) => {
      return res.send(201, {
        message: 'Subscription created',
        organizationID,
        stripeCustomerID,
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
