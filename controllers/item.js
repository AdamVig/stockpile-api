const auth = require('./auth')
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

item.withRentals = (req, queryBuilder) => {
  return queryBuilder
    .join('rental', 'item.itemID', 'rental.itemID')
    .select('rental.*')

  // Add pagination
    .modify(paginate.paginateQuery, req, 'item')
}

// Get active rental associated with item
item.withActiveRental = (req, queryBuilder) => {
  return queryBuilder
    .where('item.barcode', req.params.barcode)
    .join('rental', 'item.itemID', 'rental.itemID')
    .select('rental.*')
    .where('rental.returnDate', null)
    .orderBy('rental.startDate', 'ascending')
}

endpoint.addAllMethods(item, 'item', 'barcode')
item.getAll = endpoint.getAll('item', {modify: item.withFieldsAndFilters})
item.get = endpoint.get('item', 'barcode',
                        {modify: item.withFieldsAndFilters, messages})
item.getRentals = endpoint.getAll('item', {modify: item.withRentals})
item.getActiveRental = endpoint.get('item', 'itemID',
                                    {modify: item.withActiveRental})
item.getStatus = endpoint.get('itemStatus', 'barcode')

// Custom fields
item.forItem = (req, queryBuilder) => {
  return queryBuilder
    .where('barcode', req.params.barcode)
}
item.getCustomFieldValues = endpoint.getAll('itemCustomFieldValue',
                                            {modify: item.forItem})
item.getCustomFieldValue = endpoint.get('itemCustomFieldValue', 'customFieldID',
                                        {modify: item.forItem})
item.updateCustomFieldValue = endpoint.update('itemCustomFieldValue',
                                              'customFieldID',
                                              {modify: item.forItem})

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
   * @apiExample {json} Response format:
   * {
   *   "itemID": 0,
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
   * @apiExample {json} Response format:
   * {
   *   results: [
   *     {
   *       "itemID": 0,
   *       "organizationID": 0,
   *       "modelID": 0,
   *       "categoryID": 0,
   *       "barcode": "234234",
   *       "notes": ""
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
   *
   * @apiUse ItemResponse
   */
  app.get({name: 'get item', path: 'item/:barcode'}, auth.verify, item.get)
  /**
   * @api {put} /item Create an item
   * @apiName CreateItem
   * @apiGroup Item
   * @apiPermission User
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
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created row
   */
  app.put({name: 'create item', path: 'item'}, auth.verify, item.create)
  /**
   * @api {put} /item/:barcode Update item
   * @apiName UpdateItem
   * @apiGroup Item
   * @apiPermission User
   *
   * @apiParam {Number} [modelID] ID of model
   * @apiParam {Number} [categoryID] ID of category
   * @apiParam {String} [barcode] Unique identifier of item
   * @apiParam {String{0..1000}} [notes] Notes about item
   *
   * @apiUse ItemResponse
   */
  app.put({name: 'update item', path: 'item/:barcode'}, auth.verify, item.update)
  /**
   * @api {delete} /item/:barcode Delete item
   * @apiName DeleteItem
   * @apiGroup Item
   * @apiPermission User
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete item', path: 'item/:barcode'}, auth.verify, item.delete)
  /**
   * @api {get} /item/:barcode/rentals Get rentals of an item
   * @apiName GetItemRentals
   * @apiGroup Item
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
  app.get({name: 'get item rentals', path: 'item/:barcode/rentals'},
          auth.verify, item.getRentals)
    /**
   * @api {get} /item/:barcode/rental/active Get active rental of an item
   * @apiName GetItemActiveRental
   * @apiGroup Item
   * @apiPermission User
   *
   * @apiExample {json} Response Format
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
   *
   * @apiError 404 No active rental
   */
  app.get({name: 'get item active rental', path: 'item/:barcode/rental/active'},
          auth.verify, item.getActiveRental)
  /**
   * @api {get} /item/:barcode/status Get status of an item
   * @apiName GetItemStatus
   * @apiGroup Item
   * @apiPermission User
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
  app.get({name: 'get item status', path: 'item/:barcode/status'},
          auth.verify, item.getStatus)
  /**
   * @api {get} /item/:barcode/custom-field Get item custom field values
   * @apiName GetItemCustomFieldValues
   * @apiGroup ItemCustomField
   * @apiPermission User
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
  app.get({
    name: 'get item custom field values',
    path: 'item/:barcode/custom-field'
  }, auth.verify, item.getCustomFieldValues)
  /**
   * @api {get} /item/:barcode/custom-field/:customFieldID
   *   Get item custom field value
   * @apiName GetItemCustomFieldValue
   * @apiGroup ItemCustomField
   * @apiPermission User
   *
   * @apiExample {json} Response Format
   * {
   *   "barcode": 0,
   *   "customFieldID": 0,
   *   "organizationID": 0,
   *   "value": ""
   * }
   */
  app.get({
    name: 'get item custom field value',
    path: 'item/:barcode/custom-field/:customFieldID'
  }, auth.verify, item.getCustomFieldValue)
  /**
   * @api {put} /item/:barcode/custom-field/:customFieldID
   *   Update item custom field value
   * @apiName UpdateItemCustomFieldValue
   * @apiGroup ItemCustomField
   * @apiPermission User
   *
   * @apiDescription Custom fields can be created with *create custom field*. To
   *   "delete" a custom field value, set the value to an empty string.
   *
   * @apiParam {String{0..1000}} value A value for the custom field
   */
  app.put({
    name: 'update item custom field value',
    path: 'item/:barcode/custom-field/:customFieldID'
  }, auth.verify, item.updateCustomFieldValue)
}
