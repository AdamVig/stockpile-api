
exports.up = function (knex, Promise) {
  return knex.schema.table('rental', table => {
    table.boolean('isReservation').notNullable().defaultTo(false)
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.table('rental', table => {
    table.dropColumn('isReservation')
  })
}
