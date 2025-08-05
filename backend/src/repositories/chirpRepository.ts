import knex from "../../src/db/index.js";
import { logger } from "../../src/utils/logger.js";

/**
 * Інтерфейс для Chirp-об'єкта, що повертається з БД
 */
export interface Chirp {
  id: string;
  user_id: number;
  content: string;
  username: string;
  created_at: Date;
}

/**
 * Інтерфейс для параметрів, необхідних для створення чирпа
 */
export interface CreateChirpData {
  user_id: number;
  content: string;
  username: string;
}

/**
 * Інтерфейс для параметрів пагінації
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/**
 * Отримати загальну кількість всіх чирпів.
 * @returns Проміс з кількістю чирпів.
 */
export async function getTotalChirps(): Promise<number> {
  try {
    const [result] = await knex("chirps").count("* as count");
    return parseInt((result?.count as string) ?? "0", 10);
  } catch (error: any) {
    logger.error("Error fetching total chirps count from DB", error, {
      context: "chirpRepository.getTotalChirps",
    });
    throw new Error("Database error fetching total chirps count.");
  }
}

/**
 * Отримати загальну кількість чирпів для конкретного користувача.
 * @param userId ID користувача.
 * @returns Проміс з кількістю чирпів.
 */
export async function getTotalChirpsByUserId(userId: number): Promise<number> {
  try {
    const [result] = await knex("chirps")
      .where("user_id", userId)
      .count("* as count");
    return parseInt((result?.count as string) ?? "0", 10);
  } catch (error: any) {
    logger.error("Error fetching user chirps count from DB", error, {
      context: "chirpRepository.getTotalChirpsByUserId",
    });
    throw new Error("Database error fetching user chirps count.");
  }
}

/**
 * Вставити новий чирп у базу даних.
 * @param data Дані для нового чирпа.
 * @returns Проміс з об'єктом створеного чирпа.
 */
export async function create(data: CreateChirpData): Promise<Chirp> {
  try {
    const [chirp] = await knex("chirps").insert(data).returning("*");
    return chirp;
  } catch (error: any) {
    logger.error("Error inserting new chirp into DB", error, {
      context: "chirpRepository.create",
      payload: data,
    });
    throw new Error("Database error during chirp creation.");
  }
}

/**
 * Отримати всі чирпи з пагінацією.
 * @param pagination Об'єкт з параметрами пагінації.
 * @returns Проміс з масивом чирпів.
 */
export async function findAll(pagination: PaginationParams): Promise<Chirp[]> {
  try {
    const allChirps = await knex("chirps")
      .join("users", "chirps.user_id", "users.id")
      .select("chirps.*", "users.username as author_username")
      .orderBy("chirps.created_at", "desc")
      .limit(pagination.limit)
      .offset(pagination.offset);
    return allChirps;
  } catch (error: any) {
    logger.error("Error fetching all chirps from DB", error, {
      context: "chirpRepository.findAll",
    });
    throw new Error("Database error retrieving chirps.");
  }
}

/**
 * Отримати чирпи конкретного користувача з пагінацією.
 * @param userId ID користувача.
 * @param pagination Об'єкт з параметрами пагінації.
 * @returns Проміс з масивом чирпів.
 */
export async function findByUserId(
  userId: number,
  pagination: PaginationParams
): Promise<Chirp[]> {
  try {
    const userChirps = await knex("chirps")
      .join("users", "chirps.user_id", "users.id")
      .select("chirps.*", "users.username")
      .where("chirps.user_id", userId)
      .orderBy("chirps.created_at", "desc")
      .limit(pagination.limit)
      .offset(pagination.offset);
    return userChirps;
  } catch (error: any) {
    logger.error("Error fetching user chirps from DB", error, {
      context: "chirpRepository.findByUserId",
    });
    throw new Error("Database error retrieving user chirps.");
  }
}
