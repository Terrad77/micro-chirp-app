import { z } from "zod";
import * as chirpRepository from "../repositories/chirpRepository.js";
import { logger } from "../utils/logger.js";

/**
 * Схема валідації для створення чирпа
 */
const createChirpSchema = z.object({
  content: z.string().min(1).max(280),
});

/**
 * Схема валідації для параметрів пагінації
 */
const paginationSchema = z.object({
  page: z.preprocess((val) => {
    if (val === undefined || val === null || String(val).trim() === "") {
      return undefined;
    }
    const num = parseInt(String(val), 10);
    return isNaN(num) ? undefined : num;
  }, z.number().int().positive().default(1)),
  limit: z.preprocess((val) => {
    if (val === undefined || val === null || String(val).trim() === "") {
      return undefined;
    }
    const num = parseInt(String(val), 10);
    return isNaN(num) ? undefined : num;
  }, z.number().int().positive().max(100).default(20)),
});

/**
 * Створити новий чирп.
 * @param content Вміст чирпа.
 * @param userId ID користувача.
 * @param username Ім'я користувача.
 * @returns Проміс з об'єктом створеного чирпа.
 */
export async function createChirp(
  content: string,
  userId: number,
  username: string,
  requestId: string
) {
  // Валідація даних
  const result = createChirpSchema.safeParse({ content });

  if (!result.success) {
    logger.warn("Validation error during chirp creation", {
      context: "chirpService.createChirp",
      requestId,
      userId,
      errors: result.error.errors,
    });
    throw new Error(
      JSON.stringify({
        message: "Validation error",
        errors: result.error.errors,
      })
    );
  }

  try {
    const chirp = await chirpRepository.create({
      user_id: userId,
      content,
      username,
    });
    return chirp;
  } catch (error: any) {
    logger.error("Service error during chirp creation", error, {
      context: "chirpService.createChirp",
      requestId,
      userId,
    });
    throw new Error("Failed to create chirp due to a server error.");
  }
}

/**
 * Отримати всі чирпи з пагінацією.
 * @param queryParams Параметри запиту (page, limit).
 * @returns Проміс з масивом чирпів та інформацією про пагінацію.
 */
export async function getAllChirps(queryParams: any, requestId: string) {
  // Валідація параметрів пагінації тут
  const parsedParams = paginationSchema.safeParse(queryParams);

  if (!parsedParams.success) {
    logger.warn("Validation error for pagination parameters (all chirps)", {
      context: "chirpService.getAllChirps",
      requestId,
      errors: parsedParams.error.errors,
    });
    throw new Error(
      JSON.stringify({
        message: "Invalid pagination parameters",
        errors: parsedParams.error.errors,
      })
    );
  }

  const { page, limit } = parsedParams.data;
  const offset = (page - 1) * limit;

  try {
    const totalChirps = await chirpRepository.getTotalChirps();
    const totalPages = Math.ceil(totalChirps / limit);
    const allChirps = await chirpRepository.findAll({ limit, offset });

    return {
      chirps: allChirps,
      pagination: {
        totalChirps,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    };
  } catch (error: any) {
    logger.error("Service error retrieving all chirps with pagination", error, {
      context: "chirpService.getAllChirps",
      requestId,
    });
    throw new Error("Failed to retrieve chirps due to a server error.");
  }
}

/**
 * Отримати чирпи конкретного користувача з пагінацією.
 * @param userId ID користувача.
 * @param queryParams Параметри запиту (page, limit).
 * @returns Проміс з масивом чирпів та інформацією про пагінацію.
 */
export async function getUserChirps(
  userId: number,
  queryParams: any,
  requestId: string
) {
  const parsedParams = paginationSchema.safeParse(queryParams);

  if (!parsedParams.success) {
    logger.warn("Validation error for pagination parameters (user chirps)", {
      context: "chirpService.getUserChirps",
      requestId,
      errors: parsedParams.error.errors,
      userId,
    });
    throw new Error(
      JSON.stringify({
        message: "Invalid pagination parameters",
        errors: parsedParams.error.errors,
      })
    );
  }

  const { page, limit } = parsedParams.data;
  const offset = (page - 1) * limit;

  try {
    const totalUserChirps = await chirpRepository.getTotalChirpsByUserId(
      userId
    );
    const totalPages = Math.ceil(totalUserChirps / limit);
    const userChirps = await chirpRepository.findByUserId(userId, {
      limit,
      offset,
    });

    return {
      chirps: userChirps,
      pagination: {
        totalChirps: totalUserChirps,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    };
  } catch (error: any) {
    logger.error(
      "Service error retrieving user chirps with pagination",
      error,
      {
        context: "chirpService.getUserChirps",
        requestId,
        userId,
      }
    );
    throw new Error("Failed to retrieve user chirps due to a server error.");
  }
}
