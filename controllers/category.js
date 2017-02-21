const endpoint = require('../services/endpoint')

const table = 'category'
const key = 'categoryID'

module.exports.getAll = endpoint.getAll(table)
module.exports.get = endpoint.get(table, key)
module.exports.create = endpoint.create(table, 'category created')
module.exports.update = endpoint.update(table, key)
module.exports.delete = endpoint.delete(table, key, 'category deleted')
