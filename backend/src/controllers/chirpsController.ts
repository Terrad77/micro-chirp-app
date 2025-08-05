import { type Context } from "hono";
import { type AppEnv } from "../types/appEnv.js";
import * as chirpService from "../services/chirpService.js";
import { logger } from "../utils/logger.js";

/**
 * Обробник для створення нового чирпа.
 * @param c Контекст Hono.
 * @returns Відповідь JSON.
 */
export async function createChirpHandler(c: Context<AppEnv>) {
  const body = await c.req.json();
  const requestId = c.get("requestId") || "N/A";
  const userId = c.get("userId");
  const username = c.get("username");
  const { content } = body;

  // Перевірка наявності userId, що має бути встановлений middleware
  if (!userId) {
    logger.error(
      "Unauthorized: User ID not found after authMiddleware",
      new Error("Missing UserID"),
      {
        context: "chirpsController.createChirpHandler",
        requestId,
      }
    );
    return c.json({ message: "Unauthorized: User ID not found" }, 401);
  }

  try {
    const chirp = await chirpService.createChirp(
      content,
      userId,
      username,
      requestId
    );
    logger.info("Chirp created successfully", {
      context: "chirpsController.createChirpHandler",
      requestId,
      userId,
      chirpId: chirp.id,
    });
    return c.json({ message: "Chirp created successfully", chirp }, 201);
  } catch (error: any) {
    logger.error("Server error during chirp creation", error, {
      context: "chirpsController.createChirpHandler",
      requestId,
      userId,
      payload: body,
    });
    // Обробка помилок валідації та інших помилок, що повертаються з сервісу
    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.message === "Validation error") {
        return c.json(parsedError, 400);
      }
    } catch (e) {
      // Якщо помилка не JSON-формату, обробляємо як звичайну
    }
    return c.json(
      { message: "Server error during chirp creation", error: error.message },
      500
    );
  }
}

/**
 * Обробник для отримання всіх чирпів з пагінацією.
 * @param c Контекст Hono.
 * @returns Відповідь JSON.
 */
export async function getAllChirpsHandler(c: Context<AppEnv>) {
  const requestId = c.get("requestId") || "N/A";
  const queryParams = c.req.query();

  try {
    const result = await chirpService.getAllChirps(queryParams, requestId);
    logger.info("All chirps retrieved with pagination", {
      context: "chirpsController.getAllChirpsHandler",
      requestId,
      pagination: result.pagination,
    });
    return c.json(result);
  } catch (error: any) {
    logger.error("Server error retrieving all chirps with pagination", error, {
      context: "chirpsController.getAllChirpsHandler",
      requestId,
      queryParams,
    });
    // Обробка помилок валідації з сервісу
    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.message === "Invalid pagination parameters") {
        return c.json(parsedError, 400);
      }
    } catch (e) {
      // Якщо помилка не JSON-формату, обробляємо як звичайну
    }
    return c.json(
      { message: "Server error retrieving chirps", error: error.message },
      500
    );
  }
}

/**
 * Обробник для отримання чирпів конкретного користувача з пагінацією.
 * @param c Контекст Hono.
 * @returns Відповідь JSON.
 */
export async function getUserChirpsHandler(c: Context<AppEnv>) {
  const requestId = c.get("requestId") || "N/A";
  const userIdParam = c.req.param("userId");
  const userId = parseInt(userIdParam, 10);

  // Валідація ID користувача
  if (isNaN(userId)) {
    logger.warn("Invalid user ID for getting user chirps", {
      context: "chirpsController.getUserChirpsHandler",
      requestId,
      userIdParam,
    });
    return c.json({ message: "Invalid user ID" }, 400);
  }

  const queryParams = c.req.query();

  try {
    const result = await chirpService.getUserChirps(
      userId,
      queryParams,
      requestId
    );
    logger.info("User chirps retrieved with pagination", {
      context: "chirpsController.getUserChirpsHandler",
      requestId,
      userId,
      pagination: result.pagination,
    });
    return c.json(result);
  } catch (error: any) {
    logger.error("Server error retrieving user chirps with pagination", error, {
      context: "chirpsController.getUserChirpsHandler",
      requestId,
      userId,
      queryParams,
    });
    // Обробка помилок валідації з сервісу
    try {
      const parsedError = JSON.parse(error.message);
      if (parsedError.message === "Invalid pagination parameters") {
        return c.json(parsedError, 400);
      }
    } catch (e) {
      // Якщо помилка не JSON-формату, обробляємо як звичайну
    }
    return c.json(
      { message: "Server error retrieving user chirps", error: error.message },
      500
    );
  }
}
