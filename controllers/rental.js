const jwt = require('jsonwebtoken')
const restify = require('restify')

const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const db = require('../services/db')
const endpoint = require('../services/endpoint')
const paginate = require('../services/paginate')

const rental = module.exports

rental.paginate = (req, queryBuilder) => {
  return queryBuilder
    .modify(paginate.paginateQuery, req, 'rental')
}

// Get user ID from token and add to request body
rental.addUserID = function addUserID (req, res, next) {
  try {
    const token = req.headers.authorization.replace('Bearer ', '')
    const payload = jwt.decode(token)

    // Don't overwrite userID if provided in body
    if (!req.body.userID) {
      req.body.userID = payload.userID
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

const messages = {
  conflict: 'Cannot rent item, item is already rented',
  create: 'Rental created',
  createPlural: 'Rentals created',
  delete: 'Rental deleted',
  missing: 'Rental does not exist'
}

rental.getAll = endpoint.getAll('rental', {modify: rental.paginate})
rental.get = endpoint.get('rental', 'rentalID', {messages})
rental.update = endpoint.update('rental', 'rentalID', {messages})
rental.delete = endpoint.delete('rental', 'rentalID', {messages})
rental.create = (req, res, next) => {
  if (req.body && req.body.items) {
    const rentals = req.body.items.map(item => {
      // Copy rental properties from request body to new object without list of items
      const rental = Object.assign({}, req.body)
      delete rental.items
      rental.barcode = item.barcode
      return rental
    })
    return Promise.all(rentals.map(rental => db.create('rental', 'rentalID', rental)))
      .then(results => {
        const message = results.length > 1 ? messages.createPlural : messages.create
        res.send({
          message,
          results
        })
        return next()
      }).catch(next)
  } else {
    return next(new restify.BadRequestError('Missing list of items'))
  }
}
// Legacy versions of the 'create rental' endpoint
rental.create.versions = [
  endpoint.create('rental', 'rentalID', {messages})
]

rental.mount = app => {
  /**
   * @apiDefine Pagination
   *
   * @apiParam (Pagination) {Number{0..}} [limit] Max rows in response
   * @apiParam (Pagination) {Number{0..}} [offset] Rows to offset response by
   */

  /**
   * @apiDefine RentalResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "endDate": "2017-02-23T05:00:00.000Z",
   *   "organizationID": 0,
   *   "rentalID": 0,
   *   "returnDate": null,
   *   "startDate": "2017-02-22T05:00:00.000Z",
   *   "barcode": "",
   *   "userID": 0,
   *   "notes": "",
   *   "externalRenterID": 0
   * }
   */

  /**
   * @api {get} /rental Get all rentals
   * @apiName GetRentals
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiUse Pagination
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     "endDate": "2017-02-23T05:00:00.000Z",
   *     "organizationID": 0,
   *     "rentalID": 0,
   *     "returnDate": null,
   *     "startDate": "2017-02-22T05:00:00.000Z",
   *     "barcode": "",
   *     "userID": 0,
   *     "notes": "",
   *     "externalRenterID": 0
   *   ]
   * }
   */
  app.get({name: 'get all rentals', path: 'rental'}, auth.verify, rental.getAll)
  /**
   * @api {get} /rental/:rentalID Get a rental
   * @apiName GetRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiDescription To find the `rentalID` of an item's current active rental
   *   by the item's barcode, use `GET /item/:barcode/rental/active`. To find
   *   all current and past rentals of an item, use
   *   `GET /item/:barcode/rentals`.
   *
   * @apiUse RentalResponse
   */
  app.get({name: 'get rental', path: 'rental/:rentalID'}, auth.verify, rental.get)
  /**
   * @api {put} /rental Create a rental
   * @apiName CreateRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 1.0.0
   *
   * @apiDescription Rentals track the availability of items. To mark a rental
   *   as returned, *do not delete the rental*, but instead set `returnDate` to
   *   the date the item was returned. Rentals are associated with users and
   *   optionally with external renters.
   *
   * @apiParam {String} barcode Barcode of rented item
   * @apiParam {String} startDate Date rental taken out (YYYY-MM-DD)
   * @apiParam {String} endDate Date rental is due (YYYY-MM-DD)
   * @apiParam {String} [returnDate] Date item is returned (YYYY-MM-DD)
   * @apiParam {Number} [userID] ID of renting user (automatically taken from
   *   token, but can be overridden)
   * @apiParam {Number} [externalRenterID] ID of external renter
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   * @apiParam {String{0..1000}} [notes] Notes about rental
   *
   * @apiUse RentalResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create rental v1', path: 'rental', version: '1.0.0'}, auth.verify, rental.addUserID, checkSubscription,
    rental.create.versions[0])
  /**
   * @api {put} /rental Create a rental
   * @apiName CreateRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiDescription Rentals track the availability of items. To mark a rental
   *   as returned, *do not delete the rental*, but instead set `returnDate` to
   *   the date the item was returned. Rentals are associated with users and
   *   optionally with external renters.
   *
   * @apiParam {String} startDate Date rental taken out (YYYY-MM-DD)
   * @apiParam {String} endDate Date rental is due (YYYY-MM-DD)
   * @apiParam {String} [returnDate] Date item is returned (YYYY-MM-DD)
   * @apiParam {Number} [userID] ID of renting user (automatically taken from
   *   token, but can be overridden)
   * @apiParam {Number} [externalRenterID] ID of external renter
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   * @apiParam {String{0..1000}} [notes] Notes about rental
   * @apiParam {Object[]} items List of items to rent
   * @apiParam {String} items.barcode Barcode of an item
   *
   * @apiUse RentalResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create rental', path: 'rental', version: '2.0.0'}, auth.verify, rental.addUserID, checkSubscription,
    rental.create)
  /**
   * @api {put} /rental/:rentalID Update a rental
   * @apiName UpdateRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiParam {Number} [userID] ID of renting user
   * @apiParam {Barcode} [barcode] Barcode of rented item
   * @apiParam {String} [startDate] Date rental taken out (YYYY-MM-DD)
   * @apiParam {String} [endDate] Date rental is due (YYYY-MM-DD)
   * @apiParam {String} [returnDate] Date item is returned (YYYY-MM-DD)
   * @apiParam {String{0..1000}} [notes] Notes about rental
   * @apiParam {Number} [externalRenterID] ID of external renter
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse RentalResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update rental', path: 'rental/:rentalID'}, auth.verify, checkSubscription, rental.update)
  /**
   * @api {delete} /rental/:rentalID Delete a rental
   * @apiName DeleteRental
   * @apiGroup Rental
   * @apiPermission Administrator
   * @apiVersion 2.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete rental', path: 'rental/:rentalID'}, auth.verify, auth.checkAdmin, checkSubscription,
    rental.delete)
}
