const auth = require('./auth')
const endpoint = require('../services/endpoint')

const organization = module.exports

organization.get = endpoint.default()
organization.create = endpoint.default()
organization.update = endpoint.default()
organization.delete = endpoint.default()

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
