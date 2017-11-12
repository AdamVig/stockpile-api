exports.up = function (knex, Promise) {
  return knex.schema.createTable('fieldType', table => {
    table.increments('fieldTypeID').unsigned()
    table.string('fieldTypeName')
  })
    .then(() => knex('fieldType').insert([
      {fieldTypeName: 'text'},
      {fieldTypeName: 'number'},
      {fieldTypeName: 'currency'}
    ]))
    .then(() => knex.schema.table('customField', table => {
      table.integer('fieldTypeID').unsigned().notNullable().defaultTo(1).references('fieldType.fieldTypeID')
        .onUpdate('cascade').onDelete('restrict')
    }))
}

exports.down = function (knex, Promise) {
  return knex.schema.table('customField', table => {
    table.dropForeign('fieldTypeID')
    table.dropColumn('fieldTypeID')
  }).then(() => knex.schema.dropTable('fieldType'))
}
