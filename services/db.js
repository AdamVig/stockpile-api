/**
 * Database service
 *
 * @module services/db
 */

// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

function MissingDataError () {
  this.name = 'MissingDataError'
  this.message = 'Data is missing'
  this.code = 'ER_BAD_REQUEST_ERROR'
}
MissingDataError.prototype = Object.create(Error.prototype)

function NotFoundError () {
  this.name = 'NotFoundError'
  this.message = 'Row does not exist'
  this.code = 'ER_NOT_FOUND'
}
NotFoundError.prototype = Object.create(Error.prototype)

// Create and export database instance
const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: process.env.DB_URL,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8'
  },
  useNullAsDefault: true
})

/** Knex instance */
module.exports = knex

/**
 * Build a where clause for a Knex `.where()`
 * @param {string} table Name of table
 * @param {string} column Name of column
 * @param {any} value Value to match in column
 * @param {any} [organizationID] ID of organization
 * @return {object} A where clause
 */
module.exports.buildWhere = (table, column, value, organizationID) => {
  const whereClause = {}

  // Add column and value to where clause if defined
  if (column && value) {
    whereClause[`${table}.${column}`] = value
  }

  // Add organization ID to where clause if defined
  if (organizationID) {
    // Prefix with table name in case of ambiguity
    whereClause[`${table}.organizationID`] = organizationID
  }

  return whereClause
}

/**
 * Create a row or rows in a table
 * @param {string} table Name of a database table
 * @param {string} [column] Indexed column in database table
 * @param {object|array} data Row or rows to insert
 * @param {function} [modify=noop] Modify the query
 * @return {Promise.<object>} Resolved by result from database
 * @throws MissingDataError
 */
module.exports.create = (table, column, data, modify = () => {}) => {
  if (data) {
    return knex(table)
      .insert(data)
      .then(([id]) => {
        if (column) {
          return knex(table)
          .where(module.exports.buildWhere(table, column, id))
            .first()
        } else {
          return id
        }
      })
  } else {
    throw new MissingDataError()
  }
}

/**
 * Delete row specified by `req.params.id` from table
 * @param {string} table Name of a database table
 * @param {string} column Indexed column in database table
 * @param {any} value Value in column to look for
 * @param {any} [organizationID] ID of organization
 * @param {function} [modify=noop] Modify the query
 * @return {Promise.<boolean>} True if operation completed succesfully
 * @throws restify.NotFoundError when row to delete does not exist
 */
module.exports.delete = (table, column, value, organizationID, modify = () => {}) => {
  return knex(table)
    .where(module.exports.buildWhere(table, column, value, organizationID))
    .delete()
}

/**
 * Get row from table
 * @param {string} table Name of a database table
 * @param {string} column Indexed column in database table
 * @param {any} value Value in column to look for
 * @param {any} [organizationID] ID of organization
 * @param {function} [modify=noop] Modify the query
 * @return {Promise.<object>} Resolved by retrieved row
 * @throws restify.NotFoundError when row is not in db
 */
module.exports.get = (table, column, value, organizationID, modify = () => {}) => {
  return knex(table)
    .where(module.exports.buildWhere(table, column, value, organizationID))
    .first()
    .modify(modify)
    .tap(row => {
      if (!row) {
        throw new NotFoundError()
      }
    })
}

/**
 * Get all rows from table
 * @param {string} table Name of a database table
 * @param {any} [organizationID] ID of organization
 * @param {function} [modify=noop] Modify the query
 * @return {Promise.<array>} Resolved by all rows from table
 */
module.exports.getAll = (table, organizationID, modify = () => {}) => {
  return knex(table)
    .where(module.exports.buildWhere(table, null, null, organizationID))
    .modify(modify)
}

/**
 * Update row in database
 * @param {string} table Name of a database table
 * @param {string} column Indexed column in database table
 * @param {any} value Value in column to look for
 * @param {object} data Data to update row with
 * @param {any} [organizationID] ID of organization
 * @param {function} [modify=noop] Modify the query
 * @return {Promise} Resolved when response is sent
 * @throws restify.NotFoundError when row is missing from db
 * @throws restify.UnprocessableEntityError when body is missing
 */
module.exports.update = (table, column, value, data, organizationID, modify = () => {}) => {
  return knex(table)
    .where(module.exports.buildWhere(table, column, value, organizationID))
    .first()
    .tap(row => {
      if (row) {
        return knex(table)
          .where(column, value)
          .update(data)
      } else {
        throw new NotFoundError()
      }
    }).then(() => {
      return knex(table)
        .where(column, value)
        .first()
    })
}

/**
 * Count all rows in a table
 * @param {string} table Name of a database table
 * @param {any} [organizationID] ID of organization
 * @param {function} [modify=noop] Modify the query
 * @return {Promise.<array>} Resolved by all rows from table
 */
module.exports.countRows = (table, organizationID, modify = () => {}) => {
  return knex(table)
    .where(module.exports.buildWhere(table, null, null, organizationID))
    .count('* as count')
    .first()
    .modify(modify)
}
