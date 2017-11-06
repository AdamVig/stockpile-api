const oldRentalNoConflictTrigger = `if exists (
  select * from rental
    -- Get only active rentals
    where returnDate is null
    -- Compare against only rentals for current item
    and barcode = new.barcode
    -- Do not compare against current rental (would be a conflict)
    and rentalID != new.rentalID
    -- Get only rentals for the current organization
    and organizationID = new.organizationID
    and (

      (
        new.startDate between startDate and endDate
        or new.endDate between startDate and endDate
      )
      or

      (
        new.startDate <= startDate
        and new.endDate >= endDate
      )
    )
) then
  SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "Rental dates conflict with another rental";
end if`

const rentalNoConflictTrigger = ` on rentalItem for each row begin
  -- Get rental specified by this rentalItem
  set @thisRentalStart = (select start from rental where rental.rentalID = new.rentalID);
  set @thisRentalEnd = (select end from rental where rental.rentalID = new.rentalID);

  if exists (
    -- Compare this rental's time span to every other rental for the same item
    select * from rentalItem
      join rental using(rentalID)
      -- Get only active rentals
      where rentalItem.returned is null
        -- Compare against only rentals for current item
        and rentalItem.barcode = new.barcode
        and (
          (
            @thisRentalStart between rental.start and rental.end
            or @thisRentalEnd between rental.start and rental.end
          )
          or

          (
            @thisRentalStart <= rental.start
            and @thisRentalEnd >= rental.end
          )
        )
  ) then
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = "Rental dates conflict with an existing rental";
  end if;
end`

exports.up = function (knex, Promise) {
  return knex.schema.createTable('rentalItem', table => {
    table.integer('rentalID').references('rental.rentalID').onUpdate('cascade').onDelete('cascade')
    table.string('barcode', 255)
    table.dateTime('returned')
    table.unique(['rentalID', 'barcode'])
  })
    .then(() => knex.schema.raw(
      'alter table rentalItem modify barcode varchar(255) character set ascii collate ascii_general_ci'
    ))
    .then(() => knex.schema.table('rentalItem', table => {
      table.foreign('barcode').references('item.barcode').onUpdate('cascade').onDelete('cascade')
    }))
    .then(() => knex('rental'))
    .then((rentals) => {
      const rentalItems = rentals.map(rental => ({
        rentalID: rental.rentalID,
        barcode: rental.barcode,
        returned: rental.returnDate
      }))
      return knex('rentalItem').insert(rentalItems)
    })
    .then(() => knex.schema.table('rental', table => {
      table.dropForeign('barcode', 'rental_ibfk_5')
      table.dropColumn('returnDate')
      table.dropColumn('barcode')

      table.renameColumn('startDate', 'start')
      table.renameColumn('endDate', 'end')
    }))
    .then(() => knex.schema.raw('drop trigger if exists rentalNoConflictBeforeUpdate'))
    .then(() => knex.schema.raw('drop trigger if exists rentalNoConflictBeforeInsert'))
    .then(() => knex.schema.raw('create trigger rentalNoConflictBeforeInsert before insert' + rentalNoConflictTrigger))
    .then(() => knex.schema.raw('create trigger rentalNoConflictBeforeUpdate before update' + rentalNoConflictTrigger))
    .then(() => knex.schema.raw('drop trigger if exists rentalStartDateIsPresentInsert'))
    .then(() => knex.schema.raw('drop trigger if exists rentalEndDateAfterStartDateInsert'))
    .then(() => knex.schema.raw('drop trigger if exists rentalEndDateAfterStartDateUpdate'))
    .then(() => knex.schema.raw(
      'create trigger rentalStartDateIsPresentInsert before update on rental for each row ' +
      'call validateRentalStartDatePresent(new.start)'
    )).then(() => knex.schema.raw(
      'create trigger rentalEndDateAfterStartDateInsert before update on rental for each row ' +
      'call validateRentalEndDateAfterStartDate(new.start, new.end)'
    )).then(() => knex.schema.raw(
      'create trigger rentalEndDateAfterStartDateUpdate before update on rental for each row ' +
      'call validateRentalEndDateAfterStartDate(new.start, new.end)'
    ))
}

exports.down = function (knex, Promise) {
  return knex.schema.dropTable('rentalItem')
    .then(() => knex.schema.table('rental', table => {
      table.string('barcode', 255).references('item.barcode').onUpdate('cascade').onDelete('cascade')
      table.dateTime('returnDate')

      table.renameColumn('start', 'startDate')
      table.renameColumn('end', 'endDate')
    }))
    .then(() => knex('rentalItem'))
    .then((rentalItems) => {
      // Convert to legacy column names
      rentalItems = rentalItems.map(rentalItem => {
        rentalItem.returnDate = rentalItem.return
        delete rentalItem.return
        return rentalItem
      })
      // Add an arbitrary item from each rental back to the rental table (will result in data loss)
      return knex('rental').update(rentalItems)
    })
    .then(() => knex.schema.raw('drop trigger if exists rentalNoConflictBeforeUpdate'))
    .then(() => knex.schema.raw('drop trigger if exists rentalNoConflictBeforeInsert'))
    .then(() => knex.schema.raw(
      'create trigger rentalNoConflictBeforeUpdate before insert on rental for each row ' + oldRentalNoConflictTrigger
    )).then(() => knex.schema.raw(
      'create trigger rentalNoConflictBeforeUpdate before update on rental for each row ' + oldRentalNoConflictTrigger
    ))
    .then(() => knex.schema.raw('drop trigger if exists rentalStartDateIsPresentInsert'))
    .then(() => knex.schema.raw('drop trigger if exists rentalEndDateAfterStartDateInsert'))
    .then(() => knex.schema.raw('drop trigger if exists rentalEndDateAfterStartDateUpdate'))
    .then(() => knex.schema.raw(
      'create trigger rentalNoConflictBeforeUpdate before insert on rentalItem for each row ' + rentalNoConflictTrigger
    )).then(() => knex.schema.raw(
      'create trigger rentalStartDateIsPresentInsert before update on rental for each row ' +
      'call validateRentalStartDatePresent(new.startDate)'
    )).then(() => knex.schema.raw(
      'create trigger rentalEndDateAfterStartDateInsert before update on rental for each row ' +
      'call validateRentalEndDateAfterStartDate(new.startDate, new.endDate)'
    )).then(() => knex.schema.raw(
      'create trigger rentalEndDateAfterStartDateUpdate before update on rental for each row ' +
      'call validateRentalEndDateAfterStartDate(new.startDate, new.endDate)'
    ))
}
