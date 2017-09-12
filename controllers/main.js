const endpoint = require('../services/endpoint')

const main = module.exports

main.mount = app => {
  /**
   * @api {get} / Get main
   * @apiName GetMain
   * @apiGroup Main
   * @apiPermission Public
   * @apiVersion 2.0.0
   *
   * @apiDescription This is the entry point for the API. Using HAL relations,
   * the client can navigate the whole API based on the response from this
   * endpoint.
   *
   * @apiSuccess (200) empty No response body
   */
  app.get({name: 'main', path: '/'}, main.get)
}

main.get = endpoint.default()
