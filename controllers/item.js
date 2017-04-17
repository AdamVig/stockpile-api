const auth = require('./auth')
const endpoint = require('../services/endpoint')
const filterQuery = require('../services/filter-query')
const paginate = require('../services/paginate')

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
    .leftJoin('itemStatus', 'item.itemID', 'itemStatus.itemID')
    .select('itemStatus.available as available')

  // Add filters to query
    .modify(filterQuery(req, filterParams))

  // Add pagination
    .modify(paginate.paginateQuery, req, res, 'item')
}

endpoint.addAllMethods(item, 'item', 'barcode')
item.getAll = endpoint.getAll('item', {modify: item.withFieldsAndFilters})
item.get = endpoint.get('item', 'barcode', {modify: item.withFieldsAndFilters})

item.mount = app => {
  /**
   * @apiDefine ItemResponse
   *
   * @apiExample {json} Response format:
   * {
   *   "itemID": 0,
   *   "organizationID": 0,
   *   "modelID": 0,
   *   "categoryID": 0,
   *   "barcode": "234234"
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
   * @apiParam {Number} [brandID] Return items with only this brandID
   * @apiParam {Number} [modelID] Return items with only this modelID
   * @apiParam {Number} [categoryID] Return items with only this categoryID
   *
   * @apiParamExample Filter brand and model
   * /item?brandID=0&modelID=0
   * @apiParamExample Filter category
   * /item?categoryID=0
   *
   * @apiExample {json} Response format:
   * {
   *   results: [
   *     {
   *       "itemID": 0,
   *       "organizationID": 0,
   *       "modelID": 0,
   *       "categoryID": 0,
   *       "barcode": "234234"
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
   * @apiParam {Number} [modelID] ID of model
   * @apiParam {Number} [categoryID] ID of category
   * @apiParam {String} barcode Unique identifier of item
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
}
