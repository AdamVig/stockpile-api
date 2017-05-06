const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/item')
const item = require('../controllers/item')

test('With fields and filters', t => {
  const queryBuilder = {
    leftJoin: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  item.withFieldsAndFilters(fixt.req, queryBuilder)
  t.true(queryBuilder.modify.called, 'filters are added to request')
})

test('Paginate rentals', t => {
  const queryBuilder = {
    modify: sinon.stub().returnsThis()
  }
  const result = item.paginateRentals(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('With active rental', t => {
  const queryBuilder = {
    orderBy: sinon.stub().returnsThis(),
    where: sinon.stub().returnsThis()
  }
  const result = item.withActiveRental(fixt.activeRentalReq, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('For item', t => {
  const queryBuilder = {
    where: sinon.stub().returnsThis()
  }
  const result = item.forItem(fixt.reqForItem, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})
