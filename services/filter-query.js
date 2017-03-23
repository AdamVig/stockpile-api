/**
 * Filter a database query based on request query parameters
 * @module services/filter-query
 * @param {object} req HTTP request
 * @param {map} paramNames Values `req.params` to filter with
 * @return {object} Query builder with `where` clauses appended to it
 */
module.exports = (req, paramNames = new Map()) => {
  return (queryBuilder) => {
    for (const [name, key] of paramNames) {
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
