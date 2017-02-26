const auth = require('./auth')
const db = require('../services/db')
const endpoint = require('../services/endpoint')

const status = module.exports

status.withItemStatus = queryBuilder => {
  const statusSelect = db.raw(`if(rental.rentalID is null, ` +
                              `'available', 'rented') as status`)
  return queryBuilder
    .select('item.itemID')
    .select(statusSelect)
    .leftJoin('rental', 'item.itemID', 'rental.itemID')
}

status.get = endpoint.get('item', 'tag', {modify: status.withItemStatus})

status.mount = app => {
  app.get({name: 'get status', path: 'item/:tag/status'},
          auth.verify, status.get)
}
