const Bunyan = require('bunyan')
const restify = require('restify')

const config = require('../package')

const streams = [
  {
    path: `${config.name}.log`,
    level: 'trace'
  }
]

// Create a Bunyan logger.
module.exports = new Bunyan({
  name: config.name,
  streams: streams,
  serializers: restify.bunyan.serializers
})
