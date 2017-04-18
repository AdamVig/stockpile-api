/**
 * Generalized endpoint functions
 *
 * These functions cover the most common use cases for most controllers.
 *
 * @exports services/endpoint
 */

const restify = require('restify')

const db = require('../services/db')
const paginate = require('./paginate')

/**
 * Get all rows from a table, paginating or modifying query if appropriate
 * @param {string} tableName Name of a database table
 * @param {function} [modify] Modify the query
 * @param {object} [messages] Custom messages for endpoint actions and errors
 * @return {function} Endpoint handler
 */
module.exports.getAll = (tableName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.getAll(tableName, req.user.organizationID,
                     module.exports.bindModify(modify, req))
      .then(results => {
        // If pagination parameters in request, add pagination links
        if (req.params && (req.params.limit || req.params.offset)) {
          return paginate.addLinks(req, res, tableName)
            .then(() => res.send({results}))
        } else {
          return res.send({results})
        }
      })
      .catch(err => module.exports.handleError(err, messages, next, req))
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
module.exports.get = (tableName, columnName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.get(tableName, columnName, req.params[columnName],
                  req.user.organizationID, module.exports.bindModify(modify, req))
      .then(row => res.send(row))
      .catch(err => module.exports.handleError(err, messages, next, req))
  }
}

/**
 * Create a row in a table, returning a descriptive message
 * @param {string} tableName Name of a database table
 * @param {function} [modify] Modify the query
 * @param {object} [messages] Custom messages for endpoint actions and errors
 * @return {function} Endpoint handler
 */
module.exports.create = (tableName, {modify, messages} = {}) => {
  return (req, res, next) => {
    // Add organization ID if it is missing
    if (!req.body.organizationID && req.user) {
      req.body.organizationID = req.user.organizationID
    }

    return db.create(tableName, req.body, module.exports.bindModify(modify, req))
      .then(([id]) => res.send({
        id,
        message: module.exports.chooseMessage('create', messages)
      }))
      .catch(err => module.exports.handleError(err, messages, next, req))
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
module.exports.update = (tableName, columnName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.update(tableName, columnName, req.params[columnName], req.body,
                     req.user.organizationID,
                     module.exports.bindModify(modify, req))
      .then(updatedRow => { return res.send(updatedRow) })
      .catch(err => module.exports.handleError(err, messages, next, req))
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
module.exports.delete = (tableName, columnName, {modify, messages} = {}) => {
  return (req, res, next) => {
    return db.delete(tableName, columnName, req.params[columnName],
                     req.user.organizationID,
                     module.exports.bindModify(modify, req))
      .then((rowsAffected) => {
        if (rowsAffected > 0) {
          res.send({message: module.exports.chooseMessage('delete', messages)})
        } else {
          res.send(204)
        }
      })
      .catch(err => module.exports.handleError(err, messages, next, req))
  }
}

/**
 * Default endpoint handler for new endpoints
 * @return {function} Endpoint handler
 */
module.exports.default = () => {
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
module.exports.chooseMessage = (type, messages = {}) => {
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
module.exports.chooseError = (err, messages) => {
  switch (err.code) {
    case 'ER_BAD_FIELD_ERROR':
      return new restify.BadRequestError(
        module.exports.chooseMessage('badRequest', messages))
    case 'ER_DUP_ENTRY':
      return new restify.ConflictError(
        module.exports.chooseMessage('conflict', messages))
    case 'ER_NOT_FOUND':
      return new restify.NotFoundError(
        module.exports.chooseMessage('missing', messages))
    default:
      return new restify.InternalServerError(
        module.exports.chooseMessage('default', messages))
  }
}

/**
 * Handle an error in an endpoint handler chain
 * @param {error} err Error from database
 * @param {object} [messages] Messages for endpoint events
 * @param {function} next Next handler in chain; will be given error
 * @param {object} req Restify request
 */
module.exports.handleError = (err, messages, next, req) => {
  req.log.error(err)
  next(module.exports.chooseError(err, messages))
}

/**
 *
 * @param {object} controller A module to define methods on
 * @param {string} table Name of a database table, assumed to also be
 *   name of entity
 * @param {object} [messages] Messages for endpoint events
 * @param {string} key Name of a column in a table
 */
module.exports.addAllMethods = (controller, table, key, messages = {}) => {
  controller.getAll = module.exports.getAll(table, {messages})
  controller.get = module.exports.get(table, key, {messages})
  controller.create = module.exports.create(table, {messages})
  controller.update = module.exports.update(table, key, {messages})
  controller.delete = module.exports.delete(table, key, {messages})
}

/**
 * Bind modify function if defined
 * @param {function} [modify] Query modifier
 * @param {any} params Parameters to bind
 * @return {function|undefined} Query modifier or 'undefined'
 */
module.exports.bindModify = (modify, ...params) => {
  if (modify) {
    return modify.bind(null, ...params)
  } else {
    return modify
  }
}
