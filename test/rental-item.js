const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/rental-item')
const rentalItem = require('../controllers/rental-item')

test('For rental', t => {
  const queryBuilder = {
    where: sinon.stub().returnsThis()
  }
  const result = rentalItem.forRental(fixt.req, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('With item details', t => {
  const queryBuilder = {
    join: sinon.stub().returnsThis(),
    modify: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis()
  }
  const result = rentalItem.withItemDetails(null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})
