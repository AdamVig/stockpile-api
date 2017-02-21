const auth = require('./auth')
const endpoint = require('../services/endpoint')

const status = module.exports = {}

endpoint.addAllMethods(status, 'status', 'statusID')

status.mount = app => {
  app.get({name: 'get all statuses', path: 'status'}, auth.verify, status.getAll)
  app.get({name: 'get status', path: 'status/:statusID'},
          auth.verify, status.get)
  app.put({name: 'create status', path: 'status'}, auth.verify, status.create)
  app.put({name: 'update status', path: 'status/:statusID'},
          auth.verify, status.update)
  app.del({name: 'delete status', path: 'status/:statusID'},
          auth.verify, status.delete)
}
