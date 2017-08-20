const restify = require('restify')

const options = module.exports

options.handle = (req, res, next) => {
  // Handle OPTIONS requests
  if (req.method.toLowerCase() === 'options') {
    res.send(204)
    return next()

  // If not OPTIONS request, rethrow error
  } else {
    res.send(new restify.MethodNotAllowedError())
    return next()
  }
}
