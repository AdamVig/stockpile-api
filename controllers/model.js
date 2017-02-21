const auth = require('./auth')
const endpoint = require('../services/endpoint')

const table = 'model'
const key = 'modelID'

const model = module.exports = {}

model.getAll = endpoint.getAll(table)
model.get = endpoint.get(table, key)
model.create = endpoint.create(table, 'model created')
model.update = endpoint.update(table, key)
model.delete = endpoint.delete(table, key, 'model deleted')

model.mount = app => {
  app.get({name: 'get all models', path: 'model'}, auth.verify, model.getAll)
  app.get({name: 'get model', path: 'model/:modelID'}, auth.verify, model.get)
  app.put({name: 'create model', path: 'model'}, auth.verify, model.create)
  app.put({name: 'update model', path: 'model/:modelID'},
          auth.verify, model.update)
  app.del({name: 'delete model', path: 'model/:modelID'},
          auth.verify, model.delete)
}
