import Knex from "knex";
import knexConfig from "../knexfile.cjs";

// configure Knex with the development settings
const knex = Knex(knexConfig.development!);

export default knex;
