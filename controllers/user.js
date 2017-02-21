const auth = require('./auth')
const endpoint = require('../services/endpoint')

const user = module.exports

user.getAll = endpoint.default()
user.get = endpoint.default()
user.create = endpoint.default()
user.update = endpoint.default()
user.delete = endpoint.default()

user.mount = app => {
  app.get({name: 'get all users', path: 'user'}, auth.verify, user.getAll)
  app.get({name: 'get user', path: 'user/:userID'}, auth.verify, user.get)
  app.put({name: 'create user', path: 'user'}, auth.verify, user.create)
  app.put({name: 'update user', path: 'user/:userID'}, auth.verify, user.update)
  app.del({name: 'delete user', path: 'user/userID'}, auth.verify, user.delete)
}
