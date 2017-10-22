const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
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
    .join('kitModel', 'model.modelID', 'kitModel.modelID')
    .join('kit', 'kitModel.kitID', 'kit.kitID')
}

model.withBrand = (req, queryBuilder) => {
  return queryBuilder
    .select('model.*')
    .join('brand', 'model.brandID', 'brand.brandID')
    .select('brand.name as brand')
}

// Add pagination to query
model.withPaginationAndBrand = (req, queryBuilder) => {
  return queryBuilder
    .modify(model.withBrand.bind(null, req))
    .modify(paginate.paginateQuery, req, 'model')
}

endpoint.addAllMethods(model, 'model', 'modelID')
model.getKits = endpoint.getAll('model', {modify: model.withKits})
model.getAll = endpoint.getAll('model', {
  modify: model.withPaginationAndBrand,
  sortBy: [
    {column: 'brand.name', ascending: true},
    {column: 'model.name', ascending: true}
  ],
  searchColumns: ['model.name']
})
model.get = endpoint.get('model', 'modelID', {messages, modify: model.withBrand})
model.create = endpoint.create('model', 'modelID', {messages, resModify: model.withBrand})

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
   * @apiExample {json} Response Format
   * {
   *   "modelID": 0,
   *   "brandID": 0,
   *   "organizationID": 0,
   *   "name": "",
   *   "brand": ""
   * }
   */

  /**
   * @api {get} /model Get all models
   * @apiName GetModels
   * @apiGroup Model
   * @apiVersion 2.0.0
   *
   * @apiUse Pagination
   * @apiUse Search
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "modelID": 0,
   *       "brandID": 0,
   *       "organizationID": 0,
   *       "name": "",
   *       "brand": "",
   *       "sortIndex": 0
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
   * @apiVersion 2.0.0
   *
   * @apiUse ModelResponse
   */
  app.get({name: 'get model', path: 'model/:modelID'}, auth.verify, model.get)
  /**
   * @api {put} /model Create a model
   * @apiName CreateModel
   * @apiGroup Model
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiDescription A model represents a real-world model like Macbook Pro or
   *   T5i. Each model has a brand associated with it, like Apple or
   *   Canon T5i. A brand can have multiple models.
   *
   * @apiParam {String{0...255}} name Name of model
   * @apiParam {Number} brandID ID of a brand
   *
   * @apiUse ModelResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create model', path: 'model'}, auth.verify, checkSubscription, model.create)
  /**
   * @api {put} /model/:modelID Update a model
   * @apiName UpdateModel
   * @apiGroup Model
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiParam {String{0...255}} [name] Name of model
   * @apiParam {Number} [brandID] ID of a brand
   *
   * @apiUse ModelResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update model', path: 'model/:modelID'}, auth.verify, checkSubscription, model.update)
  /**
   * @api {delete} /model/:modelID Delete a model
   * @apiName DeleteModel
   * @apiGroup Model
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete model', path: 'model/:modelID'}, auth.verify, checkSubscription, model.delete)
  /**
   * @api {get} /model/:modelID/kits Get model kits
   * @apiName GetModelKits
   * @apiGroup Model
   * @apiPermission User
   * @apiVersion 2.0.0
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
  app.get({name: 'get model kits', path: 'model/:modelID/kits'}, auth.verify, model.getKits)
}
