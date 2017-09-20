/**
 * Log service
 *
 * @module services/log
 */

const Bunyan = require('bunyan')
const bunyanFormat = require('bunyan-format')
const restify = require('restify')

const config = require('../package')

// Determine log level from node environment setting
let level = 'info'
if (process.env.NODE_ENV === 'development') {
  level = 'debug'
}

const streams = [
  {
    level,
    path: `logs/${config.name}.log`,
    type: 'rotating-file',
    // Make a new file every five days
    period: '5d',
    // Keep the three previous log files
    count: 3
  },
  {
    level,
    stream: bunyanFormat({outputMode: 'long'}, process.stdout)
  }
]

// Create a Bunyan logger.
const log = new Bunyan({
  name: config.name,
  streams,
  serializers: restify.bunyan.serializers
})

/** Bunyan instance */
module.exports = log

/**
 * Log a request
 * @param {object} req Request
 * @param {object} res Response
 * @param {function} next Next handler
 * @return {any} Result of next handler
 */
module.exports.onRequest = function onRequest (req, res, next) {
  req.log.info({req}, 'request')
  if (req.body) {
    // Hide password from logs
    if (req.body.password) {
      req.body.password = '[redacted]'
    }

    req.log.debug({body: req.body}, 'request body')
  } else if (req.params) {
    req.log.debug({params: req.params}, 'request parameters')
  }
  return next()
}

/**
 * Log an error
 * @param {object} req Request
 * @param {object} res Response
 * @param {object} err The error passed to `next()`
 * @param {function} callback Next handler
 * @return {any} Result of next handler
 */
module.exports.onError = (req, res, err, callback) => {
  req.log.error(err)
  return callback()
}

/**
 * Log a response
 * @param {object} req Request
 * @param {object} res Response
 * @param {object} route The route that serviced the request
 * @param {object} err The error passed to `next()`, if there is one
 */
module.exports.onResponse = (req, res, route, err) => {
  // Only log response if not an error
  if (!err) {
    req.log.info({res}, 'response')
  }
}

/**
 * Log information about application
 * @param {object} app Restify application
 */
module.exports.onAppStart = (app) => {
  log.info('%s listening at %s', app.name, app.url)
}
