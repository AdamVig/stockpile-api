const restify = require('restify')

module.exports = (req, res, next) => {
  // Handle OPTIONS requests
  if (req.method.toLowerCase() === 'options') {
    return res.send(204)

  // If not OPTIONS request, rethrow error
  } else {
    return res.send(new restify.MethodNotAllowedError())
  }
}
