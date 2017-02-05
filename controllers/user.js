module.exports.getAll = (req, res, next) => {
  res.send({routePlaceholder: 'get all users'})
}

module.exports.get = (req, res, next) => {
  res.send({routePlaceholder: 'get user'})
}

module.exports.create = (req, res, next) => {
  res.send({routePlaceholder: 'create user'})
}

module.exports.update = (req, res, next) => {
  res.send({routePlaceholder: 'update user'})
}

module.exports.delete = (req, res, next) => {
  res.send({routePlaceholder: 'delete user'})
}
