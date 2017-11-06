
exports.up = function (knex, Promise) {
  return knex.schema.raw(
    'alter table `itemCustomField` add `updated` timestamp default current_timestamp on update current_timestamp'
  )
}

exports.down = function (knex, Promise) {
  return knex.schema.table('itemCustomField', table => {
    table.dropColumn('updated')
  })
}
