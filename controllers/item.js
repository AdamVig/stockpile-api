const auth = require('./auth')
const endpoint = require('../services/endpoint')
const filterQuery = require('../services/filter-query')

const item = module.exports

item.withFieldsAndFilters = (req, queryBuilder) => {
  queryBuilder
    .select('item.*')

  // Model
    .leftJoin('model', 'item.modelID', 'model.modelID')
    .select('model.name as model')

  // Brand
    .leftJoin('brand', 'model.brandID', 'brand.brandID')
    .select('brand.name as brand')

  // Category
    .leftJoin('category', 'item.categoryID', 'category.categoryID')
    .select('category.name as category')

  // Mapping between query param fields and database query column names
  const filterParams = {
    brandID: 'brand.brandID',
    modelID: 'model.modelID',
    categoryID: 'category.categoryID'
  }

  // Add filters to query
  queryBuilder.modify(filterQuery(req, filterParams))

  return queryBuilder
}

endpoint.addAllMethods(item, 'item', 'tag')
item.getAll = endpoint.getAll('item', {modify: item.withFieldsAndFilters})
item.get = endpoint.get('item', 'tag', {modify: item.withFieldsAndFilters})

item.mount = app => {
  app.get({name: 'get all items', path: 'item'}, auth.verify, item.getAll)
  app.get({name: 'get item', path: 'item/:tag'}, auth.verify, item.get)
  app.put({name: 'create item', path: 'item'}, auth.verify, item.create)
  app.put({name: 'update item', path: 'item/:tag'}, auth.verify, item.update)
  app.del({name: 'delete item', path: 'item/:tag'}, auth.verify, item.delete)
}
