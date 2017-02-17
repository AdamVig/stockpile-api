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
  return db.create('item', req.body)
    .then(([itemID]) => res.send({
      itemID,
      message: 'item created'
    }))
    .catch(next)
}

module.exports.update = (req, res, next) => {
  res.send({})
}

module.exports.delete = (req, res, next) => {
  return db.delete('item', 'itemID', req.params.itemID, req.user.organizationID)
    .then((rowsAffected) => {
      if (rowsAffected > 0) {
        res.send({message: 'item deleted'})
      } else {
        res.send(204)
      }
    })
    .catch(next)
}
