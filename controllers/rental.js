const auth = require('./auth')
const endpoint = require('../services/endpoint')

const table = 'rental'
const key = 'rentalID'

const rental = module.exports = {}

rental.getAll = endpoint.getAll(table)
rental.get = endpoint.get(table, key)
rental.create = endpoint.create(table, 'rental created')
rental.update = endpoint.update(table, key)
rental.delete = endpoint.delete(table, key, 'rental deleted')

rental.mount = app => {
  app.get({name: 'get all rentals', path: 'rental'}, auth.verify, rental.getAll)
  app.get({name: 'get rental', path: 'rental/:rentalID'},
          auth.verify, rental.get)
  app.put({name: 'create rental', path: 'rental'}, auth.verify, rental.create)
  app.put({name: 'update rental', path: 'rental/:rentalID'},
          auth.verify, rental.update)
  app.del({name: 'delete rental', path: 'rental/:rentalID'},
          auth.verify, rental.delete)
}
