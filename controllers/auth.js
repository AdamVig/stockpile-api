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

// Check user credentials and return token if valid
module.exports.authenticate = (req, res, next) => {
  if (req.body.email && req.body.password) {
    return db.get('organization', 'email', req.body.email)
      .then(organization => {
        return Promise.all([
          organization.organization_id,
          bcrypt.compare(req.body.password, organization.password)
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
          throw new restify.UnauthorizedError(
            'email and password combination is not valid')
        }
      })
      .catch(next)
  } else {
    return next(new restify.UnprocessableEntityError('missing required fields'))
  }
}

// Initialize Passport middleware
module.exports.initialize = passport.initialize()

// Register an organization
module.exports.register = (req, res, next) => {
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
        res.send(201, {
          id: organizationID,
          message: 'created organization'
        })
      })
      .catch(next)
  } else {
    return next(new restify.UnprocessableEntityError())
  }
}

// Authenticate a user given a JWT payload
const authenticateToken = module.exports.authenticateToken = (payload, done) => {
  return db.get('organization', 'organizationID', payload.sub)
    .then((user) => {
      if (user) {
        done(null, user)
      } else {
        done(null, false)
      }
    })
    .catch(done)
}

passport.use(new passportJWT.Strategy(jwtStrategyOptions, authenticateToken))

// Verify that user is authenticated on a given path
module.exports.verify = passport.authenticate('jwt', { session: false })

// Check if user is attached to the request object
module.exports.checkUser = (req, res, next) => {
  if (req.user) {
    res.send(200)
  } else {
    return next(restify.NotFoundError())
  }
}
