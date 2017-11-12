
exports.up = function (knex, Promise) {
  return knex.schema.table('customField', table => {
    table.boolean('showTimestamp').notNullable().defaultTo(true)
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.table('customField', table => {
    table.dropColumn('showTimestamp')
  })
}
