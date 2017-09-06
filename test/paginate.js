const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/paginate')
const knex = require('./fixtures/knex-instance')
const paginate = require('../services/paginate')

test.before('Prepare database', async t => {
  fixt.table = knex.randomizeName(fixt.table)
  await knex.schema.createTable(fixt.table, table => {
    table.string('name')
    table.integer('organizationID')
  })

  // Insert multiple rows
  await knex(fixt.table).insert(fixt.rows)
})

test('Paginate query', t => {
  const queryBuilder = {
    limit: sinon.stub(),
    offset: sinon.spy()
  }
  paginate.paginateQuery(queryBuilder, fixt.req)
  t.true(queryBuilder.limit.calledOnce, 'limit is called')
  t.true(queryBuilder.offset.calledOnce, 'offset is called')
})

test('Paginate query with only limit', t => {
  const queryBuilder = {
    limit: sinon.spy(),
    offset: sinon.spy()
  }
  paginate.paginateQuery(queryBuilder, fixt.reqOnlyLimit)
  t.true(queryBuilder.limit.calledOnce, 'limit is called')
  t.false(queryBuilder.offset.called, 'offset is not called')
})

test('Paginate query with only offset', t => {
  const queryBuilder = {
    limit: sinon.spy(),
    offset: sinon.spy()
  }
  paginate.paginateQuery(queryBuilder, fixt.reqOnlyOffset)
  t.true(queryBuilder.offset.calledOnce, 'offset is called')
  t.false(queryBuilder.limit.called, 'limit is not called')
})

test('Paginate query with no parameters', t => {
  const queryBuilder = {
    limit: sinon.spy(),
    offset: sinon.spy()
  }
  const req = {
    params: {}
  }
  paginate.paginateQuery(queryBuilder, req)
  t.false(queryBuilder.limit.called, 'limit is not called')
  t.false(queryBuilder.offset.called, 'offset is not called')
})

test('Add links', async t => {
  const req = {
    params: fixt.addLinksParams,
    path: sinon.stub().returns(fixt.path),
    user: fixt.user
  }
  const res = {
    links: sinon.spy()
  }
  await paginate.addLinks(req, res, fixt.table)
  t.true(res.links.calledOnce, 'adds links to response')
})

test('Create links with no previous or next pages', t => {
  const links = paginate.createLinks(fixt.path, fixt.paramsNoPrevNext.limit,
    fixt.paramsNoPrevNext.offset,
    fixt.paramsNoPrevNext.count)
  t.deepEqual(links, fixt.linksNoPrevNextExpected, 'creates links correctly')
})

test('Create "last" link with odd total', t => {
  const links = paginate.createLinks(fixt.path, fixt.paramsOddTotal.limit,
    fixt.paramsOddTotal.offset,
    fixt.paramsOddTotal.count)
  t.is(links.last, fixt.lastLinkOddTotalExpected, 'creates links correctly')
})

test('Create links with previous but not next page', t => {
  const links = paginate.createLinks(fixt.path, fixt.paramsPrev.limit,
    fixt.paramsPrev.offset,
    fixt.paramsPrev.count)
  t.deepEqual(links, fixt.linksPrevExpected, 'creates links correctly')
})

test('Create links with next but not previous page', t => {
  const links = paginate.createLinks(fixt.path, fixt.paramsNext.limit,
    fixt.paramsNext.offset,
    fixt.paramsNext.count)
  t.deepEqual(links, fixt.linksNextExpected, 'creates links correctly')
})

test('Create links with no offset or total values', t => {
  const links = paginate.createLinks(fixt.path, fixt.noOffsetTotalLimit)
  t.deepEqual(links, fixt.linksNoOffsetTotalExpected, 'creates links correctly')
})

test.after.always('Clean up database', async t => {
  await knex.schema.dropTable(fixt.table)
})
