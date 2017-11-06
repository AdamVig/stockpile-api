const auth = require('./auth')
const brand = require('./brand')
const category = require('./category')
const customField = require('./custom-field')
const externalRenter = require('./external-renter')
const item = require('./item')
const kit = require('./kit')
const main = require('./main')
const model = require('./model')
const organization = require('./organization')
const rental = require('./rental')
const rentalItem = require('./rental-item')
const subscription = require('./subscription')
const user = require('./user')

// Define endpoints on application
module.exports = app => {
  auth.mount(app)
  brand.mount(app)
  category.mount(app)
  customField.mount(app)
  externalRenter.mount(app)
  item.mount(app)
  kit.mount(app)
  main.mount(app)
  model.mount(app)
  organization.mount(app)
  rental.mount(app)
  rentalItem.mount(app)
  subscription.mount(app)
  user.mount(app)

  // Dynamically assign a function name to each route handler so it shows up in logs correctly
  for (const routeName of Object.keys(app.routes)) {
    const routeMiddleware = app.routes[routeName]
    // Assumes that route handler is always the last in the middleware chain
    const routeHandler = routeMiddleware[routeMiddleware.length - 1]
    Object.defineProperty(routeHandler, 'name', {value: routeName})
  }
}
