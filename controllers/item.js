const auth = require('./auth')
const endpoint = require('../services/endpoint')

const item = module.exports

endpoint.addAllMethods(item, 'item', 'tag')

item.mount = app => {
  app.get({name: 'get all items', path: 'item'}, auth.verify, item.getAll)
  app.get({name: 'get item', path: 'item/:tag'}, auth.verify, item.get)
  app.put({name: 'create item', path: 'item'}, auth.verify, item.create)
  app.put({name: 'update item', path: 'item/:tag'}, auth.verify, item.update)
  app.del({name: 'delete item', path: 'item/:tag'}, auth.verify, item.delete)
}
