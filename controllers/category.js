const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const endpoint = require('../services/endpoint')
const paginate = require('../services/paginate')

const messages = {
  missing: 'Category does not exist'
}

const category = module.exports

endpoint.addAllMethods(category, 'category', 'categoryID')

// Add pagination to query
category.withPagination = (req, queryBuilder) => {
  return queryBuilder
    .modify(paginate.paginateQuery, req, 'category')
}

category.getAll = endpoint.getAll('category', {
  modify: category.withPagination,
  sortBy: [{column: 'category.name', ascending: true}]
})
category.get = endpoint.get('category', 'categoryID', {messages})

category.withCustomFields = (req, queryBuilder) => {
  const selectColumns = [
    'customField.name as customFieldName',
    'customField.customFieldID',
    'customField.organizationID'
  ]
  return queryBuilder
    .select(selectColumns)
    // Get custom fields for the item's category
    .join('customFieldCategory', 'category.categoryID', 'customFieldCategory.categoryID')
    .join('customField', 'customFieldCategory.customFieldID', 'customField.customFieldID')
    // Only get rows for this category
    .where('category.categoryID', req.params.categoryID)
    // Get custom fields that apply to items in all categories
    .union(function () {
      this.select(selectColumns)
        .from('customField')
        // Join all custom fields with all categories (`categoryID = null` if no categories are specified)
        .leftJoin('customFieldCategory', 'customField.customFieldID', 'customFieldCategory.customFieldID')
        .where('customFieldCategory.categoryID', null)
        .andWhere('customField.organizationID', req.user.organizationID)
    })
}
// Use `getAll` so all rows are returned
category.getCustomFields = endpoint.getAll('category', {modify: category.withCustomFields})

category.mount = app => {
  /**
   * @apiDefine Pagination
   *
   * @apiParam (Pagination) {Number{0..}} [limit] Max rows in response
   * @apiParam (Pagination) {Number{0..}} [offset] Rows to offset response by
   */

  /**
   * @apiDefine CategoryResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "categoryID": 0,
   *   "organizationID": 0,
   *   "name": ""
   * }
   */

  /**
   * @api {get} /category Get all categories
   * @apiName GetCategories
   * @apiGroup Category
   * @apiVersion 2.0.0
   *
   * @apiUse Pagination
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "categoryID": 0,
   *       "organizationID": 0,
   *       "name": "",
   *       "sortIndex": 0
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all categories', path: 'category'}, auth.verify, category.getAll)
  /**
   * @api {get} /category/:categoryID Get category
   * @apiName GetCategory
   * @apiGroup Category
   * @apiVersion 2.0.0
   *
   * @apiUse CategoryResponse
   */
  app.get({name: 'get category', path: 'category/:categoryID'}, auth.verify, category.get)
  /**
   * @api {put} /category Create a category
   * @apiName CreateCategory
   * @apiGroup Category
   * @apiVersion 2.0.0
   *
   * @apiDescription Each item must belong to a category. Categories can be used
   *   to group items that are similar. Custom fields can be assigned to
   *   specific categories.
   *
   * @apiParam {String{0...255}} name Name of category
   *
   * @apiUse CategoryResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create category', path: 'category'}, auth.verify, checkSubscription, category.create)
  /**
   * @api {put} /category/:categoryID Update a category
   * @apiName UpdateCategory
   * @apiGroup Category
   * @apiVersion 2.0.0
   *
   * @apiParam {String{0...255}} [name] Name of category
   *
   * @apiUse CategoryResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update category', path: 'category/:categoryID'}, auth.verify, checkSubscription, category.update)
  /**
   * @api {delete} /category/:categoryID Delete a category
   * @apiName DeleteCategory
   * @apiGroup Category
   * @apiVersion 2.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete category', path: 'category/:categoryID'}, auth.verify, checkSubscription, category.delete)
  /**
   * @api {get} /category/:categoryID/custom-field Get category custom fields
   * @apiName GetAllCategoryCustomFields
   * @apiGroup Category
   * @apiVersion 2.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     {
   *       "customFieldID": 0,
   *       "customFieldName": "",
   *       "organizationID": 0,
   *       "sortIndex": 0
   *     }
   *   ]
   * }
   *
   * @apiUse InvalidSubscriptionResponse
   */
  app.get({name: 'get all category custom fields', path: 'category/:categoryID/custom-field'}, auth.verify,
    checkSubscription, category.getCustomFields)
}
