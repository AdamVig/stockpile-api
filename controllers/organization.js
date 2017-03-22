const auth = require('./auth')
const endpoint = require('../services/endpoint')

const organization = module.exports

organization.get = endpoint.default()
organization.create = endpoint.default()
organization.update = endpoint.default()
organization.delete = endpoint.default()

organization.mount = app => {
  /**
   * @api {get} /organization/:organizationID Get an organization
   * @apiName GetOrganization
   * @apiGroup Organization
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.get({name: 'get organization', path: 'organization/:organizationID'},
          auth.verify, organization.get)
  /**
   * @api {put} /organization Create an organization
   * @apiName CreateOrganization
   * @apiGroup Organization
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.put({name: 'create organization', path: 'organization'},
          auth.verify, organization.create)
  /**
   * @api {put} /organization/:organizationID Update an organization
   * @apiName UpdateOrganization
   * @apiGroup Organization
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.put({name: 'update organization', path: 'organization/:organizationID'},
          auth.verify, organization.update)
  /**
   * @api {get} /organization/:organizationID Delete an organization
   * @apiName DeleteOrganization
   * @apiGroup Organization
   *
   * @apiDescription Not implemented.
   *
   * @apiSuccess (200) empty No response body
   */
  app.del({name: 'delete organization', path: 'organization/:organizationID'},
          auth.verify, organization.delete)
}
