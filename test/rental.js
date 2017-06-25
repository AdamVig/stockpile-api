const sinon = require('sinon')
const test = require('ava')

const fixt = require('./fixtures/rental')
const rental = require('../controllers/rental')

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
