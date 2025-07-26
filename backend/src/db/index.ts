import Knex from "knex";
import knexConfig from "../knexfile.cjs";

const environment = process.env.NODE_ENV || "development";
const config = knexConfig[environment];

if (!config) {
  console.error(
    `Knex configuration for environment "${environment}" not found in knexfile.cjs.`
  );
  throw new Error(
    `Invalid Knex configuration: Environment "${environment}" is not defined.`
  );
}

const knex = Knex(config);
export default knex;
