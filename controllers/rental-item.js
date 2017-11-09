const rentalItem = module.exports

const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const endpoint = require('../services/endpoint')

rentalItem.forRental = (req, queryBuilder) => {
  return queryBuilder
    .where('rentalItem.rentalId', req.params.rentalId)
}

rentalItem.withItemDetails = (req, queryBuilder) => {
  return queryBuilder
    .select('rentalItem.*')

    .join('item', 'rentalItem.barcode', 'item.barcode')

    .join('model', 'item.modelId', 'model.modelId')
    .select('model.modelId', 'model.name as modelName')

    .join('brand', 'model.brandId', 'brand.brandId')
    .select('brand.brandId', 'brand.name as brandName')

    .modify(rentalItem.forRental.bind(null, req))
}

rentalItem.getAll = endpoint.getAll('rentalItem', {modify: rentalItem.withItemDetails, hasOrganizationID: false})
rentalItem.get = endpoint.get('rentalItem', 'barcode', {modify: rentalItem.withItemDetails, hasOrganizationID: false})
rentalItem.update = endpoint.update('rentalItem', 'barcode', {
  modify: rentalItem.forRental,
  resModify: rentalItem.withItemDetails,
  hasOrganizationID: false
})
rentalItem.delete = endpoint.delete('rentalItem', 'barcode', {modify: rentalItem.forRental, hasOrganizationID: false})

rentalItem.mount = app => {
  /**
   * @apiDefine RentalItemResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "rentalID": 0,
   *   "barcode": "",
   *   "returned": null,
   *   "brandId": 0,
   *   "brandName": "",
   *   "modelId": 0,
   *   "modelName": ""
   * }
   */

  /**
   * @api {get} /rental/:rentalId/item Get all rental items
   * @apiName GetRentalItems
   * @apiGroup RentalItem
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiExample {json} Response Format
   * {
   *  "results": [
   *   {
   *    "rentalID": 0,
   *    "barcode": "",
   *    "returned": null
   *    "brandId": 0,
   *    "brandName": "",
   *    "modelId": 0,
   *    "modelName": ""
   *   }
   *  ]
   * }
   */
  app.get({name: 'get all rental items', path: 'rental/:rentalId/item'}, auth.verify, checkSubscription,
    rentalItem.getAll)
  /**
   * @api {get} /rental/:rentalId/item/:barcode Get rental item
   * @apiName GetRentalItem
   * @apiGroup RentalItem
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse RentalItemResponse
   */
  app.get({name: 'get rental item', path: 'rental/:rentalId/item/:barcode'}, auth.verify, checkSubscription,
    rentalItem.get)
  /**
   * @api {put} /rental/:rentalId/item/:barcode Update rental item
   * @apiName UpdateRentalItem
   * @apiGroup RentalItem
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription The `returned` field of each rental item is set to `null` by default. Setting a value for
   * `returned` both records that date and time that the item was returned and marks the item as returned.
   *
   * @apiParam {String} returned Date item is returned (YYYY-MM-DD)
   *
   * @apiUse RentalItemResponse
   */
  app.put({name: 'update rental item', path: 'rental/:rentalId/item/:barcode'}, auth.verify, checkSubscription,
    rentalItem.update)
  /**
   * @api {delete} /rental/:rentalId/item/:barcode Delete rental item
   * @apiName DeleteRentalItem
   * @apiGroup RentalItem
   * @apiPermission Admin
   * @apiVersion 3.0.0
   *
   * @apiUse EndpointDelete
   */
  app.del({name: 'delete rental item', path: 'rental/:rentalId/item/:barcode'}, auth.verify, auth.checkAdmin,
    checkSubscription, rentalItem.delete)
}
