exports.up = function (knex) {
  return knex.schema.alterTable("chirps", function (table) {
    table.string("username").notNullable().defaultTo("anonymous"); // add table 'username'
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("chirps", function (table) {
    table.dropColumn("username");
  });
};
