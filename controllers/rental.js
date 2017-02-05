module.exports.getAll = (req, res, next) => {
  res.send({routePlaceholder: 'get all rentals'})
}

module.exports.get = (req, res, next) => {
  res.send({routePlaceholder: 'get rental'})
}

module.exports.create = (req, res, next) => {
  res.send({routePlaceholder: 'create rental'})
}

module.exports.update = (req, res, next) => {
  res.send({routePlaceholder: 'update rental'})
}

module.exports.delete = (req, res, next) => {
  res.send({routePlaceholder: 'delete rental'})
}
