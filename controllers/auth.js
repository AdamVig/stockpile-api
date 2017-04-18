const bcrypt = require('bcrypt')
const jwt = require('jwt-simple')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const restify = require('restify')

const db = require('../services/db')

const jwtStrategyOptions = {
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
  secretOrKey: process.env.JWT_SECRET
}

// Create a token
const makeToken = module.exports.makeToken = (payload) => {
  return jwt.encode(payload, process.env.JWT_SECRET)
}

const auth = module.exports

auth.saltRounds = 10

auth.mount = app => {
  /**
   * @api {post} /auth Authenticate a user
   * @apiName Authenticate
   * @apiGroup Authentication
   *
   * @apiParam {String} email User's email
   * @apiParam {String} password User's password
   *
   * @apiSuccess (200) {Number} id ID of user
   * @apiSuccess (200) {String} token Authorization token for use in requests
   * @apiSuccess (200) {String} message Descriptive message
   */
  app.post({name: 'authenticate', path: 'auth'}, auth.authenticate)
  /**
   * @api {post} /auth/register Register a user
   * @apiName Register
   * @apiGroup Authentication
   *
   * @apiParam {String} email User's email
   * @apiParam {String} password User's password
   * @apiParam {String} name User's name
   * @apiParam {Number} roleID=2 Role, defaults to "Member"
   *
   * @apiSuccess (201) {Number} id ID of user
   * @apiSuccess (201) {String} message Descriptive message
   */
  app.post({name: 'register', path: 'auth/register'}, auth.register)
  /**
   * @api {head} /auth/verify Verify authentication
   * @apiName Verify
   * @apiGroup Authentication
   *
   * @apiParam {String} email User's email
   * @apiParam {String} password User's password
   *
   * @apiSuccess (200) empty No response body
   */
  app.head({name: 'verify', path: 'auth/verify'},
           auth.verify, auth.checkUserExists)
}

// Check user credentials and return token if valid
auth.authenticate = (req, res, next) => {
  if (req.body.email && req.body.password) {
    return db.get('user', 'email', req.body.email)
      .then(user => {
        const {password} = user
        return Promise.all([
          user,
          bcrypt.compare(req.body.password, password)
        ])
      })
      .then(([user, valid]) => {
        if (valid === true) {
          const token = makeToken({
            userID: user.userID,
            organizationID: user.organizationID,
            roleID: user.roleID
          })
          res.send({
            id: user.userID,
            token,
            message: 'credentials are valid'
          })
        } else {
          return next(new restify.UnauthorizedError(
            'email and password combination is invalid'))
        }
      })
      .catch(() => {
        return next(new restify.UnauthorizedError(
          'Email and password combination is incorrect'))
      })
  } else {
    return next(new restify.BadRequestError('missing required fields'))
  }
}

// Initialize Passport middleware
module.exports.initialize = passport.initialize()

// Register a user
auth.register = (req, res, next) => {
  const required = [
    'firstName', 'lastName', 'email', 'password', 'organizationID'
  ]
  const bodyKeys = Object.keys(req.body)
  // Check request body contains all required keys
  if (required.every(key => bodyKeys.includes(key))) {
    return bcrypt.hash(req.body.password, auth.saltRounds)
      .then(hash => {
        req.body.password = hash
        return db.create('user', req.body)
      })
      .then(([userID]) => {
        return res.send(201, {
          id: userID,
          message: 'registered user'
        })
      })
      .catch(next)
  } else {
    return next(new restify.BadRequestError())
  }
}

// Authenticate a user given a JWT payload
auth.authenticateToken = (payload, done) => {
  return db.get('user', 'userID', payload.userID)
    .then(user => done(null, user))
    .catch(done)
}

passport.use(new passportJWT.Strategy(jwtStrategyOptions, auth.authenticateToken))

// Verify that user is authenticated on a given path
auth.verify = passport.authenticate('jwt', { session: false })

// Check if user is attached to the request object
auth.checkUserExists = function checkUserExists (req, res, next) {
  if (req.user) {
    res.send(200)
  } else {
    return next(new restify.NotFoundError())
  }
}

// Check if user is admin
auth.checkAdmin = function checkAdmin (req, res, next) {
  const adminRoleID = 1
  if (req.user.roleID === adminRoleID) {
    return next()
  } else {
    return next(new restify.ForbiddenError('must be an administrator'))
  }
}

// Check if user ID in token matches user ID in URL parameters
auth.checkUserMatches = function checkUserMatches (req, res, next) {
  if (req.user.userID === Number.parseInt(req.params.userID, 10)) {
    return next()
  } else {
    return next(new restify.ForbiddenError(
      'must be an administrator to access other users\' data'))
  }
}
