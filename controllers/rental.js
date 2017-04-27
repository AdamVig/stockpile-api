const jwt = require('jwt-simple')

const auth = require('./auth')
const endpoint = require('../services/endpoint')
const paginate = require('../services/paginate')

const rental = module.exports

// Join rental with item to get the item's barcode
rental.withBarcode = (req, queryBuilder) => {
  return queryBuilder
    .select('rental.*')
    .leftJoin('item', 'rental.itemID', 'item.itemID')
    .select('item.barcode')
}

rental.withBarcodeAndPagination = (req, queryBuilder) => {
  return rental.withBarcode(req, queryBuilder)
    .modify(paginate.paginateQuery, req, 'rental')
}

// Get user ID from token and add to request body
rental.addUserID = function addUserID (req, res, next) {
  try {
    const token = req.headers.authorization.replace('Bearer ', '')
    const payload = jwt.decode(token, process.env.JWT_SECRET)
    req.body.userID = payload.userID
    return next()
  } catch (err) {
    return next(err)
  }
}

const messages = {
  conflict: 'Cannot rent item, item is already rented',
  missing: 'Rental does not exist'
}

rental.getAll = endpoint.getAll('rental',
                                {modify: rental.withBarcodeAndPagination})
rental.get = endpoint.get('rental', 'barcode',
                          {modify: rental.withBarcode, messages})
rental.create = endpoint.create('rental', {messages})
rental.update = endpoint.update('rental', 'rentalID', {messages})
rental.delete = endpoint.delete('rental', {modify: rental.withBarcode})

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
   * @apiExample {json} Response format:
   * {
   *   "endDate": "2017-02-23T05:00:00.000Z",
   *   "itemID": 0,
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
   *
   * @apiUse Pagination
   *
   * @apiExample {json} Response format:
   * {
   *   "results": [
   *     "endDate": "2017-02-23T05:00:00.000Z",
   *     "itemID": 0,
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
   *
   * @apiDescription To find the `rentalID` of an item's current active rental
   *   by the item's barcode, use `GET /item/:barcode/status`. To find all
   *   current and past rentals of an item, use `GET /item/:barcode/rentals`.
   *
   * @apiUse RentalResponse
   */
  app.get({name: 'get rental', path: 'rental/:rentalID'},
          auth.verify, rental.get)
  /**
   * @api {put} /rental Create a rental
   * @apiName CreateRental
   * @apiGroup Rental
   * @apiPermission User
   *
   * @apiDescription Rentals track the availability of items. To mark a rental
   *   as returned, *do not delete the rental*, but instead set `returnDate` to
   *   the date the item was returned. Rentals are associated with users and
   *   optionally with external renters.
   *
   * @apiParam {Number} userID ID of renting user
   * @apiParam {Number} itemID ID of rented item
   * @apiParam {String} startDate Date rental taken out (YYYY-MM-DD)
   * @apiParam {String} endDate Date rental is due (YYYY-MM-DD)
   * @apiParam {String} [returnDate] Date item is returned (YYYY-MM-DD)
   * @apiParam {Number} [externalRenterID] ID of external renter
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   * @apiParam {String{0..1000}} [notes] Notes about rental
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created row
   */
  app.put({name: 'create rental', path: 'rental'}, auth.verify,
          rental.addUserID, rental.create)
  /**
   * @api {put} /rental/:rentalID Update a rental
   * @apiName UpdateRental
   * @apiGroup Rental
   * @apiPermission User
   *
   * @apiParam {Number} [userID] ID of renting user
   * @apiParam {Number} [itemID] ID of rented item
   * @apiParam {String} [startDate] Date rental taken out (YYYY-MM-DD)
   * @apiParam {String} [endDate] Date rental is due (YYYY-MM-DD)
   * @apiParam {String} [returnDate] Date item is returned (YYYY-MM-DD)
   * @apiParam {String{0..1000}} [notes] Notes about rental
   * @apiParam {Number} [externalRenterID] ID of external renter
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse RentalResponse
   */
  app.put({name: 'update rental', path: 'rental/:rentalID'},
          auth.verify, rental.update)
  /**
   * @api {delete} /rental/:rentalID Delete a rental
   * @apiName DeleteRental
   * @apiGroup Rental
   * @apiPermission Administrator
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete rental', path: 'rental/:rentalID'},
          auth.verify, auth.checkAdmin, rental.delete)
}
