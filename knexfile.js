// Load environment variables, throw error if any variables are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

module.exports = {
  local: {
    client: 'mysql',
    connection: {
      host: '127.0.0.1',
      database: 'stockpile-local',
      user: 'root'
    },
    migrations: {
      tableName: 'knexMigrations'
    }
  },
  development: {
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
  },
  production: {
    client: 'mysql',
    connection: {
      host: process.env.PROD_DB_URL,
      database: process.env.PROD_DB_NAME,
      user: process.env.PROD_DB_USER,
      password: process.env.PROD_DB_PASSWORD
    },
    migrations: {
      tableName: 'knexMigrations'
    }
  }
}
