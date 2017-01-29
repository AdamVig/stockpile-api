const Knex = require('knex')
const test = require('ava')

// Load environment variables, throw error if any are undefined
require('dotenv-safe').load()

const db = require('../services/db')

// Set up Knex instance for modifying database
const knex = Knex({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8'
  },
  useNullAsDefault: true
})

const testTableName = 'test'

test.before('Set up test table', async t => {
  await knex.schema.createTable(testTableName, (table) => {
    table.string('name')
    table.integer('value')
  })
})

test('Creates a row', async t => {
  const testRow = {name: 'test1', value: 5}
  await db.create(testTableName, null, testRow)
  const rows = await knex(testTableName)
  t.is(rows.length, 1)
})

// TODO finish writing tests for database service

test.after('Remove test table', async t => {
  await knex.schema.dropTable(testTableName)
})
