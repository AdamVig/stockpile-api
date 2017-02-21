const endpoint = require('../services/endpoint')

const table = 'model'
const key = 'modelID'

module.exports.getAll = endpoint.getAll(table)
module.exports.get = endpoint.get(table, key)
module.exports.create = endpoint.create(table, 'model created')
module.exports.update = endpoint.update(table, key)
module.exports.delete = endpoint.delete(table, key, 'model deleted')
