import type { Knex } from "knex";

export interface AppEnv {
  Bindings: {};
  Variables: {
    db: Knex; // type for the Knex instance, that stored in the context
    requestId: string; // unique request ID for logging
    userId: number;
    username: string;
  };
}
