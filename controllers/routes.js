const auth = require('./auth')
const brand = require('./brand')
const category = require('./category')
const item = require('./item')
const main = require('./main')
const model = require('./model')
const organization = require('./organization')
const rental = require('./rental')
const status = require('./status')
const user = require('./user')

// Define endpoints on application
module.exports = app => {
  // Main
  app.get({name: 'main', path: '/'}, main.get)

  // Authentication
  app.post({name: 'authenticate', path: 'auth'}, auth.authenticate)
  app.post({name: 'register', path: 'auth/register'}, auth.register)
  app.head({name: 'verify', path: 'auth/verify'}, auth.verify, auth.checkUser)

  // Brand
  app.get({name: 'get all brands', path: 'brand'}, auth.verify, brand.getAll)
  app.get({name: 'get brand', path: 'brand/:brandID'}, auth.verify, brand.get)
  app.put({name: 'create brand', path: 'brand'}, auth.verify, brand.create)
  app.put({name: 'update brand', path: 'brand/:brandID'},
          auth.verify, brand.update)
  app.del({name: 'delete brand', path: 'brand/:brandID'},
          auth.verify, brand.delete)

  // Category
  app.get({name: 'get all categories', path: 'category'},
          auth.verify, category.getAll)
  app.get({name: 'get category', path: 'category/:categoryID'},
          auth.verify, category.get)
  app.put({name: 'create category', path: 'category'},
          auth.verify, category.create)
  app.put({name: 'update category', path: 'category/:categoryID'},
          auth.verify, category.update)
  app.del({name: 'delete category', path: 'category/:categoryID'},
          auth.verify, category.delete)

  // Item
  app.get({name: 'get all items', path: 'item'}, auth.verify, item.getAll)
  app.get({name: 'get item', path: 'item/:tag'}, auth.verify, item.get)
  app.put({name: 'create item', path: 'item'}, auth.verify, item.create)
  app.put({name: 'update item', path: 'item/:tag'}, auth.verify, item.update)
  app.del({name: 'delete item', path: 'item/:tag'}, auth.verify, item.delete)

  // Model
  app.get({name: 'get all models', path: 'model'}, auth.verify, model.getAll)
  app.get({name: 'get model', path: 'model/:modelID'}, auth.verify, model.get)
  app.put({name: 'create model', path: 'model'}, auth.verify, model.create)
  app.put({name: 'update model', path: 'model/:modelID'},
          auth.verify, model.update)
  app.del({name: 'delete model', path: 'model/:modelID'},
          auth.verify, model.delete)

  // Organization
  app.get({name: 'get organization', path: 'organization/:organizationID'},
          auth.verify, organization.get)
  app.put({name: 'create organization', path: 'organization'},
          auth.verify, organization.create)
  app.put({name: 'update organization', path: 'organization/:organizationID'},
          auth.verify, organization.update)
  app.del({name: 'delete organization', path: 'organization/:organizationID'},
          auth.verify, organization.delete)

  // Rental
  app.get({name: 'get all rentals', path: 'rental'}, auth.verify, rental.getAll)
  app.get({name: 'get rental', path: 'rental/:rentalID'},
          auth.verify, rental.get)
  app.put({name: 'create rental', path: 'rental'}, auth.verify, rental.create)
  app.put({name: 'update rental', path: 'rental/:rentalID'},
          auth.verify, rental.update)
  app.del({name: 'delete rental', path: 'rental/:rentalID'},
          auth.verify, rental.delete)

  // Status
  app.get({name: 'get all statuses', path: 'status'}, auth.verify, status.getAll)
  app.get({name: 'get status', path: 'status/:statusID'},
          auth.verify, status.get)
  app.put({name: 'create status', path: 'status'}, auth.verify, status.create)
  app.put({name: 'update status', path: 'status/:statusID'},
          auth.verify, status.update)
  app.del({name: 'delete status', path: 'status/:statusID'},
          auth.verify, status.delete)

  // User
  app.get({name: 'get all users', path: 'user'}, auth.verify, user.getAll)
  app.get({name: 'get user', path: 'user/:userID'}, auth.verify, user.get)
  app.put({name: 'create user', path: 'user'}, auth.verify, user.create)
  app.put({name: 'update user', path: 'user/:userID'}, auth.verify, user.update)
  app.del({name: 'delete user', path: 'user/userID'}, auth.verify, user.delete)
}
