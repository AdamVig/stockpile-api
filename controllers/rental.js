const auth = require('./auth')
const endpoint = require('../services/endpoint')

const rental = module.exports

// Join rental with item to get the item's tag
rental.withTag = (req, queryBuilder) => {
  return queryBuilder
    .select('rental.*')
    .leftJoin('item', 'rental.itemID', 'item.itemID')
    .select('item.tag')
}

const messages = {conflict: 'Cannot rent item, item is already rented'}

rental.getAll = endpoint.getAll('rental', {modify: rental.withTag})
rental.get = endpoint.get('rental', 'tag', {modify: rental.withTag})
rental.create = endpoint.create('rental', {messages})
rental.update = endpoint.update('rental', 'rentalID', {messages})
rental.delete = endpoint.delete('rental', {modify: rental.withTag})

rental.mount = app => {
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
   *   "tag": "",
   *   "userID": null
   * }
   */

  /**
   * @api {get} /rental Get all rentals
   * @apiName GetRentals
   * @apiGroup Rental
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
   *     "tag": "",
   *     "userID": null
   *   ]
   * }
   */
  app.get({name: 'get all rentals', path: 'rental'}, auth.verify, rental.getAll)
  /**
   * @api {get} /rental/:rentalID Get a rental
   * @apiName GetRental
   * @apiGroup Rental
   *
   * @apiUse RentalResponse
   */
  app.get({name: 'get rental', path: 'rental/:tag'},
          auth.verify, rental.get)
  /**
   * @api {put} /rental Create arental
   * @apiName CreateRental
   * @apiGroup Rental
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created row
   */
  app.put({name: 'create rental', path: 'rental'}, auth.verify, rental.create)
  /**
   * @api {put} /rental/:rentalID Update a rental
   * @apiName UpdateRental
   * @apiGroup Rental
   *
   * @apiUse RentalResponse
   */
  app.put({name: 'update rental', path: 'rental/:tag'},
          auth.verify, rental.update)
  /**
   * @api {delete} /rental/:rentalID Delete a rental
   * @apiName DeleteRental
   * @apiGroup Rental
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete rental', path: 'rental/:tag'},
          auth.verify, rental.delete)
}
