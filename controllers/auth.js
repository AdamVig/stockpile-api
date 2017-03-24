const bcrypt = require('bcrypt')
const jwt = require('jwt-simple')
const passport = require('passport')
const passportJWT = require('passport-jwt')
const restify = require('restify')

const db = require('../services/db')

const saltRounds = 10

const jwtStrategyOptions = {
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderWithScheme('Bearer'),
  secretOrKey: process.env.JWT_SECRET
}

// Create a token
const makeToken = module.exports.makeToken = (payload) => {
  return jwt.encode(payload, process.env.JWT_SECRET)
}

const auth = module.exports

auth.mount = app => {
  /**
   * @api {post} /auth Authenticate
   * @apiName Authenticate
   * @apiGroup Authentication
   *
   * @apiParam {String} email Organization's email
   * @apiParam {String} password Organization's password
   *
   * @apiSuccess (200) {Number} id ID of organization
   * @apiSuccess (200) {String} token Authorization token for use in requests
   * @apiSuccess (200) {String} message Descriptive message
   */
  app.post({name: 'authenticate', path: 'auth'}, auth.authenticate)
  /**
   * @api {post} /auth/register Register an organization
   * @apiName Register
   * @apiGroup Authentication
   *
   * @apiParam {String} email Organization's email
   * @apiParam {String} password Organization's password
   * @apiParam {String} name Organization's name
   *
   * @apiSuccess (201) {Number} id ID of organization
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
  app.head({name: 'verify', path: 'auth/verify'}, auth.verify, auth.checkUser)
}

// Check user credentials and return token if valid
auth.authenticate = (req, res, next) => {
  if (req.body.email && req.body.password) {
    return db.get('organization', 'email', req.body.email)
      .then(organization => {
        const {organizationID, password} = organization
        return Promise.all([
          organizationID,
          bcrypt.compare(req.body.password, password)
        ])
      })
      .then(([organizationID, valid]) => {
        if (valid === true) {
          const token = makeToken({sub: organizationID})
          res.send({
            id: organizationID,
            token,
            message: 'organization credentials are valid'
          })
        } else {
          return next(new restify.UnauthorizedError(
            'email and password combination is invalid'))
        }
      })
      .catch(next)
  } else {
    return next(new restify.BadRequestError('missing required fields'))
  }
}

// Initialize Passport middleware
module.exports.initialize = passport.initialize()

// Register an organization
auth.register = (req, res, next) => {
  if (req.body.name && req.body.email && req.body.password) {
    return bcrypt.hash(req.body.password, saltRounds)
      .then(hash => {
        const organizationData = {
          name: req.body.name,
          email: req.body.email,
          password: hash
        }
        return db.create('organization', organizationData)
      })
      .then(id => {
        const organizationID = id[0]
        return res.send(201, {
          id: organizationID,
          message: 'created organization'
        })
      })
      .catch(next)
  } else {
    return next(new restify.BadRequestError())
  }
}

// Authenticate a user given a JWT payload
auth.authenticateToken = (payload, done) => {
  return db.get('organization', 'organizationID', payload.sub)
    .then(user => done(null, user))
    .catch(done)
}

passport.use(new passportJWT.Strategy(jwtStrategyOptions, auth.authenticateToken))

// Verify that user is authenticated on a given path
auth.verify = passport.authenticate('jwt', { session: false })

// Check if user is attached to the request object
auth.checkUser = (req, res, next) => {
  if (req.user) {
    res.send(200)
  } else {
    return next(restify.NotFoundError())
  }
}
