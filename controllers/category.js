const auth = require('./auth')
const endpoint = require('../services/endpoint')

const category = module.exports

endpoint.addAllMethods(category, 'category', 'categoryID')

category.mount = app => {
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
   * @apiParam {String{0...255}} name Name of category
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
   */
  app.del({name: 'delete category', path: 'category/:categoryID'},
          auth.verify, category.delete)
}
