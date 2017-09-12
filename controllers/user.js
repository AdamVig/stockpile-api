const bcrypt = require('bcrypt')
const restify = require('restify')

const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const db = require('../services/db')
const endpoint = require('../services/endpoint')
const paginate = require('../services/paginate')

const messages = {
  missing: 'User does not exist'
}

const user = module.exports

// Select all fields from the user table except password
user.removePasswordAddRole = (req, queryBuilder) => {
  return queryBuilder
    .join('role', 'user.roleID', 'role.roleID')
    .select('userID', 'email', 'firstName', 'lastName', 'organizationID',
    'role.name as role')
    .modify(paginate.paginateQuery, req, 'user')
}

user.getAll = endpoint.getAll('user', {modify: user.removePasswordAddRole})
user.get = endpoint.get('userInfo', 'userID', {messages})
user.delete = endpoint.delete('userInfo', 'userID')
user.update = endpoint.update('user', 'userID',
                              {resModify: user.removePasswordAddRole})

// Change a user's password
user.changeUserPassword = function changeUserPassword (req, res, next) {
  return db.get('user', 'userID', req.params.userID, req.user.organizationID)
    .then(({password}) => {
      return bcrypt.compare(req.body.currentPassword, password)
    })
    .then(matches => {
      if (matches) {
        return auth.hashPassword(req.body.newPassword)
      } else {
        throw new restify.BadRequestError('Wrong password')
      }
    })
    .then(hashedPassword => {
      return db.update('user', 'userID', req.params.userID,
                       {password: hashedPassword}, req.user.organizationID)
    })
    .then((result) => {
      res.send({
        message: 'Password successfully changed'
      })
      return next()
    })
    .catch(next)
}

// Get rentals for only the current user
user.rentalsForUser = (req, queryBuilder) => {
  return queryBuilder
    .where('userID', req.user.userID)
}

user.getRentals = endpoint.getAll('rental', {modify: user.rentalsForUser})

user.mount = app => {
  /**
   * @apiDefine Pagination
   *
   * @apiParam (Pagination) {Number{0..}} [limit] Max rows in response
   * @apiParam (Pagination) {Number{0..}} [offset] Rows to offset response by
   */

  /**
   * @apiDefine UserResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "userID": 0,
   *   "firstName": "",
   *   "lastName": "",
   *   "email": "",
   *   "organizationID": 0,
   *   "archived": null
   * }
   */

  /**
   * @api {get} /user Get all users
   * @apiName GetUsers
   * @apiGroup User
   * @apiPermission Administrator
   * @apiVersion 2.0.0
   *
   * @apiUse Pagination
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
   *       "role": "Member",
   *       "archived": null
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all users', path: 'user'}, auth.verify, auth.checkAdmin, user.getAll)
  /**
   * @api {get} /user/:userID Get a user
   * @apiName GetUser
   * @apiGroup User
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiUse UserResponse
   */
  app.get({name: 'get user', path: 'user/:userID'}, auth.verify, auth.checkUserMatches, user.get)
  /**
   * @api {put} /user/:userID Update a user
   * @apiName UpdateUser
   * @apiGroup User
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiParam {String{0...255}} [firstName] First name
   * @apiParam {String{0...255}} [lastName] Last name
   * @apiParam {String{0...255}} [email] Email address
   * @apiParam {String} [archived] Date user was archived (YYYY-MM-DD)
   *
   * @apiUse UserResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update user', path: 'user/:userID'}, auth.verify, auth.checkUserMatches, checkSubscription,
    user.update)
  /**
   * @api {delete} /user/:userID Delete a user
   * @apiName DeleteUser
   * @apiGroup User
   * @apiPermission Admin
   * @apiVersion 2.0.0
   *
   * @apiDescription Only administrators can actually delete users. In general,
   *   users should not be deleted, but archived. To archive a user, set the
   *   `Archived` property to a date. This will automatically set the `email`
   *   and `password` fields of the user to `NULL`.
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete user', path: 'user/:userID'}, auth.verify, auth.checkAdmin, checkSubscription, user.delete)
  /**
   * @api {put} /user/:userID/password Change a user's password
   * @apiName ChangeUserPassword
   * @apiGroup User
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiParam {String} currentPassword Current password
   * @apiParam {String} newPassword New password
   *
   * @apiSuccess (200) {String} message Descriptive message
   */
  app.put({name: 'change user password', path: 'user/:userID/password'}, auth.verify, auth.checkUserMatches,
    user.changeUserPassword)
  /**
   * @api {get} /user/:userID/rentals Get all rentals made by a user
   * @apiName GetUserRentals
   * @apiGroup User
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     "endDate": "2017-02-23T05:00:00.000Z",
   *     "itemID": 0,
   *     "organizationID": 0,
   *     "rentalID": 0,
   *     "returnDate": null,
   *     "startDate": "2017-02-22T05:00:00.000Z",
   *     "userID": 0,
   *     "notes": "",
   *     "externalRenterID": 0
   *   ]
   * }
   */
  app.get({name: 'get user rentals', path: 'user/:userID/rentals'}, auth.verify, user.getRentals)
}
