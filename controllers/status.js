const auth = require('./auth')
const endpoint = require('../services/endpoint')

const table = 'status'
const key = 'statusID'

const status = module.exports = {}

status.getAll = endpoint.getAll(table)
status.get = endpoint.get(table, key)
status.create = endpoint.create(table, 'status created')
status.update = endpoint.update(table, key)
status.delete = endpoint.delete(table, key, 'status deleted')

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
