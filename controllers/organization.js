module.exports.get = (req, res, next) => {
  res.send({routePlaceholder: 'get organization'})
}

module.exports.create = (req, res, next) => {
  res.send({routePlaceholder: 'create organization'})
}

module.exports.update = (req, res, next) => {
  res.send({routePlaceholder: 'update organization'})
}

module.exports.delete = (req, res, next) => {
  res.send({routePlaceholder: 'delete organization'})
}
