const bcrypt = require('bcrypt')
const restify = require('restify')

const auth = require('./auth')
const db = require('../services/db')
const endpoint = require('../services/endpoint')

const user = module.exports

// Select all fields from the user table except password
user.removePasswordAddRole = (req, queryBuilder) => {
  return queryBuilder
    .join('role', 'user.roleID', 'role.roleID')
    .select('userID', 'email', 'firstName', 'lastName', 'organizationID',
            'role.name as role')
}

user.getAll = endpoint.getAll('user', {modify: user.removePasswordAddRole})
user.get = endpoint.get('userInfo', 'userID')
user.update = endpoint.update('userInfo', 'userID')
user.delete = endpoint.delete('userInfo', 'userID')

// Change a user's password
user.changeUserPassword = function changeUserPassword (req, res, next) {
  return db.get('user', 'userID', req.params.userID, req.user.organizationID)
    .then(({password}) => {
      return bcrypt.compare(req.body.currentPassword, password)
    })
    .then(matches => {
      if (matches) {
        return bcrypt.hash(req.body.newPassword, auth.saltRounds)
      } else {
        throw new restify.BadRequestError('passwords do not match')
      }
    })
    .then(hashedPassword => {
      return db.update('user', 'userID', req.params.userID,
                       {password: hashedPassword}, req.user.organizationID)
    })
    .then((result) => {
      return res.send({
        message: 'password changed'
      })
    })
    .catch(next)
}

user.mount = app => {
  /**
   * @apiDefine UserResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "userID": 0,
   *   "firstName": "",
   *   "lastName": "",
   *   "email": "",
   *   "organizationID": 0
   * }
   */

  /**
   * @api {get} /user Get all users
   * @apiName GetUsers
   * @apiGroup User
   * @apiPermission Administrator
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "userID": 0,
   *       "firstName": "",
   *       "lastName": "",
   *       "email": "",
   *       "organizationID": 0,
   *       "role": "Member"
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all users', path: 'user'},
          auth.verify, auth.checkAdmin, user.getAll)
  /**
   * @api {get} /user/:userID Get a user
   * @apiName GetUser
   * @apiGroup User
   * @apiPermission User
   *
   * @apiUse UserResponse
   */
  app.get({name: 'get user', path: 'user/:userID'},
          auth.verify, auth.checkUserMatches, user.get)
  /**
   * @api {put} /user/:userID Update a user
   * @apiName UpdateUser
   * @apiGroup User
   * @apiPermission User
   *
   * @apiParam {String{0...255}} [firstName] First name
   * @apiParam {String{0...255}} [lastName] Last name
   * @apiParam {String{0...255}} [email] Email address
   *
   * @apiUse UserResponse
   */
  app.put({name: 'update user', path: 'user/:userID'},
          auth.verify, auth.checkUserMatches, user.update)
  /**
   * @api {delete} /user/:userID Delete a user
   * @apiName DeleteUser
   * @apiGroup User
   * @apiPermission User
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete user', path: 'user/:userID'},
          auth.verify, auth.checkUserMatches, user.delete)
  /**
   * @api {put} /user/:userID/password Change a user's password
   * @apiName ChangeUserPassword
   * @apiGroup User
   * @apiPermission User
   *
   * @apiParam {String} currentPassword Current password
   * @apiParam {String} newPassword New password
   *
   * @apiSuccess (200) {String} message Descriptive message
   */
  app.put({name: 'change user password', path: 'user/:userID/password'},
          auth.verify, auth.checkUserMatches, user.changeUserPassword)
}
