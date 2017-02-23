const test = require('ava')

const d = require('./fixtures/db')
const knex = require('./fixtures/knex-instance')

const db = require('../services/db')

test.before('Set up test table', async t => {
  await knex.schema.dropTableIfExists(d.testTableName)
  await knex.schema.createTable(d.testTableName, (table) => {
    table.string('name').primary()
    table.integer('value')
    table.integer('organizationID')
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
                  d.testRow[d.testRowPrimaryKey], d.modifiedTestRow,
                  d.organizationID)
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
  const testRows = await db.getAll(d.testTableName, d.organizationID)
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

test('Builds a where clause without organization ID', t => {
  const whereClause = db.buildWhere(d.testTableName, d.column, d.value)
  const expectedWhereClause = {}
  expectedWhereClause[d.column] = d.value
  t.deepEqual(whereClause, expectedWhereClause)
})

test('Builds a where clause with an organization ID', t => {
  const whereClause = db.buildWhere(d.testTableName, d.column, d.value,
                                    d.organizationID)
  t.deepEqual(whereClause, d.expectedWhereClause)
})

test('Builds a where clause with only organization ID', t => {
  const whereClause = db.buildWhere(d.testTableName, null, null,
                                    d.organizationID)
  t.deepEqual(whereClause, d.expectedWhereClauseOrg)
})

test.after.always('Remove test table', async t => {
  await knex.schema.dropTable(d.testTableName)
})
