const auth = require('./auth')
const endpoint = require('../services/endpoint')

const organization = module.exports

organization.withoutCredentials = (req, queryBuilder) => {
  return queryBuilder
    .select('organizationID', 'name')
}

organization.get = endpoint.get('organization', 'organizationID',
                                {modify: organization.withoutCredentials})
organization.create = endpoint.create('organization')
organization.update = endpoint.update('organization', 'organizationID',
                                      {modify: organization.withoutCredentials})
organization.delete = endpoint.delete('organization', 'organizationID')

organization.mount = app => {
  /**
   * @apiDefine OrganizationResponse
   * @apiExample {json} Response Format
   * {
   *   "organizationID": 0,
   *   "name": ""
   * }
   */

  /**
   * @api {get} /organization/:organizationID Get an organization
   * @apiName GetOrganization
   * @apiGroup Organization
   *
   * @apiUse OrganizationResponse
   */
  app.get({name: 'get organization', path: 'organization/:organizationID'},
          auth.verify, organization.get)
  /**
   * @api {put} /organization Create an organization
   * @apiName CreateOrganization
   * @apiGroup Organization
   *
   * @apiParam {String} name Name of organization
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (200) {Number} id ID of created row
   */
  app.put({name: 'create organization', path: 'organization'},
          auth.verify, organization.create)
  /**
   * @api {put} /organization/:organizationID Update an organization
   * @apiName UpdateOrganization
   * @apiGroup Organization
   *
   * @apiParam {String} name Name of organization
   *
   * @apiUse OrganizationResponse
   */
  app.put({name: 'update organization', path: 'organization/:organizationID'},
          auth.verify, organization.update)
  /**
   * @api {delete} /organization/:organizationID Delete an organization
   * @apiName DeleteOrganization
   * @apiGroup Organization
   *
   * @apiSuccess (200) {String} message Descriptive message
   * @apiSuccess (204) empty No body when item was already deleted
   */
  app.del({name: 'delete organization', path: 'organization/:organizationID'},
          auth.verify, organization.delete)
}
