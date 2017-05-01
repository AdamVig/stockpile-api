const test = require('ava')

const fixt = require('./fixtures/db')
const knex = require('./fixtures/knex-instance')

const db = require('../services/db')

test.before('Set up test table', async t => {
  fixt.testTableName = knex.randomizeTableName(fixt.testTableName)
  await knex.schema.dropTableIfExists(fixt.testTableName)
  await knex.schema.createTable(fixt.testTableName, (table) => {
    table.string('name').primary()
    table.integer('value')
    table.integer('organizationID')
  })
})

test.serial('Creates a row', async t => {
  await db.create(fixt.testTableName, fixt.testRow)
  const rows = await knex(fixt.testTableName)
  t.is(rows.length, 1)

  // Try-catch necessary because t.throws does not work as expected
  try {
    db.create(fixt.testTableName, null)
  } catch (err) {
    t.pass('throws error when data is missing')
  }
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
  await db.create(fixt.testTableName, [fixt.testRow, fixt.modifiedTestRow])
  const rows = await knex(fixt.testTableName)
  t.is(rows.length, 2)
})

test.serial('Gets all rows', async t => {
  const testRows = await db.getAll(fixt.testTableName, fixt.organizationID)
  const actualRows = await knex(fixt.testTableName)
  t.deepEqual(testRows, actualRows)
})

test('Throws error when getting nonexistent row', t => {
  t.throws(db.get(fixt.testTableName, fixt.testRowPrimaryKey,
                  fixt.nonexistentRowName))
})

test('Throws error when creating duplicate row', async t => {
  await db.create(fixt.testTableName, fixt.duplicateRow)
  t.throws(db.create(fixt.testTableName, fixt.duplicateRow))
})

test('Throws error when creating row with the wrong columns', async t => {
  t.throws(db.create(fixt.testTableName, fixt.wrongColumnsTestRow))
})

test('Throws error when updating nonexistent row', t => {
  t.throws(db.update(fixt.testTableName, fixt.testRowPrimaryKey,
                     fixt.nonexistentRowName,
                     fixt.testRow))
})

test('Throws error when updating row with the wrong columns', t => {
  t.throws(db.update(fixt.testTableName, fixt.testRowPrimaryKey,
                     fixt.testRow[fixt.testRowPrimaryKey],
                     fixt.wrongColumnsTestRow))
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

test('Count rows', async t => {
  const table = knex.randomizeTableName(fixt.countRowsTable)
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
