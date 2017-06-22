const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/endpoint')
const endpoint = require('../services/endpoint')
const knex = require('./fixtures/knex-instance')

test.before('Set up test table', async t => {
  fixt.table = knex.randomizeTableName(fixt.table)
  await knex.schema.dropTableIfExists(fixt.table)
  await knex.schema.createTable(fixt.table, table => {
    table.string('name').primary()
    table.integer('value')
    table.integer('organizationID')
  })

  // Insert multiple rows
  await knex(fixt.table).insert(fixt.multipleRows)
})

test('Get all', async t => {
  const req = {
    user: {organizationID: fixt.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.getAll(fixt.table)(req, res, next)
  t.true(res.send.calledOnce, 'sends one response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'responds with an object')
  // Two items inserted, so should be two or more in the table
  t.true(res.send.calledWithMatch(sinon.match(response =>
                                              response.results.length >= 2)),
         'responds with the right number of items')
  t.false(next.called, 'no errors')

  const reqMissingTable = {
    log: {error: sinon.spy()},
    params: {},
    user: {organizationID: fixt.organizationID}
  }
  const nextMissingTable = sinon.spy()
  await endpoint.getAll(fixt.missingTable)(reqMissingTable, null,
                                            nextMissingTable)
  t.true(nextMissingTable.calledWithMatch(sinon.match.instanceOf(Error)),
         'returns error when getting missing row')
})

test('Get all with pagination', async t => {
  const req = {
    params: fixt.paginationParams,
    path: sinon.stub().returns(fixt.paginationPath),
    user: {organizationID: fixt.organizationID}
  }
  const res = {
    links: sinon.spy(),
    send: sinon.spy()
  }
  const next = sinon.spy()

  await endpoint.getAll(fixt.table)(req, res, next)

  t.true(res.links.calledOnce, 'sets link header')
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
  await knex(fixt.table).insert(fixt.singleRow)

  const req = {
    params: {},
    user: {organizationID: fixt.organizationID}
  }

  // Add the primary key value to the parameters
  req.params[fixt.primaryKey] = fixt.singleRow[fixt.primaryKey]

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.get(fixt.table, fixt.primaryKey)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
                                  'route responds with an object')
  t.false(next.called, 'no errors')

  const reqMissing = {
    log: {error: sinon.spy()},
    params: {},
    user: {organizationID: fixt.organizationID}
  }
  const nextMissing = sinon.spy()
  await endpoint.get(fixt.table, fixt.primaryKey)(reqMissing, null, nextMissing)
  t.true(nextMissing.calledWithMatch(sinon.match.instanceOf(Error)),
         'returns error when getting missing row')
})

test('Create', async t => {
  const req = {
    body: fixt.rowToCreate,
    user: {organizationID: fixt.organizationID}
  }
  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.create(fixt.table, fixt.primaryKey,
                        fixt.messagesWithCreate)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
  t.false(next.called, 'no errors')

  const reqMissingFields = {
    body: fixt.rowToCreateNoName,
    log: {error: sinon.spy()},
    user: {organizationID: fixt.organizationID}
  }
  const nextMissingFields = sinon.spy()
  await endpoint.create(fixt.table, fixt.testRowPrimaryKey)(reqMissingFields,
                                                            null,
                                                            nextMissingFields)
  t.true(nextMissingFields.calledWithMatch(sinon.match.instanceOf(Error)),
         'returns error when request body is missing a required field')

  const reqNoOrg = {
    body: fixt.rowToCreateNoOrg,
    log: {error: sinon.spy()},
    user: {organizationID: fixt.organizationID}
  }
  const resNoOrg = {
    send: sinon.spy()
  }
  const nextNoOrg = sinon.spy()
  await endpoint.create(fixt.table, fixt.testRowPrimaryKey)(reqNoOrg, resNoOrg,
                                                            nextNoOrg)
  t.true(res.send.calledOnce, 'route sends a response when body has no org ID')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object when body has no org ID')
  t.false(next.called, 'no errors when body has no org ID')
})

test('Update', async t => {
  // Insert row to update
  await knex(fixt.table).insert(fixt.rowToUpdate)

  const req = {
    body: fixt.updatedRow,
    params: {},
    user: {organizationID: fixt.organizationID}
  }

  // Add the primary key value to the parameters
  req.params[fixt.primaryKey] = fixt.updatedRow[fixt.primaryKey]

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.update(fixt.table, fixt.primaryKey)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')
  t.false(next.called, 'no errors')

  const reqMissing = {
    log: {error: sinon.spy()},
    params: {name: fixt.missingRowToUpdate.name},
    body: fixt.missingRowToUpdate,
    user: {organizationID: fixt.organizationID}
  }
  const nextMissing = sinon.spy()
  await endpoint.update(fixt.table, fixt.primaryKey)(reqMissing, null,
                                                     nextMissing)
  t.true(nextMissing.calledWithMatch(sinon.match.instanceOf(Error)),
         'returns error when updating nonexistent row')
})

test('Delete', async t => {
  // Insert row to delete
  await knex(fixt.table).insert(fixt.rowToDelete)

  const req = {
    params: {},
    user: {organizationID: fixt.organizationID}
  }

  // Add the primary key value to the parameters
  req.params[fixt.primaryKey] = fixt.rowToDelete[fixt.primaryKey]

  const res = {
    send: sinon.spy()
  }
  const next = sinon.spy()
  await endpoint.delete(fixt.table, fixt.primaryKey,
                        fixt.messagesWithDelete)(req, res, next)
  t.true(res.send.calledOnce, 'route sends a response')
  t.true(res.send.calledWithMatch(sinon.match.object),
         'route responds with an object')

  const reqMissing = {
    log: {error: sinon.spy()},
    params: {name: fixt.nonNameToDelete},
    user: {organizationID: fixt.organizationID}
  }
  const nextMissing = sinon.spy()
  await endpoint.delete(fixt.table, fixt.primaryKey)(reqMissing, null,
                                                     nextMissing)
  t.true(nextMissing.calledWithMatch(sinon.match.instanceOf(Error)),
         'returns error when deleting nonexistent row')
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
  endpoint.addAllMethods(controller, fixt.table, fixt.primaryKey)
  t.deepEqual(Object.keys(controller), fixt.allMethodNames,
         'all methods are defined on controller')
})

test('Choose message', t => {
  // Uses default case when message type is not defined
  const actualDefaultMessage = endpoint.chooseMessage('doesNotExist',
                                                      fixt.customMessages)
  // Uses custom message when passed object has the type defined
  const actualCustomMessage = endpoint.chooseMessage('conflict',
                                                     fixt.customMessages)
  // Uses a default message for the type when passed object does not have it
  const actualMessageDefault = endpoint.chooseMessage('badRequest',
                                                      fixt.customMessages)
  t.is(actualDefaultMessage, fixt.expectedDefaultMessage,
          'default message works')
  t.is(actualCustomMessage, fixt.expectedCustomMessage, 'custom message works')
  t.is(actualMessageDefault, fixt.defaultBadRequestMessage,
          'message default works')
})

test('Choose error', t => {
  const actualBadRequest = endpoint.chooseError(fixt.errors[0],
                                                fixt.customMessages)
  const actualMissing = endpoint.chooseError(fixt.errors[1],
                                             fixt.customMessages)
  const actualDuplicate = endpoint.chooseError(fixt.errors[2],
                                               fixt.customMessages)
  const actualUndefined = endpoint.chooseError(fixt.errors[3],
                                               fixt.customMessages)
  t.true(actualBadRequest.message === fixt.defaultBadRequestMessage,
         'handles bad request error')
  t.true(actualMissing.message === fixt.customMessages.missing,
         'handles missing error')
  t.true(actualDuplicate.message === fixt.customMessages.conflict,
         'handles duplicate error')
  t.true(actualUndefined.message === fixt.expectedDefaultMessage,
         'handles undefined error')
})

test('Handle error', t => {
  const next = sinon.spy()
  const req = {
    log: {
      error: sinon.spy()
    }
  }

  endpoint.handleError(fixt.errors[0], fixt.customMessages, next, req)

  t.true(next.calledOnce, 'next handler is called')
  t.true(req.log.error.calledOnce, 'error is logged with request logger')
})

test.after.always('Remove test table', async t => {
  await knex.schema.dropTable(fixt.table)
})

test('Bind modify', t => {
  const modify = {
    bind: sinon.spy()
  }
  const actual = endpoint.bindModify(undefined, fixt.req)
  t.true(actual === undefined, 'passes value through when undefined')

  endpoint.bindModify(modify, fixt.req)
  t.true(modify.bind.calledOnce, 'binds function')
})
