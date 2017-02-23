const restify = require('restify')

// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

// Create and export database instance
const db = module.exports = require('knex')({
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

/**
 * Build a where clause for a Knex `.where()`
 * @param {string} table Name of table
 * @param {string} column Name of column
 * @param {any} value Value to match in column
 * @param {any} [organizationID] ID of organization
 * @return {object} A where clause
 */
db.buildWhere = (table, column, value, organizationID) => {
  const whereClause = {}

  // Add column and value to where clause if defined
  if (column && value) {
    whereClause[column] = value
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
 * @param {object|array} data Row or rows to insert
 * @return {Promise.<object>} Resolved by result from database
 */
db.create = (table, data) => {
  if (data) {
    return db(table)
      .insert(data)
      .catch(err => {
        if (err.code === 'ER_DUP_ENTRY') {
          throw new restify.ConflictError('a row with this id already exists')
        } else {
          throw err
        }
      })
  } else {
    throw new restify.BadRequestError('missing data to insert')
  }
}

/**
 * Delete row specified by `req.params.id` from table
 * @param {string} table Name of a database table
 * @param {string} column Indexed column in database table
 * @param {any} value Value in column to look for
 * @param {any} organizationID ID of organization
 * @return {Promise.<boolean>} True if operation completed succesfully
 * @throws restify.NotFoundError when row to delete does not exist
 */
db.delete = (table, column, value, organizationID) => {
  return db(table)
    .where(db.buildWhere(table, column, value, organizationID))
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
db.get = (table, column, value, organizationID, modify = () => {}) => {
  return db(table)
    .where(db.buildWhere(table, column, value, organizationID))
    .first()
    .modify(modify)
    .tap(row => {
      if (!row) {
        throw new restify.NotFoundError('could not find row')
      }
    })
}

/**
 * Get all rows from table
 * @param {string} table Name of a database table
 * @param {any} organizationID ID of organization
 * @param {function} [modify=noop] Modify the query
 * @return {Promise.<array>} Resolved by all rows from table
 */
db.getAll = (table, organizationID, modify = () => {}) => {
  return db(table)
    .where(db.buildWhere(table, null, null, organizationID))
    .modify(modify)
}

/**
 * Update row in database
 * @param {string} table Name of a database table
 * @param {string} column Indexed column in database table
 * @param {any} value Value in column to look for
 * @param {object} data Data to update row with
 * @param {any} [organizationID] ID of organization
 * @return {Promise} Resolved when response is sent
 * @throws restify.NotFoundError when row is missing from db
 * @throws restify.UnprocessableEntityError when body is missing
 */
db.update = (table, column, value, data, organizationID) => {
  return db(table)
    .where(db.buildWhere(table, column, value, organizationID))
    .first()
    .tap(row => {
      if (row) {
        return db(table)
          .where(column, value)
          .update(data)
      } else {
        throw new restify.NotFoundError('could not find row')
      }
    }).then(() => {
      return db(table)
        .where(column, value)
        .first()
    }).catch(err => {
      if (err.code === 'ER_BAD_FIELD_ERROR') {
        throw new restify.UnprocessableEntityError(
          `fields ${Object.keys(data)} do not match columns in table`)
      } else {
        throw err
      }
    })
}
