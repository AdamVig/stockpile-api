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
   * organization's ID.
   *
   * @apiParam {Object} token Stripe token identifying payment information
   * @apiParam {Object} organization Contains name and email
   * @apiParam {Object} user Contains `firstName`, `lastName`, `email`, and plaintext `password`
   *
   * @apiSuccess (201) {String} message Descriptive message
   */
  app.post({ name: 'subscription', path: 'subscription' }, subscription.subscription)
}

subscription.subscription = (req, res, next) => {
  if (req.body.organization && req.body.user) {
    return stripe.customers.create({
      email: req.body.organization.email,
      source: req.body.token,
      plan: 'monthly-normal'
    })
      .then(customer => {
        const organization = req.body.organization
        if (customer) {
          organization.stripeCustomerID = customer.id
        }
        return db.create('organization', 'organizationID', organization)
      })
      .then(organization => {
        const user = req.body.user
        if (organization) {
          user.organizationID = organization.organizationID
        }
        return auth.hashPassword(user.password)
          .then(hash => {
            user.password = hash
            return db.create('user', 'userID', user)
          })
      })
      .then(user => {
        return res.send(201, {
          message: 'Subscription created'
        })
      })
      .catch(err => {
        // See https://stripe.com/docs/api#errors for full reference
        switch (err.type) {
          // Invalid parameters were supplied to Stripe's API
          case 'StripeInvalidRequestError':
            return next(new restify.BadRequestError(err.message))
          // A declined card error
          case 'StripeCardError':
            return next(new restify.PaymentRequiredError(err.message))
          case 'RateLimitError':
            // Too many requests made to the API too quickly
            return next(new restify.RequestThrottledError(err.message))
          case 'StripeAuthenticationError':
            // You probably used an incorrect API key
            return next(new restify.UnauthorizedError(err.message))
          default:
            // Handle any other types of unexpected errors, including StripeAPIError and StripeConnectionError
            return next(new restify.InternalServerError(err.message))
        }
      })
  } else {
    return next(new restify.BadRequestError('Missing user or organization'))
  }
}
