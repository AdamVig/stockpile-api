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
  await endpoint.create(d.table, d.messagesWithCreate)(req, res, next)
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
                        d.messagesWithDelete)(req, res, next)
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

test('Add all methods', t => {
  const controller = {}
  endpoint.addAllMethods(controller, d.table, d.primaryKey)
  t.deepEqual(Object.keys(controller), d.allMethodNames,
         'all methods are defined on controller')
})

test('Choose message', t => {
  // Uses default case when message type is not defined
  const actualDefaultMessage = endpoint.chooseMessage('doesNotExist',
                                                      d.customMessages)
  // Uses custom message when passed object has the type defined
  const actualCustomMessage = endpoint.chooseMessage('conflict',
                                                     d.customMessages)
  // Uses a default message for the type when passed object does not have it
  const actualMessageDefault = endpoint.chooseMessage('badRequest',
                                                      d.customMessages)
  t.is(actualDefaultMessage, d.expectedDefaultMessage,
          'default message works')
  t.is(actualCustomMessage, d.expectedCustomMessage, 'custom message works')
  t.is(actualMessageDefault, d.defaultBadRequestMessage,
          'message default works')
})

test('Choose error', t => {
  const actualBadRequest = endpoint.chooseError(d.errors[0], d.customMessages)
  const actualMissing = endpoint.chooseError(d.errors[1], d.customMessages)
  const actualDuplicate = endpoint.chooseError(d.errors[2], d.customMessages)
  const actualUndefined = endpoint.chooseError(d.errors[3], d.customMessages)
  t.true(actualBadRequest.message === d.defaultBadRequestMessage,
         'handles bad request error')
  t.true(actualMissing.message === d.customMessages.missing,
         'handles missing error')
  t.true(actualDuplicate.message === d.customMessages.conflict,
         'handles duplicate error')
  t.true(actualUndefined.message === d.expectedDefaultMessage,
         'handles undefined error')
})

test('Handle error', t => {
  const next = sinon.spy()

  endpoint.handleError(d.errors[0], d.customMessages, next)

  t.true(next.calledOnce, 'next handler is called')
})

test.after.always('Remove test table', async t => {
  await knex.schema.dropTable(d.table)
})
