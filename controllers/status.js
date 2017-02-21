const endpoint = require('../services/endpoint')

const table = 'status'
const key = 'statusID'

module.exports.getAll = endpoint.getAll(table)
module.exports.get = endpoint.get(table, key)
module.exports.create = endpoint.create(table, 'status created')
module.exports.update = endpoint.update(table, key)
module.exports.delete = endpoint.delete(table, key, 'status deleted')
