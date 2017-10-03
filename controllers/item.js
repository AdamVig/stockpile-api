const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
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
    .modify(filterQuery(req, filterParams))

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
    .where('rental.returnDate', null)
    .orderBy('rental.startDate', 'ascending')
}
const sortBy = [
  {column: 'brand', ascending: true},
  {column: 'model', ascending: true}
]
item.getAll = endpoint.getAll('item', {modify: item.withFieldsAndFilters, sortBy})
item.get = endpoint.get('item', 'barcode',
  {modify: item.withFieldsAndFilters, messages})
item.create = endpoint.create('item', 'barcode',
                              {resModify: item.withFieldsAndFilters})
item.update = endpoint.update('item', 'barcode',
                              {resModify: item.withFieldsAndFilters})
item.delete = endpoint.delete('item', 'barcode'
)
item.getRentals = endpoint.getAll('rental', {modify: item.paginateRentals})
item.getActiveRental = endpoint.get('rental', 'barcode',
                                    {modify: item.withActiveRental})
item.getStatus = endpoint.get('itemStatus', 'barcode', {hasOrganizationID: false})

// Custom fields
item.forItem = (req, queryBuilder) => {
  return queryBuilder
    .where('barcode', req.params.barcode)
}
item.getCustomFieldValues = endpoint.getAll('itemCustomFieldValue', {
  modify: item.forItem,
  hasOrganizationID: false
})
item.getCustomFieldValue = endpoint.get('itemCustomFieldValue', 'customFieldID', {
  modify: item.forItem,
  hasOrganizationID: false
})
item.updateCustomFieldValue = endpoint.update('itemCustomFieldValue', 'customFieldID', {
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
   *   "organizationID": 0,
   *   "modelID": 0,
   *   "categoryID": 0,
   *   "barcode": "234234",
   *   "notes": ""
   * }
   */

  /**
   * @api {get} /item Get all items
   * @apiName GetItems
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiDescription This endpoint can be filtered using the query parameters
   * specified below. Any of the filters can be applied at the same time in
   * any order.
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
   *       "organizationID": 0,
   *       "modelID": 0,
   *       "categoryID": 0,
   *       "barcode": "234234",
   *       "notes": "",
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
   * @apiVersion 2.0.0
   *
   * @apiUse ItemResponse
   */
  app.get({name: 'get item', path: 'item/:barcode'}, auth.verify, item.get)
  /**
   * @api {put} /item Create an item
   * @apiName CreateItem
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 2.0.0
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
   * @apiVersion 2.0.0
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
   * @apiVersion 2.0.0
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
  app.get({name: 'get item rentals', path: 'item/:barcode/rentals'}, auth.verify, item.getRentals)
    /**
   * @api {get} /item/:barcode/rental/active Get active rental of an item
   * @apiName GetItemActiveRental
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 2.0.0
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
   *
   * @apiError 404 No active rental
   */
  app.get({name: 'get item active rental', path: 'item/:barcode/rental/active'}, auth.verify, item.getActiveRental)
  /**
   * @api {get} /item/:barcode/status Get status of an item
   * @apiName GetItemStatus
   * @apiGroup Item
   * @apiPermission User
   * @apiVersion 2.0.0
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
   * @api {get} /item/:barcode/custom-field Get item custom field values
   * @apiName GetItemCustomFieldValues
   * @apiGroup ItemCustomField
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiDescription Custom field values are automatically initialized to empty
   *   strings when a new custom field is created, so empty strings will be
   *   returned until a value is set.
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     {
   *       "barcode": 0,
   *       "customFieldID": 0,
   *       "organizationID": 0,
   *       "value": ""
   *     }
   *   ]
   * }
   */
  app.get({name: 'get item custom field values', path: 'item/:barcode/custom-field'}, auth.verify,
    item.getCustomFieldValues)
  /**
   * @api {get} /item/:barcode/custom-field/:customFieldID
   *   Get item custom field value
   * @apiName GetItemCustomFieldValue
   * @apiGroup ItemCustomField
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   "barcode": 0,
   *   "customFieldID": 0,
   *   "organizationID": 0,
   *   "value": ""
   * }
   */
  app.get({name: 'get item custom field value', path: 'item/:barcode/custom-field/:customFieldID'}, auth.verify,
    item.getCustomFieldValue)
  /**
   * @api {put} /item/:barcode/custom-field/:customFieldID
   *   Update item custom field value
   * @apiName UpdateItemCustomFieldValue
   * @apiGroup ItemCustomField
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiDescription Custom fields can be created with *create custom field*. To
   *   "delete" a custom field value, set the value to an empty string.
   *
   * @apiParam {String{0..1000}} value A value for the custom field
   *
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update item custom field value', path: 'item/:barcode/custom-field/:customFieldID'}, auth.verify,
    checkSubscription, item.updateCustomFieldValue)
}
