const db = require('../services/db')

module.exports.getAll = (req, res, next) => {
  return db.getAll('item', req.user.organizationID)
    .then(items => res.send({items}))
    .catch(next)
}

module.exports.get = (req, res, next) => {
  return db.get('item', 'itemID', req.params.itemID, req.user.organizationID)
    .then(item => res.send(item))
    .catch(next)
}

module.exports.create = (req, res, next) => {
  res.send({})
}

module.exports.update = (req, res, next) => {
  res.send({})
}

module.exports.delete = (req, res, next) => {
  res.send({})
}
