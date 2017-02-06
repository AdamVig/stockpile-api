const Knex = require('knex')
const test = require('ava')

// Fixtures, shortened to `d` for convenience
const d = require('./fixtures/db')

// Load environment variables, throw error if any are missing
require('dotenv-safe').load({
  allowEmptyValues: true
})

const db = require('../services/db')

// Set up Knex instance for modifying database
const knex = Knex({
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

test.before('Set up test table', async t => {
  await knex.schema.dropTableIfExists(d.testTableName)
  await knex.schema.createTable(d.testTableName, (table) => {
    table.string('name').primary()
    table.integer('value')
  })
})

test.serial('Creates a row', async t => {
  await db.create(d.testTableName, d.testRow)
  const rows = await knex(d.testTableName)
  t.is(rows.length, 1)
})

test.serial('Gets a row', async t => {
  const row = await db.get(d.testTableName, d.testRowPrimaryKey,
                           d.testRow[d.testRowPrimaryKey])
  t.deepEqual(row, d.testRow)
})

test.serial('Updates a row', async t => {
  await db.update(d.testTableName, d.testRowPrimaryKey,
                  d.testRow[d.testRowPrimaryKey], d.modifiedTestRow)
  const updatedRow = await knex(d.testTableName)
          .where(d.testRowPrimaryKey, d.modifiedTestRow[d.testRowPrimaryKey])
          .first()
  t.deepEqual(d.modifiedTestRow, updatedRow)
})

test.serial('Deletes a row', async t => {
  await db.delete(d.testTableName, d.testRowPrimaryKey,
               d.modifiedTestRow[d.testRowPrimaryKey])
  const rows = await knex(d.testTableName)
  t.is(rows.length, 0)
})

test.serial('Creates multiple rows', async t => {
  await db.create(d.testTableName, [d.testRow, d.modifiedTestRow])
  const rows = await knex(d.testTableName)
  t.is(rows.length, 2)
})

test.serial('Gets all rows', async t => {
  const testRows = await db.getAll(d.testTableName)
  const actualRows = await knex(d.testTableName)
  t.deepEqual(testRows, actualRows)
})

test('Throws error when getting nonexistent row', t => {
  t.throws(db.get(d.testTableName, d.testRowPrimaryKey, d.nonexistentRowName))
})

test('Throws error when creating duplicate row', async t => {
  await db.create(d.testTableName, d.duplicateRow)
  t.throws(db.create(d.testTableName, d.duplicateRow))
})

test('Throws error when creating row with the wrong columns', async t => {
  t.throws(db.create(d.testTableName, d.wrongColumnsTestRow))
})

test('Throws error when updating nonexistent row', t => {
  t.throws(db.update(d.testTableName, d.testRowPrimaryKey, d.nonexistentRowName,
                     d.testRow))
})

test('Throws error when updating row with the wrong columns', t => {
  t.throws(db.update(d.testTableName, d.testRowPrimaryKey,
                     d.testRow[d.testRowPrimaryKey], d.wrongColumnsTestRow))
})

test.after.always('Remove test table', async t => {
  await knex.schema.dropTable(d.testTableName)
})
