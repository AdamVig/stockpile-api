const sinon = require('sinon')
const test = require('ava')

const d = require('./fixtures/endpoint')
const endpoint = require('../services/endpoint')
const knex = require('./fixtures/knex-instance')

test.before('Set up test table', async t => {
  await knex.schema.dropTableIfExists(d.table)
  await knex.schema.createTable(d.table, table => {
    table.string('name').primary()
    table.integer('value')
    table.integer('organizationID')
  })
})

test('Get all', async t => {
  // Insert multiple rows
  await knex(d.table).insert(d.multipleRows)

  const req = {
    user: {organizationID: d.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.getAll(d.table)(req, res, next)
  t.true(res.send.calledOnce, 'sends one response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'responds with an object')
  // Two items inserted, so should be two or more in the table
  t.true(res.send.calledWithMatch(sinon.match(response =>
                                              response.results.length >= 2)),
         'responds with the right number of items')
  t.false(next.called, 'no errors')
})

test('Get', async t => {
  // Insert single row
  await knex(d.table).insert(d.singleRow)

  const req = {
    params: {},
    user: {organizationID: d.organizationID}
  }

  // Add the primary key value to the parameters
  req.params[d.primaryKey] = d.singleRow[d.primaryKey]

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.get(d.table, d.primaryKey)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
  t.false(next.called, 'no errors')
})

test('Create', async t => {
  const req = {
    body: d.rowToCreate,
    user: {organizationID: d.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.create(d.table, d.createMessage)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
  t.false(next.called, 'no errors')
})

test('Update', async t => {
  // Insert row to update
  await knex(d.table).insert(d.rowToUpdate)

  const req = {
    body: d.updatedRow,
    user: {organizationID: d.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.update(d.table, d.primaryKey)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
  t.false(next.called, 'no errors')
})

test('Delete', async t => {
  // Insert row to delete
  await knex(d.table).insert(d.rowToDelete)

  const req = {
    params: {},
    user: {organizationID: d.organizationID}
  }

  // Add the primary key value to the parameters
  req.params[d.primaryKey] = d.rowToDelete[d.primaryKey]

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.delete(d.table, d.primaryKey,
                        d.deleteMessage)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
})

test('Default', async t => {
  const res = {
    send: sinon.spy()
  }
  await endpoint.default()(null, res, null)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
})

test.after.always('Remove test table', async t => {
  await knex.schema.dropTable(d.table)
})
