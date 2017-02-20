const endpoint = require('../services/endpoint')

const table = 'item'
const key = 'tag'

module.exports.getAll = endpoint.getAll(table)
module.exports.get = endpoint.get(table, key)
module.exports.create = endpoint.create(table, 'item created')
module.exports.update = endpoint.update(table, key)
module.exports.delete = endpoint.delete(table, key, 'item deleted')
