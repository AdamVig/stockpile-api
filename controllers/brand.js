const auth = require('./auth')
const endpoint = require('../services/endpoint')

const brand = module.exports

endpoint.addAllMethods(brand, 'brand', 'brandID')

brand.mount = app => {
  app.get({name: 'get all brands', path: 'brand'}, auth.verify, brand.getAll)
  app.get({name: 'get brand', path: 'brand/:brandID'}, auth.verify, brand.get)
  app.put({name: 'create brand', path: 'brand'}, auth.verify, brand.create)
  app.put({name: 'update brand', path: 'brand/:brandID'},
          auth.verify, brand.update)
  app.del({name: 'delete brand', path: 'brand/:brandID'},
          auth.verify, brand.delete)
}
