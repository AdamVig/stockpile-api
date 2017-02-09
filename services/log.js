const Bunyan = require('bunyan')
const restify = require('restify')

const config = require('../package')

const streams = [
  {
    path: `${config.name}.log`,
    level: 'trace'
  }
]

if (process.env.NODE_ENV !== 'test') {
  streams.push({
    stream: process.stdout,
    level: 'debug'
  })
}

// Create a Bunyan logger.
const log = module.exports = new Bunyan({
  name: config.name,
  streams: streams,
  serializers: restify.bunyan.serializers
})

module.exports.onRequest = (req, res, next) => {
  req.log.info({req}, 'start')
  return next()
}

module.exports.onAppStart = (app) => {
  log.info('%s listening at %s', app.name, app.url)
}
