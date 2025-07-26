import Knex from "knex"; // Імпортуємо Knex
import knexConfig from "../knexfile.cjs"; // Імпортуємо конфігурацію Knexfile

// Визначаємо середовище (development або production)
const environment = process.env.NODE_ENV || "development";
const config = knexConfig[environment];

// перевірка, щоб переконатися, що 'config' не є 'undefined'
if (!config) {
  console.error(
    `Knex configuration for environment "${environment}" not found in knexfile.cjs.`
  );
  // Це зупинить виконання програми, якщо конфігурація відсутня, що є кращим, ніж використання undefined
  throw new Error(
    `Invalid Knex configuration: Environment "${environment}" is not defined.`
  );
}

// Ініціалізуємо Knex
const knex = Knex(config);

// Експортуємо ініціалізований Knex-інстанс
export default knex;
