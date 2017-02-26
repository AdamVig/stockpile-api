const auth = require('./auth')
const brand = require('./brand')
const category = require('./category')
const item = require('./item')
const main = require('./main')
const model = require('./model')
const organization = require('./organization')
const rental = require('./rental')
const user = require('./user')

// Define endpoints on application
module.exports = app => {
  auth.mount(app)
  brand.mount(app)
  category.mount(app)
  item.mount(app)
  main.mount(app)
  model.mount(app)
  organization.mount(app)
  rental.mount(app)
  user.mount(app)
}
