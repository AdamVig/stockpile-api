const endpoint = require('../services/endpoint')

const table = 'rental'
const key = 'rentalID'

module.exports.getAll = endpoint.getAll(table)
module.exports.get = endpoint.get(table, key)
module.exports.create = endpoint.create(table, 'rental created')
module.exports.update = endpoint.update(table, key)
module.exports.delete = endpoint.delete(table, key, 'rental deleted')
