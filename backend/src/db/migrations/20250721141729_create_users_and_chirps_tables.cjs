/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("users", function (table) {
      table.increments("id").primary();
      table.string("username", 255).notNullable().unique();
      table.string("password_hash", 255).notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("chirps", function (table) {
      table.increments("id").primary();
      table.integer("user_id").unsigned().notNullable(); // unsigned для положительных чисел
      table.text("content").notNullable();
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Зовннішний ключ: chirps.user_id посилається на users.id
      table
        .foreign("user_id")
        .references("id")
        .inTable("users")
        .onDelete("CASCADE"); // при видаленні user, видаляти його chirps
    })
    .then(() => {
      // Опціонально: створюємо індекси для прискорення запитів
      return Promise.all([
        knex.raw(
          "CREATE INDEX idx_chirps_created_at ON chirps (created_at DESC);"
        ),
        knex.raw("CREATE INDEX idx_chirps_user_id ON chirps (user_id);"),
      ]);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  // Порядок важливий: спочатку видаляємо chirps, бо вони залежать від users
  return knex.schema
    .raw("DROP INDEX IF EXISTS idx_chirps_user_id;")
    .raw("DROP INDEX IF EXISTS idx_chirps_created_at;")
    .dropTableIfExists("chirps")
    .dropTableIfExists("users");
};
