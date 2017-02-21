const auth = require('./auth')
const organization = module.exports = {}

organization.get = (req, res, next) => {
  res.send({})
}

organization.create = (req, res, next) => {
  res.send({})
}

organization.update = (req, res, next) => {
  res.send({})
}

organization.delete = (req, res, next) => {
  res.send({})
}

organization.mount = app => {
  app.get({name: 'get organization', path: 'organization/:organizationID'},
          auth.verify, organization.get)
  app.put({name: 'create organization', path: 'organization'},
          auth.verify, organization.create)
  app.put({name: 'update organization', path: 'organization/:organizationID'},
          auth.verify, organization.update)
  app.del({name: 'delete organization', path: 'organization/:organizationID'},
          auth.verify, organization.delete)
}
