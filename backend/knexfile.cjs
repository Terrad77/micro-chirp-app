const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") }); // path to  .env file
// console.log("DATABASE_URL from .env:", process.env.DATABASE_URL); // Тимчасовий лог для дебагу

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
const config = {
  development: {
    client: "pg",
    connection:
      process.env.DATABASE_URL ||
      "postgresql://user:password@localhost:5432/micro_chirp_db",
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
    },
  },
  // production:
  production: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
    },
  },
};

module.exports = config;
