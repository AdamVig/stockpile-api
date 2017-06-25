const auth = require('./auth')
const endpoint = require('../services/endpoint')

const customField = module.exports
const messages = {
  conflict: 'A custom field with this name already exists',
  create: 'Created custom field',
  delete: 'Deleted custom field'
}

endpoint.addAllMethods(customField, 'customField', 'customFieldID', messages)

customField.mount = app => {
  /**
   * @apiDefine CustomFieldResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "customFieldID": 0,
   *   "organizationID": 0,
   *   "name": "",
   *   "categoryID": 0
   * }
   */

  /**
   * @api {get} /custom-field Get all custom fields
   * @apiName GetCustomFields
   * @apiGroup CustomField
   * @apiPermission User
   *
   * @apiUse Pagination
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "customFieldID": 0,
   *       "organizationID": 0,
   *       "name": "",
   *       "categoryID": 0
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all custom fields', path: 'custom-field'}, auth.verify,
    customField.getAll)
  /**
   * @api {get} /custom-field/:customFieldID Get custom field
   * @apiName GetCustomField
   * @apiGroup CustomField
   * @apiPermission User
   *
   * @apiUse CustomFieldResponse
   */
  app.get({name: 'get custom field', path: 'custom-field/:customFieldID'},
    auth.verify, customField.get)
  /**
   * @api {put} /custom-field Create a custom field
   * @apiName CreateCustomField
   * @apiGroup CustomField
   * @apiPermission User
   *
   * @apiDescription A custom field can be used to add custom data to all items
   *   (or specific categories of items) beyond the data that the application
   *   already stores. A custom field must be created at the organization level.
   *   Values of custom fields can be set with *UpdateItemCustomFieldValue*.
   *   When a custom field is created, empty rows in `itemCustomFieldValue` will
   *   be created for all items that the field applies to (based on the
   *   `categoryID` value).
   *
   * @apiParam {String{0...255}} name Name of custom field, **must be unique**
   * @apiParam {Number} [categoryID] ID of a category to associate this field
   *   with, meaning that the field will only apply to items in this category
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse CustomFieldResponse
   */
  app.put({name: 'create custom field', path: 'custom-field'}, auth.verify,
    customField.create)
  /**
   * @api {put} /custom-field/:customFieldID Update a custom field
   * @apiName UpdateCustomField
   * @apiGroup CustomField
   * @apiPermission User
   *
   * @apiParam {String{0...255}} [name] Name of custom field
   * @apiParam {Number} [categoryID] ID of a category to associate this field
   *   with, meaning that the field will only apply to items in this category
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse CustomFieldResponse
   */
  app.put({name: 'update custom field', path: 'custom-field/:customFieldID'},
    auth.verify, customField.update)
  /**
   * @api {delete} /custom-field/:customFieldID Delete a custom field
   * @apiName DeleteCustomField
   * @apiGroup CustomField
   * @apiPermission User
   *
   * @apiDescription Deleting a custom field will also delete all values
   *   associated with this field across all items in the organization.
   *
   * @apiUse EndpointDelete
   */
  app.del({name: 'delete custom field', path: 'custom-field/:customFieldID'},
    auth.verify, customField.delete)
}
