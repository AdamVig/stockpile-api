/**
 * Generalized endpoint functions
 *
 * These functions cover the most common use cases for most controllers.
 */

const db = require('../services/db')

/**
 * Make a response object
 * @param {string} prop Property name
 * @param {any} data Arbitrary data
 * @return {object} Response object with data assigned to prop
 */
const makeResponse = (prop, data) => {
  const response = {}
  response[prop] = data
  return response
}

/**
 * Get all rows from a table and return them in an object, assigned to a
 * property with the same name as the table
 * @param {string} tableName Name of a database table
 * @return {function} Endpoint handler
 */
module.exports.getAll = (tableName) => {
  return (req, res, next) => {
    return db.getAll(tableName, req.user.organizationID)
      .then(rows => res.send(makeResponse(tableName, rows)))
      .catch(next)
  }
}

/**
 * Get a row from a table, identified by a column and value from the request
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {string} [paramName] Name of request parameter containing value to
 *   look for in column, if different from columnName
 * @return {function} Endpoint handler
 */
module.exports.get = (tableName, columnName, paramName) => {
  return (req, res, next) => {
    return db.get(tableName, columnName, req.params[paramName || columnName],
                  req.user.organizationID)
      .then(row => res.send(row))
      .catch(next)
  }
}

/**
 * Create a row in a table, returning a descriptive message
 * @param {string} tableName Name of a database table
 * @param {string} message Message describing what the endpoint did
 * @return {function} Endpoint handler
 */
module.exports.create = (tableName, message) => {
  return (req, res, next) => {
    return db.create(tableName, req.body)
      .then(([id]) => res.send({
        id,
        message
      }))
      .catch(next)
  }
}

/**
 * Update a row in a table, returning the updated row
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {string} [paramName] Name of request parameter containing value to
 *   look for in column, if different from columnName
 * @return {function} Endpoint handler
 */
module.exports.update = (tableName, columnName, paramName) => {
  return (req, res, next) => {
    return db.update(tableName, paramName || columnName,
                     req.body[paramName || columnName],
                     req.body, req.user.organizationID)
      .then(updatedRow => { return res.send(updatedRow) })
      .catch(next)
  }
}

/**
 * Delete a row in a table, returning a descriptive message
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {string} message Message describing what the endpoint did
 * @param {string} [paramName] Name of request parameter containing value to
 *   look for in column, if different from columnName
 * @return {function} Endpoint handler
 */
module.exports.delete = (tableName, columnName, message, paramName) => {
  return (req, res, next) => {
    return db.delete(tableName, paramName || columnName,
                     req.params[paramName || columnName],
                     req.user.organizationID)
      .then((rowsAffected) => {
        if (rowsAffected > 0) {
          res.send({message})
        } else {
          res.send(204)
        }
      })
      .catch(next)
  }
}
