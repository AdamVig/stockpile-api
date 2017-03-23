/**
 * Filters the body of an incoming request
 * @module services/filter-request-body
 * @return {filterRequestBody} Filters the body of an incoming request
 */
module.exports = () => {
  /**
   * Filter the body of an incoming request
   * @callback filterRequestBody
   * @param {object} req Request
   * @param {object} res Response
   * @param {function} next Next handler
   * @return {any} Result of next handler
   */
  return function filterRequestBody (req, res, next) {
    if (req && req.body) {
      delete req.body._links
    }
    return next()
  }
}
