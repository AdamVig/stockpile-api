const auth = require('./auth')
const endpoint = require('../services/endpoint')

const table = 'category'
const key = 'categoryID'

const category = module.exports = {}

category.getAll = endpoint.getAll(table)
category.get = endpoint.get(table, key)
category.create = endpoint.create(table, 'category created')
category.update = endpoint.update(table, key)
category.delete = endpoint.delete(table, key, 'category deleted')

category.mount = app => {
  app.get({name: 'get all categories', path: 'category'},
          auth.verify, category.getAll)
  app.get({name: 'get category', path: 'category/:categoryID'},
          auth.verify, category.get)
  app.put({name: 'create category', path: 'category'},
          auth.verify, category.create)
  app.put({name: 'update category', path: 'category/:categoryID'},
          auth.verify, category.update)
  app.del({name: 'delete category', path: 'category/:categoryID'},
          auth.verify, category.delete)
}
