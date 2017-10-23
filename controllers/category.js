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
  sortBy: [{column: 'category.name', ascending: true}],
  searchColumns: ['category.name']
})
category.get = endpoint.get('category', 'categoryID', {messages})

category.withCustomFields = (req, queryBuilder) => {
  return queryBuilder
    .select('customField.name as customFieldName',
      'customField.customFieldID',
      'customField.organizationID')
    // Join custom field categories with their custom fields; include custom fields with no categories
    .leftJoin('customFieldCategory', 'customField.customFieldID', 'customFieldCategory.customFieldID')
    // Only get custom fields that are specifically for this category or that apply to all categories
    .where(function () {
      this.where('customFieldCategory.categoryID', req.params.categoryID)
        .orWhereNull('customFieldCategory.categoryID')
    })
}
// Use `getAll` so all rows are returned
category.getCustomFields = endpoint.getAll('customField', {modify: category.withCustomFields})

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
   * @apiUse Search
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
