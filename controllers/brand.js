const endpoint = require('../services/endpoint')

const table = 'brand'
const key = 'brandID'

module.exports.getAll = endpoint.getAll(table)
module.exports.get = endpoint.get(table, key)
module.exports.create = endpoint.create(table, 'brand created')
module.exports.update = endpoint.update(table, key)
module.exports.delete = endpoint.delete(table, key, 'brand deleted')
