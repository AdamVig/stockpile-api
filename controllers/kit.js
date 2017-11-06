const restify = require('restify')

const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const endpoint = require('../services/endpoint')

const kit = module.exports

kit.withModelDetails = (req, queryBuilder) => {
  return queryBuilder
    .where('kitID', req.params.kitID)
    .select('kitID', 'quantity')

  // Add models
    .join('model', 'kitModel.modelID', 'model.modelID')
    .select('model.modelID', 'model.name as model')

  // Add brands
    .join('brand', 'model.brandID', 'brand.brandID')
    .select('brand.brandID', 'brand.name as brand')
}

kit.withKitID = (req, queryBuilder) => {
  return queryBuilder
    .where('kitID', req.params.kitID)
}

endpoint.addAllMethods(kit, 'kit', 'kitID')
kit.getAll = endpoint.getAll('kit', {
  sortBy: [{column: 'kit.name', ascending: true}],
  searchColumns: ['kit.name']
})

kit.getAllKitModels = endpoint.getAll('kitModel', {
  modify: kit.withModelDetails,
  hasOrganizationID: false,
  sortBy: [
    {column: 'brand', ascending: true},
    {column: 'model', ascending: true}
  ]
})

kit.createKitModel = (req, res, next) => {
  if (req.body.modelID) {
    req.body.kitID = req.params.kitID
    return endpoint.create('kitModel',
      null,
      {hasOrganizationID: false, resModify: kit.withModelDetails})(req, res, next)
  } else {
    return next(new restify.BadRequestError('missing modelID in body'))
  }
}

kit.updateKitModel = endpoint.update(
  'kitModel', 'modelID',
  {hasOrganizationID: false, modify: kit.withKitID, resModify: kit.withModelDetails})

kit.deleteKitModel = endpoint.delete(
  'kitModel', 'modelID', {hasOrganizationID: false, modify: kit.withKitID})

kit.mount = app => {
  /**
   * @apiDefine KitResponse
   *
   * @apiExample {json} Response Format
   * {
   *  "kitID": 0,
   *  "name": "",
   *  "organizationID": 0
   * }
   */

  /**
   * @apiDefine KitModelResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "kitID": 0,
   *   "modelID": 0,
   *   "quantity": 0,
   *   "model": "",
   *   "brandID": 0,
   *   "brand": ""
   * }
   */

  /**
   * @api {get} /kit Get all kits
   * @apiName GetAllKits
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse Search
   *
   * @apiExample {json} Response Format
   * {
   *  "results": [
   *    {
   *      "kitID": 0,
   *      "name": "",
   *      "organizationID": 0,
   *      "sortIndex": 0
   *    }
   *  ]
   * }
   */
  app.get({name: 'get all kits', path: 'kit'}, auth.verify, kit.getAll)
  /**
   * @api {get} /kit/:kitID Get kit
   * @apiName GetKit
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse KitResponse
   */
  app.get({name: 'get kit', path: 'kit/:kitID'}, auth.verify, kit.get)
  /**
   * @api {put} /kit Create kit
   * @apiName CreateKit
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription Kits are collections of models that a user would like to
   *   rent together. Kits consist of models, not items, to retain flexibility
   *   in the physical inventory (for example, if kits consisted of items and
   *   one item in a kit was rented, the whole kit would be impossible to rent).
   *   When renting an item, the user could be prompted with a list of kits that
   *   the item belongs to by using the item's modelID and
   *   `GET /model/:modelID/kits`.
   *
   * @apiParam {String{0..255}} name Name of kit
   *
   * @apiUse KitResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create kit', path: 'kit'}, auth.verify, checkSubscription, kit.create)
  /**
   * @api {put} /kit/:kitID Update kit
   * @apiName UpdateKit
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiParam {String{0..255}} [name] Name of kit
   *
   * @apiUse KitResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update kit', path: 'kit/:kitID'}, auth.verify, checkSubscription, kit.update)
  /**
   * @api {delete} /kit/:kitID Delete a kit
   * @apiName DeleteKit
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete kit', path: 'kit/:kitID'}, auth.verify, checkSubscription, kit.delete)
  /**
   * @api {get} /kit/:kitID/model Get all kit models
   * @apiName GetAllKitModels
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiExample {json} Response Format
   * {
   *  "results": [
   *    {
   *      "kitID": 0,
   *      "modelID": 0,
   *      "model": "",
   *      "brandID": 0,
   *      "brand": "",
   *      "quantity": 0,
   *      "sortIndex": 0
   *    }
   *  ]
   * }
   */
  app.get({name: 'get all kit models', path: 'kit/:kitID/model'}, auth.verify, kit.getAllKitModels)
  /**
   * @api {put} /kit/:kitID/model Create kit model
   * @apiName CreateKitModel
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiParam {Number} modelID ID of model
   * @apiParam {Number} [quantity=1] How many of the model belong in the kit
   *
   * @apiUse KitModelResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'create kit model', path: 'kit/:kitID/model'}, auth.verify, checkSubscription, kit.createKitModel)
  /**
   * @api {put} /kit/:kitID/model/:modelID Update kit model
   * @apiName UpdateKitModel
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiParam {Number} quantity How many of the model belong in the kit
   *
   * @apiUse KitModelResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update kit model', path: 'kit/:kitID/model/:modelID'}, auth.verify, checkSubscription,
    kit.updateKitModel)
  /**
   * @api {delete} /kit/:kitID/model/:modelID Delete a kit model
   * @apiName DeleteKitModel
   * @apiGroup Kit
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete kit model', path: 'kit/:kitID/model/:modelID'}, auth.verify, checkSubscription,
    kit.deleteKitModel)
}
