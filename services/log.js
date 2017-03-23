const Bunyan = require('bunyan')
const bunyanFormat = require('bunyan-format')
const restify = require('restify')

const config = require('../package')

const streams = [
  {
    path: `${config.name}.log`,
    level: 'trace'
  },
  {
    level: 'trace',
    stream: bunyanFormat({outputMode: 'long'}, process.stdout)
  }
]

// Create a Bunyan logger.
const log = module.exports = new Bunyan({
  name: config.name,
  streams,
  serializers: restify.bunyan.serializers
})

module.exports.onRequest = (req, res, next) => {
  req.log.info({req}, 'start')
  return next()
}

module.exports.onAppStart = (app) => {
  log.info('%s listening at %s', app.name, app.url)
}
