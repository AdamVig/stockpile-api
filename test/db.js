const test = require('ava')

const fixt = require('./fixtures/db')
const knex = require('./fixtures/knex-instance')

const db = require('../services/db')

test.before('Set up test table', async t => {
  fixt.testTableName = knex.randomizeName(fixt.testTableName)
  await knex.schema.dropTableIfExists(fixt.testTableName)
  await knex.schema.createTable(fixt.testTableName, (table) => {
    table.string('name').primary()
    table.integer('value')
    table.integer('organizationID')
  })
})

test.serial('Creates a row', async t => {
  await db.create(fixt.testTableName, fixt.testRowPrimaryKey, fixt.testRow)
  const rows = await knex(fixt.testTableName)
  t.is(rows.length, 1)

  t.throws(() => { db.create(fixt.testTableName, fixt.testRowPrimaryKey, null) }, Error,
    'throws error when data is missing')
})

test.serial('Gets a row', async t => {
  const row = await db.get(fixt.testTableName, fixt.testRowPrimaryKey,
    fixt.testRow[fixt.testRowPrimaryKey])
  t.deepEqual(row, fixt.testRow)
})

test.serial('Updates a row', async t => {
  await db.update(fixt.testTableName, fixt.testRowPrimaryKey,
    fixt.testRow[fixt.testRowPrimaryKey], fixt.modifiedTestRow,
    fixt.organizationID)
  const updatedRow = await knex(fixt.testTableName)
    .where(fixt.testRowPrimaryKey,
      fixt.modifiedTestRow[fixt.testRowPrimaryKey])
    .first()
  t.deepEqual(fixt.modifiedTestRow, updatedRow)
})

test.serial('Deletes a row', async t => {
  await db.delete(fixt.testTableName, fixt.testRowPrimaryKey,
    fixt.modifiedTestRow[fixt.testRowPrimaryKey])
  const rows = await knex(fixt.testTableName)
  t.is(rows.length, 0)
})

test.serial('Creates multiple rows', async t => {
  await db.create(fixt.testTableName, fixt.testRowPrimaryKey,
    [fixt.testRow, fixt.modifiedTestRow])
  const rows = await knex(fixt.testTableName)
  t.is(rows.length, 2)
})

test.serial('Gets all rows', async t => {
  const testRows = await db.getAll(fixt.testTableName, fixt.organizationID)
  const actualRows = await knex(fixt.testTableName)
  t.deepEqual(testRows, actualRows)
})

test.serial('Gets all rows in ascending sorted order', async t => {
  const testRows = await db.getAll(fixt.testTableName, fixt.organizationID, undefined,
    fixt.getAllSortedRows.sortByAscending)
  t.deepEqual(testRows, fixt.getAllSortedRows.expectedAscending)
})

test.serial('Gets all rows in descending sorted order', async t => {
  const testRows = await db.getAll(fixt.testTableName, fixt.organizationID, undefined,
    fixt.getAllSortedRows.sortByDescending)
  t.deepEqual(testRows, fixt.getAllSortedRows.expectedDescending)
})

test('Throws error when getting nonexistent row', async t => {
  await t.throws(db.get(fixt.testTableName, fixt.testRowPrimaryKey,
    fixt.nonexistentRowName), Error)
})

test('Throws error when creating duplicate row', async t => {
  await db.create(fixt.testTableName, fixt.testRowPrimaryKey, fixt.duplicateRow)
  t.throws(() => { db.create(fixt.testTableName, fixt.duplicateRow) }, Error)
})

test('Throws error when creating row with the wrong columns', async t => {
  await t.throws(db.create(fixt.testTableName, fixt.testRowPrimaryKey,
    fixt.wrongColumnsTestRow), Error)
})

test('Throws error when updating nonexistent row', async t => {
  await t.throws(db.update(fixt.testTableName, fixt.testRowPrimaryKey,
    fixt.nonexistentRowName,
    fixt.testRow), Error)
})

test('Throws error when updating row with the wrong columns', async t => {
  await t.throws(db.update(fixt.testTableName, fixt.testRowPrimaryKey,
    fixt.testRow[fixt.testRowPrimaryKey],
    fixt.wrongColumnsTestRow), Error)
})

test('Builds a where clause without organization ID', t => {
  const whereClause = db.buildWhere(fixt.whereClauseTable, fixt.column,
    fixt.value)
  t.deepEqual(whereClause, fixt.expectedWhereClauseNoOrg)
})

test('Builds a where clause with an organization ID', t => {
  const whereClause = db.buildWhere(fixt.whereClauseTable, fixt.column,
    fixt.value, fixt.organizationID)
  t.deepEqual(whereClause, fixt.expectedWhereClause)
})

test('Builds a where clause with only organization ID', t => {
  const whereClause = db.buildWhere(fixt.whereClauseTable, null, null,
    fixt.organizationID)
  t.deepEqual(whereClause, fixt.expectedWhereClauseOrg)
})

test('Disambiguates keys', t => {
  const result = db.disambiguateKeys(fixt.disambiguatesKeys.data, fixt.disambiguatesKeys.table)
  t.deepEqual(result, fixt.disambiguatesKeys.expected)
})

test('Count rows', async t => {
  const table = knex.randomizeName(fixt.countRowsTable)
  await knex.schema.createTable(table, table => {
    table.string('name')
  })
  await knex(table).insert(fixt.countRowsTestRows)
  const {count} = await db.countRows(table)
  t.is(count, fixt.expectedRowsCount, 'counts rows correctly')
  await knex.schema.dropTable(table)
})

test.after.always('Remove test table', async t => {
  await knex.schema.dropTable(fixt.testTableName)
})
