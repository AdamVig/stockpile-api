const auth = require('./auth')
const endpoint = require('../services/endpoint')

const rental = module.exports

// Join rental with item to get the item's tag
rental.withTag = (req, queryBuilder) => {
  return queryBuilder
    .select('rental.*')
    .leftJoin('item', 'rental.itemID', 'item.itemID')
    .select('item.tag')
}

const messages = {conflict: 'Cannot rent item, item is already rented'}

rental.getAll = endpoint.getAll('rental', {modify: rental.withTag})
rental.get = endpoint.get('rental', 'tag', {modify: rental.withTag})
rental.create = endpoint.create('rental', {messages})
rental.update = endpoint.update('rental', 'rentalID', {messages})
rental.delete = endpoint.delete('rental', {modify: rental.withTag})

rental.mount = app => {
  app.get({name: 'get all rentals', path: 'rental'}, auth.verify, rental.getAll)
  app.get({name: 'get rental', path: 'rental/:tag'},
          auth.verify, rental.get)
  app.put({name: 'create rental', path: 'rental'}, auth.verify, rental.create)
  app.put({name: 'update rental', path: 'rental/:tag'},
          auth.verify, rental.update)
  app.del({name: 'delete rental', path: 'rental/:tag'},
          auth.verify, rental.delete)
}
