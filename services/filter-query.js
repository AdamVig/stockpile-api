/**
 * Filter a database query based on request query parameters
 * @param {object} req HTTP request
 * @param {object} paramNames={} Values `req.params` to filter with
 * @return {object} Query builder with `where` clauses appended to it
 */
module.exports = (req, paramNames = {}) => {
  return (queryBuilder) => {
    for (const name in paramNames) {
      const key = paramNames[name]

      // Get value from request query parameters
      const value = req.params[name]

      // Add to query if value is defined
      if (value) {
        queryBuilder.where(key, value)
      }
    }
    return queryBuilder
  }
}
