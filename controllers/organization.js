const auth = require('./auth')
const endpoint = require('../services/endpoint')

const messages = {
  missing: 'Organization does not exist'
}

const organization = module.exports

organization.get = endpoint.get('organization', 'organizationID', {messages})
organization.create = endpoint.create('organization', 'organizationID')
organization.update = endpoint.update('organization', 'organizationID')
organization.delete = endpoint.delete('organization', 'organizationID')

organization.mount = app => {
  /**
   * @apiDefine OrganizationResponse
   * @apiExample {json} Response Format
   * {
   *   "organizationID": 0,
   *   "name": "",
   *   "email": "",
   *   "stripeCustomerID": ""
   * }
   */

  /**
   * @api {get} /organization/:organizationID Get an organization
   * @apiName GetOrganization
   * @apiGroup Organization
   * @apiPermission User
   *
   * @apiUse OrganizationResponse
   */
  app.get({name: 'get organization', path: 'organization/:organizationID'},
    auth.verify, organization.get)
  /**
   * @api {put} /organization Create an organization
   * @apiName CreateOrganization
   * @apiGroup Organization
   * @apiPermission Public
   *
   * @apiDescription An organization is the overall entity that most other
   *   entities reside under. This endpoint is public because an organization
   *   must be created before a user can be created, so the client wouldn't have
   *   a token to send for this endpoint.
   *
   * @apiParam {String} name Name of organization
   * @apiParam {String} email Email for organization
   * @apiParam {String} [stripeCustomerID] Unique identifier of the organization's Stripe customer
   *
   * @apiUse OrganizationResponse
   */
  app.put({name: 'create organization', path: 'organization'},
    organization.create)
  /**
   * @api {put} /organization/:organizationID Update an organization
   * @apiName UpdateOrganization
   * @apiGroup Organization
   * @apiPermission Administrator
   *
   * @apiParam {String} name Name of organization
   *
   * @apiUse OrganizationResponse
   */
  app.put({name: 'update organization', path: 'organization/:organizationID'},
    auth.verify, auth.checkAdmin, organization.update)
  /**
   * @api {delete} /organization/:organizationID Delete an organization
   * @apiName DeleteOrganization
   * @apiGroup Organization
   * @apiPermission Administrator
   *
   * @apiUse EndpointDelete
   */
  app.del({name: 'delete organization', path: 'organization/:organizationID'},
    auth.verify, auth.checkAdmin, organization.delete)
}
