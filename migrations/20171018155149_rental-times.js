
exports.up = function (knex, Promise) {
  return knex.schema.alterTable('rental', table => {
    table.dateTime('startDate').notNullable().alter()
    table.dateTime('endDate').notNullable().alter()
    table.dateTime('returnDate').defaultTo(null).alter()
  })
}

exports.down = function (knex, Promise) {
  return knex.schema.alterTable('rental', table => {
    table.date('startDate').notNullable().alter()
    table.date('endDate').notNullable().alter()
    table.date('returnDate').defaultTo(null).alter()
  })
}
