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
module.exports = new Bunyan({
  name: config.name,
  streams: streams,
  serializers: restify.bunyan.serializers
})
