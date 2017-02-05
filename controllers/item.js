module.exports.getAll = (req, res, next) => {
  res.send({routePlaceholder: 'get all items'})
}

module.exports.get = (req, res, next) => {
  res.send({routePlaceholder: 'get item'})
}

module.exports.create = (req, res, next) => {
  res.send({routePlaceholder: 'create item'})
}

module.exports.update = (req, res, next) => {
  res.send({routePlaceholder: 'update item'})
}

module.exports.delete = (req, res, next) => {
  res.send({routePlaceholder: 'delete item'})
}
