import type { Env } from "hono";
import type { Knex } from "knex";

// Define the main environment type for the entire Hono application, includes Variables (for c.get/c.set) and overrides the Request type
export interface AppEnv extends Env {
  Variables: {
    db: Knex; // type for the Knex instance, that stored in the context
    requestId: string; // unique request ID for logging
  };
}
