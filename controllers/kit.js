const restify = require('restify')

const auth = require('./auth')
const endpoint = require('../services/endpoint')

const kit = module.exports

kit.withModels = (req, queryBuilder) => {
  return queryBuilder
    .join('kitModels', 'kit.kitID', 'kitModels.kitID')

    .join('model', 'model.modelID', 'kitModels.modelID')
    .select('model.modelID', 'model.name as model')

    .join('brand', 'brand.brandID', 'model.brandID')
    .select('brand.brandID', 'brand.name as brand')
}

kit.withModelDetails = (req, queryBuilder) => {
  return queryBuilder
    .where('kitID', req.params.kitID)
    .select('kitID')

  // Add models
    .join('model', 'kitModels.modelID', 'model.modelID')
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

kit.getAllKitModels = endpoint.getAll('kitModels', {
  modify: kit.withModelDetails,
  hasOrganizationID: false
})
kit.createKitModel = (req, res, next) => {
  if (req.body.modelID) {
    req.body.kitID = req.params.kitID
    return endpoint.create('kitModels',
                           {hasOrganizationID: false})(req, res, next)
  } else {
    return next(new restify.BadRequestError('missing modelID in body'))
  }
}
kit.deleteKitModel = endpoint.delete('kitModels', 'modelID',
                                     {modify: kit.withKitID})

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
   * @api {get} /kit Get all kits
   * @apiName GetAllKits
   * @apiGroup Kit
   * @apiPermission User
   *
   * @apiExample {json} Response Format
   * {
   *  "results": [
   *    {
   *      "kitID": 0,
   *      "name": "",
   *      "organizationID": 0
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
   *
   * @apiUse KitResponse
   */
  app.get({name: 'get kit', path: 'kit/:kitID'}, auth.verify, kit.get)
  /**
   * @api {put} /kit Create kit
   * @apiName CreateKit
   * @apiGroup Kit
   * @apiPermission User
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
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created kit
   */
  app.put({name: 'create kit', path: 'kit'}, auth.verify, kit.create)
  /**
   * @api {put} /kit/:kitID Update kit
   * @apiName UpdateKit
   * @apiGroup Kit
   * @apiPermission User
   *
   * @apiParam {String{0..255}} [name] Name of kit
   *
   * @apiUse KitResponse
   */
  app.put({name: 'update kit', path: 'kit/:kitID'}, auth.verify, kit.update)
  /**
   * @api {delete} /kit/:kitID Delete a kit
   * @apiName DeleteKit
   * @apiGroup Kit
   * @apiPermission User
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete kit', path: 'kit/:kitID'}, auth.verify, kit.delete)
  /**
   * @api {get} /kit/:kitID/model Get all kit models
   * @apiName GetAllKitModels
   * @apiGroup Kit
   * @apiPermission User
   *
   * @apiExample {json} Response Format
   * {
   *  "results": [
   *    {
   *      "kitID": 0,
   *      "modelID": 0,
   *      "model": "",
   *      "brandID": 0,
   *      "brand": ""
   *    }
   *  ]
   * }
   */
  app.get({name: 'get all kit models', path: 'kit/:kitID/model'},
          auth.verify, kit.getAllKitModels)
   /**
   * @api {put} /kit/:kitID/model Create kit model
   * @apiName CreateKitModel
   * @apiGroup Kit
   * @apiPermission User
   *
   * @apiParam {Number} modelID ID of model
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id Always zero (composite key in the table)
   */
  app.put({name: 'create kit model', path: 'kit/:kitID/model'},
          auth.verify, kit.createKitModel)
  /**
   * @api {delete} /kit/:kitID/model/:modelID Delete a kit model
   * @apiName DeleteKitModel
   * @apiGroup Kit
   * @apiPermission User
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete kit model', path: 'kit/:kitID/model/:modelID'},
          auth.verify, kit.deleteKitModel)
}
