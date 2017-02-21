const endpoint = require('../services/endpoint')

const main = module.exports = {}

main.mount = app => {
  app.get({name: 'main', path: '/'}, main.get)
}

main.get = endpoint.default()
