const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const db = require('../services/db')
const endpoint = require('../services/endpoint')
const filterQuery = require('../services/filter-query')
const paginate = require('../services/paginate')

const messages = {
  missing: 'Item does not exist'
}

const item = module.exports

item.withFieldsAndFilters = (req, queryBuilder) => {
  // Mapping between query param fields and database query column names
  const filterParams = new Map()
  filterParams.set('brandID', 'brand.brandID')
  filterParams.set('modelID', 'model.modelID')
  filterParams.set('categoryID', 'category.categoryID')
  filterParams.set('available', 'itemStatus.available')

  return queryBuilder
    .select('item.*')

  // Model
    .leftJoin('model', 'item.modelID', 'model.modelID')
    .select('model.name as model')
    .select('model.brandID')

  // Brand
    .leftJoin('brand', 'model.brandID', 'brand.brandID')
    .select('brand.name as brand')

  // Category
    .leftJoin('category', 'item.categoryID', 'category.categoryID')
    .select('category.name as category')

  // Status
    .leftJoin('itemStatus', 'item.barcode', 'itemStatus.barcode')
    .select('itemStatus.available as available')

  // Add filters to query
    .modify(filterQuery, req, filterParams)

  // Add pagination
    .modify(paginate.paginateQuery, req, 'item')
}

item.paginateRentals = (req, queryBuilder) => {
  return queryBuilder
    .modify(paginate.paginateQuery, req, 'rental')
}

// Get active rental associated with item
item.withActiveRental = (req, queryBuilder) => {
  return queryBuilder
    .join('rental', 'rentalItem.rentalID', 'rental.rentalID')
    .where('rentalItem.returned', null)
    .orderBy('rental.start', 'ascending')
}
const sortBy = [
  {column: 'brand', ascending: true},
  {column: 'model', ascending: true}
]
item.getAll = endpoint.getAll('item', {
  modify: item.withFieldsAndFilters,
  sortBy,
  searchColumns: ['brand.name', 'model.name']
})
item.get = endpoint.get('item', 'barcode',
  {modify: item.withFieldsAndFilters, messages})
item.create = endpoint.create('item', 'barcode',
  {resModify: item.withFieldsAndFilters})
item.update = endpoint.update('item', 'barcode',
  {resModify: item.withFieldsAndFilters})
item.delete = endpoint.delete('item', 'barcode'
)
item.getRentals = endpoint.getAll('rental', {modify: item.paginateRentals})
item.getActiveRental = endpoint.get('rentalItem', 'barcode', {
  modify: item.withActiveRental,
  hasOrganizationID: false
})
item.getStatus = endpoint.get('itemStatus', 'barcode', {hasOrganizationID: false})

// Custom fields
item.forItem = (req, queryBuilder) => {
  return queryBuilder
    // Only get rows for this item
    .where('barcode', req.params.barcode)
}
item.withCustomFieldDetails = (req, queryBuilder) => {
  return queryBuilder
    .select('itemCustomField.*')
    .join('customField', 'itemCustomField.customFieldID', 'customField.customFieldID')
    .select('customField.name as customFieldName', 'customField.showTimestamp')
    .modify(item.forItem.bind(null, req))
}
// Add custom fields to "get all items" query
item.withCustomFields = (req, queryBuilder) => {
  return queryBuilder
    .select(
      'item.barcode',
      'item.categoryID',
      'customField.name as customFieldName',
      'customField.customFieldID',
      'customField.organizationID',
      'customField.showTimestamp',
      'itemCustomField.value',
      'itemCustomField.updated'
    )
    // Join custom fields with their categories (`categoryID = null` if no categories are specified)
    .leftJoin('customFieldCategory', 'customField.customFieldID', 'customFieldCategory.customFieldID')
    // Get items that match each custom field
    .join('item', function () {
      this.on(function () {
        this.andOn('customFieldCategory.categoryID', 'item.categoryID')
          .orOnNull('customFieldCategory.categoryID')
      }).andOn('customField.organizationID', 'item.organizationID')
    })
    // Get item custom fields for this item and custom field
    .leftJoin('itemCustomField', function () {
      this.on('customField.customFieldID', 'itemCustomField.customFieldID')
        .on('item.barcode', 'itemCustomField.barcode')
    })
    .where('item.barcode', req.params.barcode)
}
item.getCustomFields = endpoint.getAll('customField', {
  modify: item.withCustomFields
})
item.getCustomField = endpoint.get('itemCustomField', 'customFieldID', {
  modify: item.withCustomFieldDetails,
  hasOrganizationID: false
})
item.updateCustomField = (req, res, next) => {
  const columns = ['barcode', 'customFieldID', 'value']
  const values = [req.params.barcode, req.params.customFieldID, req.body.value]

  // Insert or update item custom field value
  return db.raw('replace into itemCustomField (??) values (?)', [columns, values])
    .then(() => db('itemCustomField')
      .where({barcode: req.params.barcode, customFieldID: req.params.customFieldID}).first()
    ).then(({value, updated}) => {
      res.send({
        message: 'Updated item custom field',
        value,
        updated
      })
    })
    .then(next)
    .catch(err => endpoint.handleError(err, {}, next, req))
}
item.deleteCustomField = endpoint.delete('itemCustomField', 'customFieldID', {
  modify: item.forItem,
  hasOrganizationID: false
})

item.mount = app => {
  /**
   * @apiDefine Pagination
   *
   * @apiParam (Pagination) {Number{0..}} [limit] Max rows in response
   * @apiParam (Pagination) {Number{0..}} [offset] Rows to offset response by
   */

  /**
   * @apiDefine ItemResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "available": 1,
   *   "barcode": "",
   *   "brand": "",
   *   "brandID": 0,
   *   "category": "",
   *   "categoryID": 0,
   *   "model": "",
   *   "modelID": 0,
   *   "notes": "",
   *   "organizationID": 0
   * }
   */

  /**
   * @api {get} /item Get all items
   * @apiName GetItems
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription This endpoint can be filtered using the query parameters
   * specified below. Any of the filters can be applied at the same time in
   * any order.
   *
   * @apiUse Search
   *
   * @apiParam (Filter) {Number} [brandID] Return items with only this brandID
   * @apiParam (Filter) {Number} [modelID] Return items with only this modelID
   * @apiParam (Filter) {Number} [categoryID] Return items with only this
   *   categoryID
   * @apiParamExample Filter brand and model
   * /item?brandID=0&modelID=0
   * @apiParamExample Filter category
   * /item?categoryID=0
   *
   *
   * @apiUse Pagination
   * @apiParamExample Paginate response
   * /item?limit=10&offset=10
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "available": 1,
   *       "barcode": "",
   *       "brand": "",
   *       "brandID": 0,
   *       "category": "",
   *       "categoryID": 0,
   *       "model": "",
   *       "modelID": 0,
   *       "notes": "",
   *       "organizationID": 0
   *       "sortIndex": 0
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all items', path: 'item'}, auth.verify, item.getAll)
  /**
   * @api {get} /item/:barcode Get an item
   * @apiName GetItem
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse ItemResponse
   */
  app.get({name: 'get item', path: 'item/:barcode'}, auth.verify, item.get)
  /**
   * @api {put} /item Create an item
   * @apiName CreateItem
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription An item represents a physical object owned by the
   *   organization. Items must have physical barcodes in order for the
   *   application to be able to identify them.
   *
   * @apiParam {Number} [modelID] ID of model
   * @apiParam {Number} [categoryID] ID of category
   * @apiParam {String} barcode Unique identifier of item
   * @apiParam {String{0..1000}} [notes] Notes about item
   *
   * @apiUse ItemResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create item', path: 'item'}, auth.verify, checkSubscription, item.create)
  /**
   * @api {put} /item/:barcode Update item
   * @apiName UpdateItem
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiParam {Number} [modelID] ID of model
   * @apiParam {Number} [categoryID] ID of category
   * @apiParam {String} [barcode] Unique identifier of item
   * @apiParam {String{0..1000}} [notes] Notes about item
   *
   * @apiUse ItemResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update item', path: 'item/:barcode'}, auth.verify, checkSubscription, item.update)
  /**
   * @api {delete} /item/:barcode Delete item
   * @apiName DeleteItem
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete item', path: 'item/:barcode'}, auth.verify, checkSubscription, item.delete)
  /**
   * @api {get} /item/:barcode/rentals Get rentals of an item
   * @apiName GetItemRentals
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
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
   *     "isReservation": 0,
   *     "externalRenterID": 0
   *   ]
   * }
   */
  app.get({name: 'get item rentals', path: 'item/:barcode/rentals'}, auth.verify, item.getRentals)
  /**
   * @api {get} /item/:barcode/rental/active Get active rental of an item
   * @apiName GetItemActiveRental
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
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
   *   "isReservation": 0,
   *   "externalRenterID": 0
   * }
   *
   * @apiError 404 No active rental
   */
  app.get({name: 'get item active rental', path: 'item/:barcode/rental/active'}, auth.verify, item.getActiveRental)
  /**
   * @api {get} /item/:barcode/status Get status of an item
   * @apiName GetItemStatus
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription An item's status is either available or unavailable. In the
   *   response from this endpoint, the `available` property will equal either
   *   `1` or `0`, respectively. An item is considered available if there are no
   *   rentals for it or if all of the rentals for it have `returnDate` set.
   *
   *   **Note:** `organizationID` is deprecated and will be removed in a future
   *   release.
   *
   * @apiExample {json} Response Format
   * {
   *   "available": 0,
   *   "barcode": "",
   *   "organizationID": 0
   * }
   */
  app.get({name: 'get item status', path: 'item/:barcode/status'}, auth.verify, item.getStatus)
  /**
   * @api {get} /item/:barcode/custom-field Get item custom fields
   * @apiName GetItemCustomFields
   * @apiGroup ItemCustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @description Every item custom field will always return an `updated` timestamp, but users can set whether the
   * client should show the timestamp for a custom field by setting `showTimestamp` on a custom field.
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     {
   *       "barcode": "",
   *       "categoryID": 0,
   *       "customFieldID": 0,
   *       "customFieldName": "",
   *       "organizationID": 0,
   *       "value": "",
   *       "updated": "2017-11-07T02:42:31.000Z",
   *       "showTimestamp": 1,
   *       "sortIndex": 0
   *     }
   *   ]
   * }
   */
  app.get({name: 'get item custom fields', path: 'item/:barcode/custom-field'}, auth.verify, item.getCustomFields)
  /**
   * @api {get} /item/:barcode/custom-field/:customFieldID Get item custom field
   * @apiName GetItemCustomField
   * @apiGroup ItemCustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   "barcode": "",
   *   "customFieldID": 0,
   *   "customFieldName": "",
   *   "value": "",
   *   "updated": "2017-11-07T02:42:31.000Z",
   *   "showTimestamp": 1,
   * }
   */
  app.get({name: 'get item custom field', path: 'item/:barcode/custom-field/:customFieldID'}, auth.verify,
    item.getCustomField)
  /**
   * @api {put} /item/:barcode/custom-field/:customFieldID Update item custom field
   * @apiName UpdateItemCustomField
   * @apiGroup ItemCustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription Sets the value for a custom field for an item.
   *
   * @apiParam {String{0..1000}} value A value for the custom field
   *
   * @apiExample {json} Response Format
   * {
   *   "message": "Updated item custom field",
   *   "value": "",
   *   "updated": "2017-11-07T02:42:31.000Z"
   * }
   *
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update item custom field', path: 'item/:barcode/custom-field/:customFieldID'}, auth.verify,
    checkSubscription, item.updateCustomField)
  /**
   * @api {delete} /item/:barcode/custom-field/:customFieldID Delete item custom field
   * @apiName DeleteItemCustomField
   * @apiGroup ItemCustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription Unset the value of a custom field for an item.
   *
   * @apiUse EndpointDelete
   *
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete item custom field', path: 'item/:barcode/custom-field/:customFieldID'}, auth.verify,
    checkSubscription, item.deleteCustomField)
}
