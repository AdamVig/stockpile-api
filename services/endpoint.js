/**
 * Generalized endpoint functions
 *
 * These functions cover the most common use cases for most controllers.
 */

const db = require('../services/db')

const endpoint = module.exports = {}

/**
 * Get all rows from a table and return them in an object, assigned to a
 * property with the same name as the table
 * @param {string} tableName Name of a database table
 * @param {function} modify Modify the query
 * @return {function} Endpoint handler
 */
endpoint.getAll = (tableName, modify) => {
  return (req, res, next) => {
    return db.getAll(tableName, req.user.organizationID, modify)
      .then(rows => res.send({results: rows}))
      .catch(next)
  }
}

/**
 * Get a row from a table, identified by a column and value from the request
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {function} modify Modify the query
 * @return {function} Endpoint handler
 */
endpoint.get = (tableName, columnName, modify) => {
  return (req, res, next) => {
    return db.get(tableName, columnName, req.params[columnName],
                  req.user.organizationID, modify)
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
endpoint.create = (tableName, message) => {
  return (req, res, next) => {
    // Add organization ID if it is missing
    if (!req.body.organizationID) {
      req.body.organizationID = req.user.organizationID
    }

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
 * @return {function} Endpoint handler
 */
endpoint.update = (tableName, columnName) => {
  return (req, res, next) => {
    return db.update(tableName, columnName, req.body[columnName], req.body,
                     req.user.organizationID)
      .then(updatedRow => { return res.send(updatedRow) })
      .catch(next)
  }
}

/**
 * Delete a row in a table, returning a descriptive message
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {string} message Message describing what the endpoint did
 * @return {function} Endpoint handler
 */
endpoint.delete = (tableName, columnName, message) => {
  return (req, res, next) => {
    return db.delete(tableName, columnName, req.params[columnName],
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

/**
 * Default endpoint handler for new endpoints
 * @return {function} Endpoint handler
 */
endpoint.default = () => {
  return (req, res, next) => {
    res.send({})
  }
}

/**
 *
 * @param {object} controller A module to define methods on
 * @param {string} table Name of a database table, assumed to also be
 *   name of entity
 * @param {string} key Name of a column in a table
 */
endpoint.addAllMethods = (controller, table, key) => {
  controller.getAll = endpoint.getAll(table)
  controller.get = endpoint.get(table, key)
  controller.create = endpoint.create(table, `${table} created`)
  controller.update = endpoint.update(table, key)
  controller.delete = endpoint.delete(table, key, `${table} deleted`)
}
