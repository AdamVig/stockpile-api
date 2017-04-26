const auth = require('./auth')
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

category.getAll = endpoint.getAll('category', {modify: category.withPagination})
category.get = endpoint.get('category', 'categoryID', {messages})

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
   * @apiExample {json} Response format:
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
   *
   * @apiUse Pagination
   *
   * @apiExample {json} Response format:
   * {
   *   results: [
   *     {
   *       "categoryID": 0,
   *       "organizationID": 0,
   *       "name": ""
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all categories', path: 'category'},
          auth.verify, category.getAll)
  /**
   * @api {get} /category/:categoryID Get category
   * @apiName GetCategory
   * @apiGroup Category
   *
   * @apiUse CategoryResponse
   */
  app.get({name: 'get category', path: 'category/:categoryID'},
          auth.verify, category.get)
  /**
   * @api {put} /category Create a category
   * @apiName CreateCategory
   * @apiGroup Category
   *
   * @apiDescription Each item must belong to a category. Categories can be used
   *   to group items that are similar. Custom fields can be assigned to
   *   specific categories.
   *
   * @apiParam {String{0...255}} name Name of category
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created row
   */
  app.put({name: 'create category', path: 'category'},
          auth.verify, category.create)
  /**
   * @api {put} /category/:categoryID Update a category
   * @apiName UpdateCategory
   * @apiGroup Category
   *
   * @apiParam {String{0...255}} [name] Name of category
   *
   * @apiUse CategoryResponse
   */
  app.put({name: 'update category', path: 'category/:categoryID'},
          auth.verify, category.update)
  /**
   * @api {delete} /category/:categoryID Delete a category
   * @apiName DeleteCategory
   * @apiGroup Category
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete category', path: 'category/:categoryID'},
          auth.verify, category.delete)
}
