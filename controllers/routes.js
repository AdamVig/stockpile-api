const auth = require('./auth')
const item = require('./item')
const main = require('./main')
const organization = require('./organization')
const rental = require('./rental')
const user = require('./user')

// Define endpoints on application
module.exports = app => {
  // Main
  app.get({name: 'main', path: '/'}, main.get)

  // Authentication
  app.post({name: 'authenticate', path: '/auth'}, auth.authenticate)
  app.post({name: 'register', path: '/auth/register'}, auth.register)
  app.head({name: 'verify', path: '/auth/verify'}, auth.verify, auth.checkToken)

  // Item
  app.get({name: 'get all items', path: '/item'}, item.getAll)
  app.get({name: 'get item', path: '/item/:itemID'}, item.get)
  app.put({name: 'create item', path: '/item'}, item.create)
  app.put({name: 'update item', path: '/item/:itemID'}, item.update)
  app.del({name: 'delete item', path: '/item/:itemID'}, item.delete)

  // Organization
  app.get({name: 'get organization', path: '/organization/:organizationID'},
          organization.get)
  app.put({name: 'create organization', path: '/organization'},
          organization.create)
  app.put({name: 'update organization', path: '/organization/:organizationID'},
          organization.update)
  app.del({name: 'delete organization', path: '/organization/:organizationID'},
          organization.delete)

  // Rental
  app.get({name: 'get all rentals', path: '/rental'}, rental.getAll)
  app.get({name: 'get rental', path: '/rental/:rentalID'}, rental.get)
  app.put({name: 'create rental', path: '/rental'}, rental.create)
  app.put({name: 'update rental', path: '/rental/:rentalID'}, rental.update)
  app.del({name: 'delete rental', path: '/rental/:rentalID'}, rental.delete)

  // User
  app.get({name: 'get all users', path: '/user'}, user.getAll)
  app.get({name: 'get user', path: '/user/:userID'}, user.get)
  app.put({name: 'create user', path: '/user'}, user.create)
  app.put({name: 'update user', path: '/user/:userID'}, user.update)
  app.del({name: 'delete user', path: '/user/userID'}, user.delete)
}
