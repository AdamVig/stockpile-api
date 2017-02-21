const auth = require('./auth')
const endpoint = require('../services/endpoint')

const category = module.exports = {}

endpoint.addAllMethods(category, 'category', 'categoryID')

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
