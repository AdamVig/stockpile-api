const auth = require('./auth')
const endpoint = require('../services/endpoint')

const table = 'brand'
const key = 'brandID'

const brand = module.exports = {}

brand.getAll = endpoint.getAll(table)
brand.get = endpoint.get(table, key)
brand.create = endpoint.create(table, 'brand created')
brand.update = endpoint.update(table, key)
brand.delete = endpoint.delete(table, key, 'brand deleted')

brand.mount = app => {
  app.get({name: 'get all brands', path: 'brand'}, auth.verify, brand.getAll)
  app.get({name: 'get brand', path: 'brand/:brandID'}, auth.verify, brand.get)
  app.put({name: 'create brand', path: 'brand'}, auth.verify, brand.create)
  app.put({name: 'update brand', path: 'brand/:brandID'},
          auth.verify, brand.update)
  app.del({name: 'delete brand', path: 'brand/:brandID'},
          auth.verify, brand.delete)
}
