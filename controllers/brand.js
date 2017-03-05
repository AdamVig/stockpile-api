const auth = require('./auth')
const endpoint = require('../services/endpoint')

const brand = module.exports

endpoint.addAllMethods(brand, 'brand', 'brandID')

brand.mount = app => {
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
   *
   * @apiUse BrandResponse
   */
  app.get({name: 'get brand', path: 'brand/:brandID'}, auth.verify, brand.get)
  /**
   * @api {put} /brand Create a brand
   * @apiName CreateBrand
   * @apiGroup Brand
   *
   * @apiParam {String{0...255}} name Name of brand
   */
  app.put({name: 'create brand', path: 'brand'}, auth.verify, brand.create)
  /**
   * @api {put} /brand/:brandID Update a brand
   * @apiName UpdateBrand
   * @apiGroup Brand
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
   */
  app.del({name: 'delete brand', path: 'brand/:brandID'},
          auth.verify, brand.delete)
}
