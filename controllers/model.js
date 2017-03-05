const auth = require('./auth')
const endpoint = require('../services/endpoint')

const model = module.exports

endpoint.addAllMethods(model, 'model', 'modelID')

model.mount = app => {
  /**
   * @apiDefine ModelResponse
   *
   * @apiExample {json} Response format:
   * {
   *   "modelID": 0,
   *   "brandID": 0,
   *   "organizationID": 0,
   *   "name": ""
   * }
   */

  /**
   * @api {get} /model Get all models
   * @apiName GetModels
   * @apiGroup Model
   *
   * @apiExample {json} Response format:
   * {
   *   results: [
   *     {
   *       "modelID": 0,
   *       "brandID": 0,
   *       "organizationID": 0,
   *       "name": ""
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all models', path: 'model'}, auth.verify, model.getAll)
  /**
   * @api {get} /model/:modelID Get model
   * @apiName GetModel
   * @apiGroup Model
   *
   * @apiUse ModelResponse
   */
  app.get({name: 'get model', path: 'model/:modelID'}, auth.verify, model.get)
  /**
   * @api {put} /model Create a model
   * @apiName CreateModel
   * @apiGroup Model
   *
   * @apiParam {String{0...255}} name Name of model
   * @apiParam {Number} brandID ID of a brand
   */
  app.put({name: 'create model', path: 'model'}, auth.verify, model.create)
  /**
   * @api {put} /model/:modelID Update a model
   * @apiName UpdateModel
   * @apiGroup Model
   *
   * @apiParam {String{0...255}} [name] Name of model
   * @apiParam {Number} [brandID] ID of a brand
   *
   * @apiUse ModelResponse
   */
  app.put({name: 'update model', path: 'model/:modelID'},
          auth.verify, model.update)
  /**
   * @api {delete} /model/:modelID Delete a model
   * @apiName DeleteModel
   * @apiGroup Model
   */
  app.del({name: 'delete model', path: 'model/:modelID'},
          auth.verify, model.delete)
}
