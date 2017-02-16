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
  app.head({name: 'verify', path: '/auth/verify'}, auth.verify, auth.checkUser)

  // Item
  app.get({name: 'get all items', path: '/item'}, auth.verify, item.getAll)
  app.get({name: 'get item', path: '/item/:itemID'}, auth.verify, item.get)
  app.put({name: 'create item', path: '/item'}, auth.verify, item.create)
  app.put({name: 'update item', path: '/item/:itemID'}, auth.verify, item.update)
  app.del({name: 'delete item', path: '/item/:itemID'}, auth.verify, item.delete)

  // Organization
  app.get({name: 'get organization', path: '/organization/:organizationID'},
          auth.verify, organization.get)
  app.put({name: 'create organization', path: '/organization'},
          auth.verify, organization.create)
  app.put({name: 'update organization', path: '/organization/:organizationID'},
          auth.verify, organization.update)
  app.del({name: 'delete organization', path: '/organization/:organizationID'},
          auth.verify, organization.delete)

  // Rental
  app.get({name: 'get all rentals', path: '/rental'}, auth.verify, rental.getAll)
  app.get({name: 'get rental', path: '/rental/:rentalID'},
          auth.verify, rental.get)
  app.put({name: 'create rental', path: '/rental'}, auth.verify, rental.create)
  app.put({name: 'update rental', path: '/rental/:rentalID'},
          auth.verify, rental.update)
  app.del({name: 'delete rental', path: '/rental/:rentalID'},
          auth.verify, rental.delete)

  // User
  app.get({name: 'get all users', path: '/user'}, auth.verify, user.getAll)
  app.get({name: 'get user', path: '/user/:userID'}, auth.verify, user.get)
  app.put({name: 'create user', path: '/user'}, auth.verify, user.create)
  app.put({name: 'update user', path: '/user/:userID'}, auth.verify, user.update)
  app.del({name: 'delete user', path: '/user/userID'}, auth.verify, user.delete)
}
