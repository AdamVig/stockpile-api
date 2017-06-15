const auth = require('./auth')
const endpoint = require('../services/endpoint')
const paginate = require('../services/paginate')

const messages = {
  missing: 'Brand does not exist'
}

const brand = module.exports

endpoint.addAllMethods(brand, 'brand', 'brandID')

// Add pagination to query
brand.withPagination = (req, queryBuilder) => {
  return queryBuilder
    .modify(paginate.paginateQuery, req, 'brand')
}

brand.getAll = endpoint.getAll('brand', {modify: brand.withPagination})
brand.get = endpoint.get('brand', 'brandID', {messages})

brand.mount = app => {
  /**
   * @apiDefine Pagination
   *
   * @apiParam (Pagination) {Number{0..}} [limit] Max rows in response
   * @apiParam (Pagination) {Number{0..}} [offset] Rows to offset response by
   */

  /**
   * @apiDefine BrandResponse
   *
   * @apiExample {json} Response format:
   * {
   *   "brandID": 0,
   *   "organizationID": 0,
   *   "name": ""
   * }
   */

  /**
   * @api {get} /brand Get all brands
   * @apiName GetBrands
   * @apiGroup Brand
   * @apiPermission User
   *
   * @apiUse Pagination
   *
   * @apiExample {json} Response format:
   * {
   *   results: [
   *     {
   *       "brandID": 0,
   *       "organizationID": 0,
   *       "name": ""
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all brands', path: 'brand'}, auth.verify, brand.getAll)
  /**
   * @api {get} /brand/:brandID Get brand
   * @apiName GetBrand
   * @apiGroup Brand
   * @apiPermission User
   *
   * @apiUse BrandResponse
   */
  app.get({name: 'get brand', path: 'brand/:brandID'}, auth.verify, brand.get)
  /**
   * @api {put} /brand Create a brand
   * @apiName CreateBrand
   * @apiGroup Brand
   * @apiPermission User
   *
   * @apiDescription A brand represents a real-world brand like Apple or Canon.
   *   Each model must be associated with a brand.
   *
   * @apiParam {String{0...255}} name Name of brand
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created row
   */
  app.put({name: 'create brand', path: 'brand'}, auth.verify, brand.create)
  /**
   * @api {put} /brand/:brandID Update a brand
   * @apiName UpdateBrand
   * @apiGroup Brand
   * @apiPermission User
   *
   * @apiParam {String{0...255}} [name] Name of brand
   *
   * @apiUse BrandResponse
   */
  app.put({name: 'update brand', path: 'brand/:brandID'},
          auth.verify, brand.update)
  /**
   * @api {delete} /brand/:brandID Delete a brand
   * @apiName DeleteBrand
   * @apiGroup Brand
   * @apiPermission User
   *
   * @apiUse EndpointDelete
   */
  app.del({name: 'delete brand', path: 'brand/:brandID'},
          auth.verify, brand.delete)
}
