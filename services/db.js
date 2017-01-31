const restify = require('restify')

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
 * Create row specified by `req.body` in table
 * @param {string} table Name of a database table
 * @param {string} primaryKey Primary key in given database table
 * @param {object} data Row to insert in given database table
 * @return {Promise.<object>} Resolved by result from database
 */
db.create = (table, primaryKey, data) => {
  return db(table)
    .insert(data)
    .then(() => {
      return db(table)
        .where(data)
        .first()
    }).catch(err => {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new restify.ConflictError('a row with this id already exists')
      } else {
        throw err
      }
    })
}

/**
 * Delete row specified by `req.params.id` from table
 * @param {string} table Name of a database table
 * @param {string} primaryKey Primary key in given database table
 * @param {string} id ID of row to delete
 * @return {Promise.<boolean>} True if operation completed succesfully
 * @throws restify.NotFoundError when row to delete does not exist
 */
db.delete = (table, primaryKey, id) => {
  return db(table)
    .where(primaryKey, id)
    .delete()
}

/**
 * Get row specified by `req.params.id` from table
 * @param {string} table Name of a database table
 * @param {string} primaryKey Primary key in given database table
 * @param {string} id ID of row to get
 * @return {Promise.<object>} Resolved by retrieved row
 * @throws restify.NotFoundError when row is not in db
 */
db.get = (table, primaryKey, id) => {
  return db(table)
    .where(primaryKey, id)
    .first()
    .then(row => {
      if (row) {
        return row
      } else {
        throw new restify.NotFoundError('could not find row')
      }
    })
}

/**
 * Get all rows from table
 * @param {string} table Name of a database table
 * @return {Promise.<array>} Resolved by all rows from table
 */
db.getAll = (table) => {
  return db(table)
}

/**
 * Update row in database
 * @param {string} table Name of a database table
 * @param {string} primaryKey Primary key in given database table
 * @param {string} id ID of row to update
 * @param {object} data Data to update row with
 * @return {Promise} Resolved when response is sent
 * @throws restify.NotFoundError when row is missing from db
 * @throws restify.UnprocessableEntityError when body is missing
 */
db.update = (table, primaryKey, id, data) => {
  return db(table)
    .where(primaryKey, id)
    .first()
    .tap(row => {
      if (row) {
        return db(table)
          .where(primaryKey, id)
          .update(data)
      } else {
        throw new restify.NotFoundError('could not find row')
      }
    }).then(() => {
      return db(table)
        .where(primaryKey, id)
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
