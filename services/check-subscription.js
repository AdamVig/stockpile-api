const restify = require('restify')

const db = require('./db')
const subscriptionController = require('../controllers/subscription')

/**
 * Check if an organization's subscription is valid
 * Must be run as middleware on an individual route *after* `auth.verify`.
 * @module services/check-subscription
 * @param {object} req Request
 * @param {object} res Response
 * @param {function} next Next handler
 * @return {any} Result of next handler
 *
 * @apiDefine InvalidSubscriptionResponse
 * @apiError PaymentRequiredError The subscription is invalid
 * @apiErrorExample PaymentRequiredError
 *  402 Payment Required
 *  {
 *    "code": "PaymentRequiredError",
 *    "message": "subscription is invalid"
 *  }
 */
module.exports = function checkSubscription (req, res, next) {
  if (req && req.user && req.user.organizationID) {
    return db.get('subscription', 'organizationID', req.user.organizationID)
      .then(subscription => {
        // If subscription is not either trialing or valid, it must be invalid
        if (
          subscription.subscriptionStatusID !== subscriptionController.subscriptionStatus.TRIAL &&
          subscription.subscriptionStatusID !== subscriptionController.subscriptionStatus.VALID
        ) {
          return next(new restify.PaymentRequiredError('subscription is invalid'))

        // Otherwise, pass through successfully because subscription must be valid
        } else {
          return next()
        }
      }).catch(err => {
        if (err.code === 'ER_NOT_FOUND') {
          return next(new restify.PaymentRequiredError('organization has no subscription'))
        } else {
          req.log.warn({err}, 'checkSubscription failed')
          return next()
        }
      })
  } else {
    req.log.warn('checkSubscription could not find `req.user`, was it used without auth.verify before it?')
    return next()
  }
}
