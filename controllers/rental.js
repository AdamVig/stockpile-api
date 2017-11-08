const jwt = require('jsonwebtoken')
const restify = require('restify')

const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const db = require('../services/db')
const endpoint = require('../services/endpoint')
const paginate = require('../services/paginate')

const rental = module.exports

rental.paginateWithExternalRenter = (req, queryBuilder) => {
  return queryBuilder
    .join('externalRenter', 'rental.externalRenterId', 'externalRenter.externalRenterId')
    .modify(paginate.paginateQuery, req, 'rental')
}

rental.withExternalRenter = (req, queryBuilder) => {
  return queryBuilder
    .join('externalRenter', 'rental.externalRenterId', 'externalRenter.externalRenterId')
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

rental.getAll = endpoint.getAll('rental', {modify: rental.paginateWithExternalRenter})
rental.get = endpoint.get('rental', 'rentalID', {messages, modify: rental.withExternalRenter})
rental.delete = endpoint.delete('rental', 'rentalID', {messages})
rental.create = (req, res, next) => {
  if (req.body && req.body.items) {
    if (req.user) {
      req.body.organizationID = req.user.organizationID
    }

    return db.transaction(trx => {
      const items = req.body.items
      delete req.body.items
      return trx('rental').insert(req.body)
        .then(([rentalID]) => {
          req.body.rentalID = rentalID
          items.forEach(item => { item.rentalID = rentalID })
          return trx('rentalItem').insert(items)
        }).then(() => {
          return trx('rental')
            .where('rentalID', req.body.rentalID)
            .modify(rental.withExternalRenter.bind(null, req))
        })
    }).then(result => {
      res.send({
        message: messages.create,
        result
      })
      return next()
    }).catch(err => endpoint.handleError(err, undefined, next, req))
  } else {
    return next(new restify.BadRequestError('Missing list of items'))
  }
}
// Legacy versions of the 'create rental' endpoint
rental.create.versions = [
  // Version 1 (deprecated)
  (req, res, next) => {
    res.send(410, {message: 'Version 1 of this endpoint is no longer supported.'})
    return next()
  },
  // Version 2: uses version 3, but changes incoming property names to match database schema
  (req, res, next) => {
    req.body.start = req.body.startDate
    delete req.body.startDate
    req.body.end = req.body.endDate
    delete req.body.endDate
    delete req.body.returnDate
    return rental.create(req, res, next)
  }
]
rental.update = endpoint.update('rental', 'rentalID', {messages, resModify: rental.withExternalRenter})
rental.update.versions = [
  // Version 1 (deprecated)
  (req, res, next) => {
    res.send(410, {message: 'Version 1 of this endpoint is no longer supported.'})
    return next()
  },
  // Version 2: changes incoming property names to match database schema
  (req, res, next) => {
    req.body.start = req.body.startDate
    delete req.body.startDate
    req.body.end = req.body.endDate
    delete req.body.endDate

    let setReturnDate = Promise.resolve()

    // Add return date to each item
    if (req.body.returnDate) {
      setReturnDate = db('rentalItem')
        .where('rentalID', req.params.rentalID)
        .update({returned: req.body.returnDate})
    }

    delete req.body.returnDate

    let updateRental = Promise.resolve()

    // Update rental if there are any properties that need to be updated
    if (Object.keys(req.body).length > 0) {
      const options = {messages, resModify: rental.withExternalRenter}
      updateRental = endpoint.update('rental', 'rentalID', options)(req, res, next)
    }

    return setReturnDate
      .then(() => updateRental)
  }
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
   *   "end": "2017-02-23T05:00:00.000Z",
   *   "organizationID": 0,
   *   "rentalID": 0,
   *   "start": "2017-02-22T05:00:00.000Z",
   *   "userID": 0,
   *   "notes": "",
   *   "externalRenterID": 0,
   *   "name": "",
   *   "phone": "",
   *   "email": ""
   * }
   */

  /**
   * @api {get} /rental Get all rentals
   * @apiName GetRentals
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse Pagination
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     "end": "2017-02-23T05:00:00.000Z",
   *     "organizationID": 0,
   *     "rentalID": 0,
   *     "start": "2017-02-22T05:00:00.000Z",
   *     "userID": 0,
   *     "notes": "",
   *     "externalRenterID": 0,
   *     "name": "",
   *     "phone": "",
   *     "email": ""
   *   ]
   * }
   */
  app.get({name: 'get all rentals', path: 'rental'}, auth.verify, rental.getAll)
  /**
   * @api {get} /rental/:rentalID Get a rental
   * @apiName GetRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 3.0.0
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
   * @apiDeprecated Version 1 of this endpoint is no longer supported.
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
  app.put({name: 'create rental v2', path: 'rental', version: '2.0.0'}, auth.verify, rental.addUserID, checkSubscription,
    rental.create.versions[1])
  /**
   * @api {put} /rental Create a rental
   * @apiName CreateRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription Rentals track the availability of items. To mark a rental as returned, *do not delete the rental*,
   * but instead set the `returned` date for each item using `PUT /rental/:rentalID/item/:barcode. Rentals are
   * associated with users and optionally with external renters.
   *
   * @apiParam {String} start Date rental taken out (YYYY-MM-DD)
   * @apiParam {String} end Date rental is due (YYYY-MM-DD)
   * @apiParam {Number} [userID] ID of renting user (automatically taken from token, but can be overridden)
   * @apiParam {Number} [externalRenterID] ID of external renter
   * @apiParam {Number} [organizationID] ID of organization (automatically taken from token, but can be overridden)
   * @apiParam {String{0..1000}} [notes] Notes about rental
   * @apiParam {Object[]} items List of items to rent
   * @apiParam {String} items.barcode Barcode of an item
   * @apiParam {String} [items.returned] Date item is returned (YYYY-MM-DD), defaults to `null` (`null` means that item
   * is rented)
   *
   * @apiUse RentalResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create rental', path: 'rental', version: '3.0.0'}, auth.verify, rental.addUserID, checkSubscription,
    rental.create)
  /**
   * @api {put} /rental/:rentalID Update a rental
   * @apiName UpdateRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 1.0.0
   *
   * @apiDeprecated Version 1 of this endpoint is no longer supported.
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
  app.put({name: 'update rental v1', path: 'rental/:rentalID', version: '1.0.0'}, auth.verify, checkSubscription,
    rental.update.versions[0])
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
  app.put({name: 'update rental v2', path: 'rental/:rentalID', version: '2.0.0'}, auth.verify, checkSubscription,
    rental.update.versions[1])
  /**
   * @api {put} /rental/:rentalID Update a rental
   * @apiName UpdateRental
   * @apiGroup Rental
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiParam {Number} [userID] ID of renting user
   * @apiParam {String} [start] Date rental taken out (YYYY-MM-DD)
   * @apiParam {String} [end] Date rental is due (YYYY-MM-DD)
   * @apiParam {String{0..1000}} [notes] Notes about rental
   * @apiParam {Number} [externalRenterID] ID of external renter
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse RentalResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update rental', path: 'rental/:rentalID', version: '3.0.0'}, auth.verify, checkSubscription,
    rental.update)
  /**
   * @api {delete} /rental/:rentalID Delete a rental
   * @apiName DeleteRental
   * @apiGroup Rental
   * @apiPermission Administrator
   * @apiVersion 3.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete rental', path: 'rental/:rentalID'}, auth.verify, auth.checkAdmin, checkSubscription,
    rental.delete)
}
