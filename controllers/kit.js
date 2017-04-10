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

endpoint.addAllMethods(kit, 'kit', 'kitID')

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
}
