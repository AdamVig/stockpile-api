const auth = require('./auth')
const endpoint = require('../services/endpoint')

const table = 'item'
const key = 'tag'

const item = module.exports = {}

item.getAll = endpoint.getAll(table)
item.get = endpoint.get(table, key)
item.create = endpoint.create(table, 'item created')
item.update = endpoint.update(table, key)
item.delete = endpoint.delete(table, key, 'item deleted')

item.mount = app => {
  app.get({name: 'get all items', path: 'item'}, auth.verify, item.getAll)
  app.get({name: 'get item', path: 'item/:tag'}, auth.verify, item.get)
  app.put({name: 'create item', path: 'item'}, auth.verify, item.create)
  app.put({name: 'update item', path: 'item/:tag'}, auth.verify, item.update)
  app.del({name: 'delete item', path: 'item/:tag'}, auth.verify, item.delete)
}
