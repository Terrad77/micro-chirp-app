const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") }); // path to  .env file
console.log("DATABASE_URL from .env:", process.env.DATABASE_URL); // for debugging

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
      directory: "./db/migrations",
    },
    seeds: {
      directory: "./db/seeds",
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
    },
  },
  // production:
  production: {
    client: "pg",
    connection: {
      connectionString: process.env.DATABASE_URL,

      ssl: {
        rejectUnauthorized: false,
      },
    },

    migrations: {
      directory: "./db/migrations",
    },
    seeds: {
      directory: "./db/seeds",
    },
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
    },
  },
};

module.exports = config;
