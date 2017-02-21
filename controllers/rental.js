const auth = require('./auth')
const endpoint = require('../services/endpoint')

const rental = module.exports = {}

endpoint.addAllMethods(rental, 'rental', 'rentalID')

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
