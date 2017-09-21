const restify = require('restify')

const cors = require('./cors')

const options = module.exports

options.handle = (req, res, err, callback) => {
  // Handle OPTIONS requests
  if (req.method.toLowerCase() === 'options') {
    cors.prepareResponse(req, res)
    res.send(204)
    return callback()

  // If not OPTIONS request, rethrow error
  } else {
    res.send(new restify.MethodNotAllowedError())
    return callback()
  }
}
