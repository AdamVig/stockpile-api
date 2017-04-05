/**
 * Add `limit` and `offset` to a database query with values from
 * request parameters
 * @param {object} queryBuilder Knex query builder
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 */
module.exports = (queryBuilder, req, res) => {
  if (req && req.params.limit) {
    queryBuilder
      .limit(Number.parseInt(req.params.limit, 10))
  }

  // Using offset alone automatically sets an abitrarily high limit
  if (req && req.params.offset) {
    queryBuilder
      .offset(Number.parseInt(req.params.offset, 10))
  }
}
