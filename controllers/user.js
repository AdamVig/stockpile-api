const auth = require('./auth')
const user = module.exports = {}

user.getAll = (req, res, next) => {
  res.send({})
}

user.get = (req, res, next) => {
  res.send({})
}

user.create = (req, res, next) => {
  res.send({})
}

user.update = (req, res, next) => {
  res.send({})
}

user.delete = (req, res, next) => {
  res.send({})
}

user.mount = app => {
  app.get({name: 'get all users', path: 'user'}, auth.verify, user.getAll)
  app.get({name: 'get user', path: 'user/:userID'}, auth.verify, user.get)
  app.put({name: 'create user', path: 'user'}, auth.verify, user.create)
  app.put({name: 'update user', path: 'user/:userID'}, auth.verify, user.update)
  app.del({name: 'delete user', path: 'user/userID'}, auth.verify, user.delete)
}
