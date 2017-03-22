const auth = require('./auth')
const endpoint = require('../services/endpoint')

const user = module.exports

user.getAll = endpoint.default()
user.get = endpoint.default()
user.create = endpoint.default()
user.update = endpoint.default()
user.delete = endpoint.default()

user.mount = app => {
  /**
   * @api {get} /user Get all users
   * @apiName GetUsers
   * @apiGroup User
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.get({name: 'get all users', path: 'user'}, auth.verify, user.getAll)
  /**
   * @api {get} /user/:userID Get a user
   * @apiName GetUser
   * @apiGroup User
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.get({name: 'get user', path: 'user/:userID'}, auth.verify, user.get)
  /**
   * @api {put} /user Create a user
   * @apiName CreateUser
   * @apiGroup User
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.put({name: 'create user', path: 'user'}, auth.verify, user.create)
  /**
   * @api {put} /user/:userID Update a user
   * @apiName UpdateUser
   * @apiGroup User
   *
   */
  app.put({name: 'update user', path: 'user/:userID'}, auth.verify, user.update)
  /**
   * @api {delete} /user/:userID Delete a user
   * @apiName DeleteUser
   * @apiGroup User
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.del({name: 'delete user', path: 'user/userID'}, auth.verify, user.delete)
}
