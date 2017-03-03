/**
 * Generalized endpoint functions
 *
 * These functions cover the most common use cases for most controllers.
 */

const restify = require('restify')

const db = require('../services/db')

const endpoint = module.exports = {}

/**
 * Get all rows from a table and return them in an object, assigned to a
 * property with the same name as the table
 * @param {string} tableName Name of a database table
 * @param {function} [modify] Modify the query
 * @param {object} [messages] Custom messages for endpoint actions and errors
 * @return {function} Endpoint handler
 */
endpoint.getAll = (tableName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.getAll(tableName, req.user.organizationID,
                     endpoint.bindModify(modify, req))
      .then(results => res.send({results}))
      .catch(err => endpoint.handleError(err, messages, next))
  }
}

/**
 * Get a row from a table, identified by a column and value from the request
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {function} [modify] Modify the query
 * @param {object} [messages] Custom messages for endpoint actions and errors
 * @return {function} Endpoint handler
 */
endpoint.get = (tableName, columnName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.get(tableName, columnName, req.params[columnName],
                  req.user.organizationID, endpoint.bindModify(modify, req))
      .then(row => res.send(row))
      .catch(err => endpoint.handleError(err, messages, next))
  }
}

/**
 * Create a row in a table, returning a descriptive message
 * @param {string} tableName Name of a database table
 * @param {function} [modify] Modify the query
 * @param {object} [messages] Custom messages for endpoint actions and errors
 * @return {function} Endpoint handler
 */
endpoint.create = (tableName, {modify, messages} = {}) => {
  return (req, res, next) => {
    // Add organization ID if it is missing
    if (!req.body.organizationID) {
      req.body.organizationID = req.user.organizationID
    }

    return db.create(tableName, req.body, endpoint.bindModify(modify, req))
      .then(([id]) => res.send({
        id,
        message: endpoint.chooseMessage('create', messages)
      }))
      .catch(err => endpoint.handleError(err, messages, next))
  }
}

/**
 * Update a row in a table, returning the updated row
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {function} [modify] Modify the query
 * @param {object} [messages] Custom messages for endpoint actions and errors
 * @return {function} Endpoint handler
 */
endpoint.update = (tableName, columnName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.update(tableName, columnName, req.body[columnName], req.body,
                     req.user.organizationID, endpoint.bindModify(modify, req))
      .then(updatedRow => { return res.send(updatedRow) })
      .catch(err => endpoint.handleError(err, messages, next))
  }
}

/**
 * Delete a row in a table, returning a descriptive message
 * @param {string} tableName Name of a database table
 * @param {string} columnName Name of a column in the table
 * @param {function} [modify] Modify the query
 * @param {object} [messages] Custom messages for endpoint actions and errors
 * @return {function} Endpoint handler
 */
endpoint.delete = (tableName, columnName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.delete(tableName, columnName, req.params[columnName],
                     req.user.organizationID, endpoint.bindModify(modify, req))
      .then((rowsAffected) => {
        if (rowsAffected > 0) {
          res.send({message: endpoint.chooseMessage('delete', messages)})
        } else {
          res.send(204)
        }
      })
      .catch(err => endpoint.handleError(err, messages, next))
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
 * Choose a message from either custom or default messages
 * @param {string} type Type of message to choose
 * @param {object} [messages] Custom messages
 * @return {string} Chosen message
 */
endpoint.chooseMessage = (type, messages = {}) => {
  const defaultMessages = {
    create: 'created',
    delete: 'deleted',
    conflict: 'already exists',
    missing: 'does not exist',
    badRequest: 'wrong fields in request body',
    default: 'something went wrong'
  }
  return messages[type] || defaultMessages[type] || defaultMessages.default
}

/**
 * Choose Restify error based on database error
 * @param {error} err Error from database
 * @param {object} [messages] Messages for endpoint events
 * @return {error} Restify error
 */
endpoint.chooseError = (err, messages) => {
  switch (err.code) {
    case 'ER_BAD_FIELD_ERROR':
      return new restify.BadRequestError(
        endpoint.chooseMessage('badRequest', messages))
    case 'ER_DUP_ENTRY':
      return new restify.ConflictError(
        endpoint.chooseMessage('conflict', messages))
    case 'ER_NOT_FOUND':
      return new restify.NotFoundError(
        endpoint.chooseMessage('missing', messages))
    default:
      return new restify.InternalServerError(
        endpoint.chooseMessage('default', messages))
  }
}

/**
 * Handle an error in an endpoint handler chain
 * @param {error} err Error from database
 * @param {object} [messages] Messages for endpoint events
 * @param {function} next Next handler in chain; will be given error
 */
endpoint.handleError = (err, messages, next) => {
  next(endpoint.chooseError(err, messages))
}

/**
 *
 * @param {object} controller A module to define methods on
 * @param {string} table Name of a database table, assumed to also be
 *   name of entity
 * @param {object} [messages] Messages for endpoint events
 * @param {string} key Name of a column in a table
 */
endpoint.addAllMethods = (controller, table, key, messages = {}) => {
  controller.getAll = endpoint.getAll(table, {messages})
  controller.get = endpoint.get(table, key, {messages})
  controller.create = endpoint.create(table, {messages})
  controller.update = endpoint.update(table, key, {messages})
  controller.delete = endpoint.delete(table, key, {messages})
}

/**
 * Bind modify function if defined
 * @param {function} [modify] Query modifier
 * @param {object} req Restify request
 * @return {function|undefined} Query modifier or 'undefined'
 */
endpoint.bindModify = (modify, req) => {
  if (modify) {
    return modify.bind(null, req)
  } else {
    return modify
  }
}
