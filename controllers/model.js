const auth = require('./auth')
const endpoint = require('../services/endpoint')

const model = module.exports

endpoint.addAllMethods(model, 'model', 'modelID')

model.mount = app => {
  app.get({name: 'get all models', path: 'model'}, auth.verify, model.getAll)
  app.get({name: 'get model', path: 'model/:modelID'}, auth.verify, model.get)
  app.put({name: 'create model', path: 'model'}, auth.verify, model.create)
  app.put({name: 'update model', path: 'model/:modelID'},
          auth.verify, model.update)
  app.del({name: 'delete model', path: 'model/:modelID'},
          auth.verify, model.delete)
}
