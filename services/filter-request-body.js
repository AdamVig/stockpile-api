module.exports = () => {
  return (req, res, next) => {
    if (req && req.body) {
      delete req.body._links
    }
    return next()
  }
}
