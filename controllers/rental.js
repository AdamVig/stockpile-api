const db = require('../services/db')

module.exports.getAll = (req, res, next) => {
  return db.getAll('rental', req.user.organizationID)
    .then(rentals => res.send({rentals}))
    .catch(next)
}

module.exports.get = (req, res, next) => {
  return db.get('rental', 'rentalID', req.params.rentalID,
                req.user.organizationID)
    .then(rental => res.send(rental))
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
