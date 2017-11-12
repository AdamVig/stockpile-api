const errors = require('restify-errors')

const auth = require('./auth')
const checkSubscription = require('../services/check-subscription')
const db = require('../services/db')
const endpoint = require('../services/endpoint')

const customField = module.exports
const messages = {
  conflict: 'A custom field with this name already exists',
  create: 'Created custom field',
  delete: 'Deleted custom field'
}

customField.withFieldType = (req, queryBuilder) => {
  return queryBuilder
    .join('fieldType', 'customField.fieldTypeID', 'fieldType.fieldTypeID')
}

customField.getAll = endpoint.getAll('customField', {
  sortBy: [{column: 'customField.name', ascending: true}],
  searchColumns: ['customField.name'],
  modify: customField.withFieldType
})
customField.get = endpoint.get('customField', 'customFieldID', {modify: customField.withFieldType, messages})
customField.update = endpoint.update('customField', 'customFieldID', {resModify: customField.withFieldType, messages})
customField.create = endpoint.create('customField', 'customFieldID', {resModify: customField.withFieldType, messages})
customField.delete = endpoint.delete('customField', 'customFieldID', {messages})

// Add category name
customField.withNames = (req, queryBuilder) => {
  return queryBuilder
    // Only get custom field categories for this custom field
    .where('customFieldCategory.customFieldID', req.params.customFieldID)
    .select('customFieldCategory.*')
    // Add category
    .join('category', 'customFieldCategory.categoryID', 'category.categoryID')
    .select('category.name as categoryName')

    // Add custom field
    .join('customField', 'customField.customFieldID', 'customFieldCategory.customFieldID')
    .select('customField.name as customFieldName')
}
const categoryMessages = {
  create: 'Added category to custom field',
  createPlural: 'Added categories to custom field',
  delete: 'Removed all categories from custom field',
  missing: 'Custom field has no categories'
}
customField.getCategories = endpoint.getAll('customFieldCategory', {
  modify: customField.withNames,
  messages: categoryMessages,
  hasOrganizationID: false,
  sortBy: [{column: 'category.name', ascending: true}]
})

customField.updateCategories = (req, res, next) => {
  if (req.body && req.body.categories) {
    // Convert incoming categories to table schema
    const customFieldCategories = req.body.categories.map(category => {
      return {
        customFieldID: req.params.customFieldID,
        categoryID: category.categoryID
      }
    })

    return db.transaction(trx => {
      // Remove all existing categories for this custom field
      return trx('customFieldCategory').where('customFieldCategory.customFieldID', req.params.customFieldID).del()
        .then(() => {
          // Add all new categories
          return trx('customFieldCategory').insert(customFieldCategories)
        }).then(() => {
          // Get all categories for this field
          return trx('customFieldCategory')
            .where('customFieldCategory.customFieldID', req.params.customFieldID)
            .modify(customField.withNames.bind(null, req))
        })
    }).then((rows) => {
      let message = categoryMessages.create
      if (req.body.categories.length > 1) {
        message = categoryMessages.createPlural
      } else if (req.body.categories.length === 0) {
        message = categoryMessages.delete
      }
      res.send({
        message,
        categories: rows
      })
      return next()
    }).catch(err => {
      // Return useful error when custom field does not exist
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return next(new errors.BadRequestError('Custom field does not exist'))
      } else {
        return next(err)
      }
    })
  } else {
    return next(new errors.BadRequestError('Missing list of categories'))
  }
}

customField.mount = app => {
  /**
   * @apiDefine CustomFieldResponse
   *
   * @apiExample {json} Response Format
   * {
   *   "customFieldID": 0,
   *   "organizationID": 0,
   *   "name": "",
   *   "showTimestamp": 1,
   *   "fieldTypeID": 1,
   *   "fieldTypeName": "text"
   * }
   */

  /**
   * @api {get} /custom-field Get all custom fields
   * @apiName GetCustomFields
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse Pagination
   * @apiUse Search
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     {
   *       "customFieldID": 0,
   *       "organizationID": 0,
   *       "name": "",
   *       "showTimestamp": 1,
   *       "fieldTypeID": 1,
   *       "fieldTypeName": "text",
   *       "sortIndex": 0
   *     }
   *   ]
   * }
   */
  app.get({name: 'get all custom fields', path: 'custom-field'}, auth.verify, customField.getAll)
  /**
   * @api {get} /custom-field/:customFieldID Get custom field
   * @apiName GetCustomField
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiUse CustomFieldResponse
   */
  app.get({name: 'get custom field', path: 'custom-field/:customFieldID'}, auth.verify, customField.get)
  /**
   * @api {put} /custom-field Create a custom field
   * @apiName CreateCustomField
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 3.0.0
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
   * @apiParam {boolean} [showTimestamp=true] Whether or not to show when values of this custom field were last updated
   * @apiParam {Number=1,2,3} [fieldTypeID=1] Field type: text = 1, currency = 2, number = 3
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse CustomFieldResponse
   */
  app.put({name: 'create custom field', path: 'custom-field'}, auth.verify, checkSubscription, customField.create)
  /**
   * @api {put} /custom-field/:customFieldID Update a custom field
   * @apiName UpdateCustomField
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiParam {String{0...255}} [name] Name of custom field
   * @apiParam {boolean} [showTimestamp=true] Whether or not to show when values of this custom field were last updated
   * @apiParam {Number=1,2,3} [fieldTypeID=1] Field type: text = 1, currency = 2, number = 3
   * @apiParam {Number} [organizationID] ID of organization (automatically taken
   *   from token, but can be overridden)
   *
   * @apiUse CustomFieldResponse
   */
  app.put({name: 'update custom field', path: 'custom-field/:customFieldID'}, auth.verify, checkSubscription,
    customField.update)
  /**
   * @api {delete} /custom-field/:customFieldID Delete a custom field
   * @apiName DeleteCustomField
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiDescription Deleting a custom field will also delete all values
   *   associated with this field across all items in the organization.
   *
   * @apiUse EndpointDelete
   */
  app.del({name: 'delete custom field', path: 'custom-field/:customFieldID'}, auth.verify, checkSubscription,
    customField.delete)
  /**
   * @api {get} /custom-field/:customFieldID/category Get all categories of a custom field
   * @apiName GetCustomFieldCategories
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   "results": [
   *     {
   *       "categoryID": 0,
   *       "customFieldID": 0,
   *       "customFieldName": "",
   *       "categoryName": "",
   *       "organizationID": 0,
   *       "sortIndex": 0
   *     }
   *   ]
   * }
   */
  app.get({name: 'get custom field categories', path: 'custom-field/:customFieldID/category'}, auth.verify,
    customField.getCategories)
  /**
   * @api {put} /custom-field/:customFieldID/category Update categories of a custom field
   * @apiName UpdateCustomFieldCategories
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 3.0.0
   *
   * @apiParam {Object[]} [categories] List of category entities that this field belongs in. The custom field will only
   *   apply to items in these categories.
   * @apiParam {Number} categories.categoryID ID of category
   * @apiParam {String} [categories.name] Name of category
   * @apiParam {Number} [categories.organizationID] Organization that category belongs to
   *
   * @apiExample {json} Response Format
   * {
   *   "categories": [
   *     {
   *       "categoryID": 0,
   *       "customFieldID": 0,
   *       "categoryName": "",
   *       "customFieldName": "",
   *       "organizationID": 0
   *     }
   *   ],
   *   "message": ""
   * }
   */
  app.put({name: 'update custom field categories', path: 'custom-field/:customFieldID/category'}, auth.verify,
    checkSubscription, customField.updateCategories)
}
