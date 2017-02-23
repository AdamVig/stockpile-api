module.exports = () => {
  return function filterRequestBody (req, res, next) {
    if (req && req.body) {
      delete req.body._links
    }
    return next()
  }
}
