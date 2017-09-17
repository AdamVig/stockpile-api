const cors = module.exports

const prepareResponse = cors.prepareResponse = (req, res) => {
  // Exception for iOS requests
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080')

  // Allow all headers specified in the preflight request
  res.header('Access-Control-Allow-Headers', req.header('Access-Control-Request-Headers') || '')
}

cors.handle = function cors (req, res, next) {
  prepareResponse(req, res)
  return next()
}
