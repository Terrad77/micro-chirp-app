import type { Knex } from "knex";
import KnexConstructor from "knex";

let knexInstance: Knex | null = null; // save Knex instance after initialization

export function getKnexInstance(): Knex {
  // If Knex instance is not initialized yet, create it
  if (!knexInstance) {
    // Knex configuration.
    // The process.env.DATABASE_URL variable will be available,
    // because we call getKnexInstance() AFTER dotenv.config() in server.ts
    const knexConfig = {
      client: "pg", // PostgreSQL
      connection: process.env.DATABASE_URL, // Get from ENV
      migrations: {
        tableName: "knex_migrations",
        directory: "./src/db/migrations",
      },
      seeds: {
        directory: "./src/db/seeds",
      },
    };

    // checking existence of DATABASE_URL (important for production)
    if (!knexConfig.connection) {
      console.error("DATABASE_URL environment variable is not set!");
      throw new Error("Database URL is not configured.");
    }

    // initalizing Knex and saving instance
    knexInstance = KnexConstructor(knexConfig);
  }

  // Returning existing or newly created Knex instance
  return knexInstance;
}
