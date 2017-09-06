const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const endpoint = require('../services/endpoint')

const messages = {
  missing: 'Organization does not exist'
}

const organization = module.exports

organization.get = endpoint.get('organization', 'organizationID', {messages})
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
  app.get({name: 'get organization', path: 'organization/:organizationID'}, auth.verify, organization.get)
  /**
   * @api {put} /organization/:organizationID Update an organization
   * @apiName UpdateOrganization
   * @apiGroup Organization
   * @apiPermission Administrator
   *
   * @apiParam {String} name Name of organization
   *
   * @apiUse OrganizationResponse
   * @apiUse InvalidSubscriptionResponse
   */
  app.put({name: 'update organization', path: 'organization/:organizationID'}, auth.verify, auth.checkAdmin,
    checkSubscription, organization.update)
  /**
   * @api {delete} /organization/:organizationID Delete an organization
   * @apiName DeleteOrganization
   * @apiGroup Organization
   * @apiPermission Administrator
   *
   * @apiUse EndpointDelete
   * @apiUse InvalidSubscriptionResponse
   */
  app.del({name: 'delete organization', path: 'organization/:organizationID'}, auth.verify, auth.checkAdmin,
    checkSubscription, organization.delete)
}
