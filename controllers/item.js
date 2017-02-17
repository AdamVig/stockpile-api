const db = require('../services/db')

module.exports.getAll = (req, res, next) => {
  res.send({})
}

module.exports.get = (req, res, next) => {
  res.send({})
}

module.exports.create = (req, res, next) => {
  res.send({})
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
