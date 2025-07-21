require("dotenv").config({ path: "../.env" }); // path to  .env file

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: "pg",
    connection:
      process.env.DATABASE_URL ||
      "postgresql://user:password@localhost:5432/micro_chirp_db",
    migrations: {
      directory: "./db/migrations", // migration files for Knex
    },
    seeds: {
      directory: "./db/seeds", //for seeds (optionally)
    },
  },
  // production: { ... } //  config for production
};
