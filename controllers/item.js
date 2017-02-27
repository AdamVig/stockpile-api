const auth = require('./auth')
const endpoint = require('../services/endpoint')

const item = module.exports

// Join item with all of its fields
item.withFields = (queryBuilder) => {
  return queryBuilder
    .select('item.*')

  // Brand
    .leftJoin('brand', 'item.brandID', 'brand.brandID')
    .select('brand.name as brand')

  // Model
    .leftJoin('model', 'item.modelID', 'model.modelID')
    .select('model.name as model')

  // Category
    .leftJoin('category', 'item.categoryID', 'category.categoryID')
    .select('category.name as category')
}

endpoint.addAllMethods(item, 'item', 'tag')
item.getAll = endpoint.getAll('item', {modify: item.withFields})
item.get = endpoint.get('item', 'tag', {modify: item.withFields})

item.mount = app => {
  app.get({name: 'get all items', path: 'item'}, auth.verify, item.getAll)
  app.get({name: 'get item', path: 'item/:tag'}, auth.verify, item.get)
  app.put({name: 'create item', path: 'item'}, auth.verify, item.create)
  app.put({name: 'update item', path: 'item/:tag'}, auth.verify, item.update)
  app.del({name: 'delete item', path: 'item/:tag'}, auth.verify, item.delete)
}
