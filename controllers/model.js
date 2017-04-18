const auth = require('./auth')
const endpoint = require('../services/endpoint')
const paginate = require('../services/paginate')

const messages = {
  missing: 'Model does not exist'
}

const model = module.exports

model.withKits = (req, queryBuilder) => {
  return queryBuilder
    .select('kit.*')
    .where('model.modelID', req.params.modelID)
    .join('kitModels', 'model.modelID', 'kitModels.modelID')
    .join('kit', 'kitModels.kitID', 'kit.kitID')
}

endpoint.addAllMethods(model, 'model', 'modelID')
model.getKits = endpoint.getAll('model', {modify: model.withKits})

// Add pagination to query
model.withPagination = (req, queryBuilder) => {
  return queryBuilder
    .modify(paginate.paginateQuery, req, 'model')
}

model.getAll = endpoint.getAll('model', {modify: model.withPagination})
model.get = endpoint.get('model', 'modelID', {messages})

model.mount = app => {
  /**
   * @apiDefine Pagination
   *
   * @apiParam (Pagination) {Number{0..}} [limit] Max rows in response
   * @apiParam (Pagination) {Number{0..}} [offset] Rows to offset response by
   */

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
   * @apiUse Pagination
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
   * @apiPermission User
   *
   * @apiUse ModelResponse
   */
  app.get({name: 'get model', path: 'model/:modelID'}, auth.verify, model.get)
  /**
   * @api {put} /model Create a model
   * @apiName CreateModel
   * @apiGroup Model
   * @apiPermission User
   *
   * @apiParam {String{0...255}} name Name of model
   * @apiParam {Number} brandID ID of a brand
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created row
   */
  app.put({name: 'create model', path: 'model'}, auth.verify, model.create)
  /**
   * @api {put} /model/:modelID Update a model
   * @apiName UpdateModel
   * @apiGroup Model
   * @apiPermission User
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
   * @apiPermission User
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete model', path: 'model/:modelID'},
          auth.verify, model.delete)
  /**
   * @api {get} /model/:modelID/kits Get model kits
   * @apiName GetModelKits
   * @apiGroup Model
   * @apiPermission User
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "kitID": 0,
   *       "organizationID": 0,
   *       "name": ""
   *     }
   *   ]
   * }
   */
  app.get({name: 'get model kits', path: 'model/:modelID/kits'}, auth.verify,
          model.getKits)
}
