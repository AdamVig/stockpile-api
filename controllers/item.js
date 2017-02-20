const endpoint = require('../services/endpoint')

const table = 'item'
const primaryKey = 'itemID'

module.exports.getAll = endpoint.getAll(table)
module.exports.get = endpoint.get(table, primaryKey)
module.exports.create = endpoint.create(table, 'item created')
module.exports.update = endpoint.update(table)
module.exports.delete = endpoint.delete(table, primaryKey, 'item deleted')
