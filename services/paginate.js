const db = require('./db')

/**
 * Create links for adding to the `Link` header
 * @param {string} path Path of requested endpoint
 * @param {number} limit Maximum number of rows returned
 * @param {number} [offset=0] How many rows to discard before returning the rest
 * @param {number} [total=0] Total number of rows
 * @return {object} Contains links to first, last, previous (maybe),
 *   next (maybe) pages of results
 */
module.exports.createLinks = (path, limit, offset = 0, total = 0) => {
  const links = {}
  const base = `${path}?limit=${limit}&offset=`

  // Offset of zero for first page
  links.first = `${base}${0}`

  // Add prev link if beyond first page
  if (offset > limit) {
    // Use `max` to prevent offset from going negative
    links.previous = `${base}${Math.max(0, offset - limit)}`
  }

  // Add next link if there is a next page
  if ((offset + limit) <= total) {
    // Use `min` to prevent offset from going above total
    links.next = `${base}${Math.min(total, offset + limit)}`
  }

  // If total % limit !== 0, use remainder as diff
  // If total % limit === 0, last page is same as last "next" link
  // This prevents overlapping items between the two last pages
  const lastPageDiff = (total % limit) || limit
  // Use `max` to prevent from going negative when total is zero
  links.last = `${base}${Math.max(0, total - lastPageDiff)}`

  return links
}

/**
 * Add links to the `Link` header for pagination
 * @param {object} req HTTP request
 * @param {object} res HTTP response
 * @param {string} tableName Name of a database table
 * @return {Promise} Resolved when done adding links
 */
module.exports.addLinks = (req, res, tableName) => {
  return db.countRows(tableName, req.user.organizationID)
    .then(({count}) => {
      // Generate and add links to response headers
      const links = module.exports.createLinks(req.path(), req.params.limit,
                                               req.params.offset, count)
      res.links(links)
    })
}

/**
 * Add `limit` and `offset` to a database query with values from
 * request parameters
 * @param {object} queryBuilder Knex query builder
 * @param {object} req HTTP request
 */
module.exports.paginateQuery = (queryBuilder, req) => {
  if (req && req.params.limit) {
    queryBuilder
      .limit(Number.parseInt(req.params.limit, 10))
  }

  // Using offset without limit automatically sets an abitrarily high limit
  if (req && req.params.offset) {
    queryBuilder
      .offset(Number.parseInt(req.params.offset, 10))
  }
}
