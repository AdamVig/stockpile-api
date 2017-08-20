/**
 * Log service
 *
 * @module services/log
 */

const Bunyan = require('bunyan')
const bunyanFormat = require('bunyan-format')
const restify = require('restify')

const config = require('../package')

const streams = [
  {
    level: 'debug',
    path: `logs/${config.name}.log`,
    type: 'rotating-file',
    // Make a new file every five days
    period: '5d',
    // Keep the three previous log files
    count: 3
  },
  {
    level: 'debug',
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
module.exports.onRequest = (req, res, next) => {
  req.log.info({req}, 'start')
  return next()
}

/**
 * Log information about application
 * @param {object} app Restify application
 */
module.exports.onAppStart = (app) => {
  log.info('%s listening at %s', app.name, app.url)
}
