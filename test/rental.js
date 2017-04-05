const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/rental')
const rental = require('../controllers/rental')

test('Add barcode', t => {
  const queryBuilder = {
    leftJoin: function () { return this },
    select: function () { return this }
  }
  const result = rental.withBarcode(null, null, queryBuilder)
  t.true(result === queryBuilder, 'returns query builder')
})

test('Add user ID', t => {
  const next = sinon.spy()
  rental.addUserID(fixt.req, null, next)
  t.true(fixt.req.body.userID === fixt.userID, 'user ID is added to body')
  t.true(next.calledWithExactly(), 'next is called with no args')

  const nextBad = sinon.spy()
  rental.addUserID(fixt.reqBad, null, nextBad)
  t.true(nextBad.calledWithMatch(sinon.match.instanceOf(Error)),
        'next called with error')
})
