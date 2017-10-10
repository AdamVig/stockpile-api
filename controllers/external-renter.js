const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const endpoint = require('../services/endpoint')

const messages = {
  missing: 'External renter does not exist'
}

const externalRenter = module.exports

endpoint.addAllMethods(externalRenter, 'externalRenter', 'externalRenterID')
externalRenter.get = endpoint.get('externalRenter', 'externalRenterID',
  {messages})

externalRenter.mount = app => {
  /**
   * @apiDefine ExternalRenterResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "externalRenterID": 0,
   *   "organizationID": 0,
   *   "name": "",
   *   "email": "".
   *   "phone": ""
   * }
   */

  /**
   * @api {get} /external-renter Get all external renters
   * @apiName GetCategories
   * @apiGroup ExternalRenter
   * @apiVersion 2.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "externalRenterID": 0,
   *       "organizationID": 0,
   *       "name": "",
   *       "email": "".
   *       "phone": ""
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all external renters', path: 'external-renter'}, auth.verify, externalRenter.getAll)
  /**
   * @api {get} /external-renter/:externalRenterID Get external renter
   * @apiName GetExternalRenter
   * @apiGroup ExternalRenter
   * @apiVersion 2.0.0
   *
   * @apiUse ExternalRenterResponse
   */
  app.get({name: 'get external renter', path: 'external-renter/:externalRenterID'}, auth.verify, externalRenter.get)
  /**
   * @api {put} /external-renter Create an external renter
   * @apiName CreateExternalRenter
   * @apiGroup ExternalRenter
   * @apiVersion 2.0.0
   *
   * @apiDescription An external renter is a person or organization from outside
   *   the organization using Stockpile that rents items. These renters are
   *   saved to the database with contact information in case the Stockpile
   *   organization needs to contact them after their items have been returned.
   *   External renters can be associated with rentals.
   *
   * @apiParam {String{0..255}} name Name of company or individual
   * @apiParam {String{0..255}} [email] Email address
   * @apiParam {String{10}} [phone] Phone number
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   * @apiSuccess (200) {Number} id ID of created row
   *
   * @apiUse ExternalRenterResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create external renter', path: 'external-renter'}, auth.verify, checkSubscription,
    externalRenter.create)
  /**
   * @api {put} /external-renter/:externalRenterID Update an external renter
   * @apiName UpdateExternalRenter
   * @apiGroup ExternalRenter
   * @apiVersion 2.0.0
   *
   * @apiParam {String{0..255}} [name] Name of company or individual
   * @apiParam {String{0..255}} [email] Email address
   * @apiParam {String{10}} [phone] Phone number
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse ExternalRenterResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update external renter', path: 'external-renter/:externalRenterID'}, auth.verify, checkSubscription,
    externalRenter.update)
  /**
   * @api {delete} /external-renter/:externalRenterID Delete an external renter
   * @apiName DeleteExternalRenter
   * @apiGroup ExternalRenter
   * @apiVersion 2.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete external renter', path: 'external-renter/:externalRenterID'}, auth.verify, checkSubscription,
    externalRenter.delete)
}
