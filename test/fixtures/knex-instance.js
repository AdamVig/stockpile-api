const Knex = require('knex')

// Load environment variables, throw error if any are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

// Set up Knex instance for modifying database
module.exports = Knex({
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
