// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

module.exports = {
  client: 'mysql',
  connection: {
    host: process.env.DB_URL,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  migrations: {
    tableName: 'knexMigrations'
  }
}
