const restify = require('restify')

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

endpoint.addAllMethods(customField, 'customField', 'customFieldID', messages)

// Add category name
customField.withCategoryName = (req, queryBuilder) => {
  return queryBuilder
    // Only get custom field categories for this custom field
    .where('customFieldID', req.params.customFieldID)
    .join('category', 'customFieldCategory.categoryID', 'category.categoryID')
}
const categoryMessages = {
  create: 'Added category to custom field',
  createPlural: 'Added categories to custom field',
  missing: 'Custom field has no categories'
}
customField.getCategories = endpoint.getAll('customFieldCategory', {
  modify: customField.withCategoryName,
  messages: categoryMessages,
  hasOrganizationID: false
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
      return trx('customFieldCategory').where('customFieldID', req.params.customFieldID).del()
        .then(() => {
          // Add all new categories
          return trx('customFieldCategory').insert(customFieldCategories)
        }).then(() => {
          // Get all categories for this field
          return trx('customFieldCategory')
            .where('customFieldID', req.params.customFieldID)
            .modify(customField.withCategoryName.bind(null, req))
        })
    }).then((rows) => {
      let message = categoryMessages.create
      if (req.body.categories.length > 1) {
        message = categoryMessages.createPlural
      }
      res.send({
        message,
        categories: rows
      })
      return next()
    }).catch(err => {
      // Return useful error when custom field does not exist
      if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return next(new restify.BadRequestError('Custom field does not exist'))
      } else {
        return next(err)
      }
    })
  } else {
    return next(new restify.BadRequestError('Missing list of categories'))
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
   *   "name": ""
   * }
   */

  /**
   * @api {get} /custom-field Get all custom fields
   * @apiName GetCustomFields
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 2.0.0
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
  app.get({name: 'get all custom fields', path: 'custom-field'}, auth.verify, customField.getAll)
  /**
   * @api {get} /custom-field/:customFieldID Get custom field
   * @apiName GetCustomField
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 2.0.0
   *
   * @apiUse CustomFieldResponse
   */
  app.get({name: 'get custom field', path: 'custom-field/:customFieldID'}, auth.verify, customField.get)
  /**
   * @api {put} /custom-field Create a custom field
   * @apiName CreateCustomField
   * @apiGroup CustomField
   * @apiPermission User
   * @apiVersion 2.0.0
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
   * @apiVersion 2.0.0
   *
   * @apiParam {String{0...255}} [name] Name of custom field
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
   * @apiVersion 2.0.0
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
   * @apiVersion 2.0.0
   *
   * @apiExample {json} Response Format
   * {
   *   results: [
   *     {
   *       "categoryID": 0,
   *       "customFieldID": 0,
   *       "name": "",
   *       "organizationID": 0
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
   * @apiVersion 2.0.0
   *
   * @apiParam {Object[]} [categories] List of category entities that this field belongs in. The field will only apply
   *   to items in this category
   * @apiParam {Number} categories.categoryID ID of category
   * @apiParam {String} categories.name Name of category
   * @apiParam {Number} categories.organizationID Organization that category belongs to
   *
   * @apiExample {json} Response Format
   * {
   *   "categories": [
   *     "categoryID": 0,
   *     "customFieldID": 0,
   *     "name": "",
   *     "organizationID": 0
   *   ],
   *   "message": ""
   * }
   */
  app.put({name: 'update custom field categories', path: 'custom-field/:customFieldID/category'}, auth.verify,
    checkSubscription, customField.updateCategories)
}
