import { Hono, type Context } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { type AppEnv } from "../../types/appEnv";
import knex from "../../db";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

// Initialize Hono instance for chirps routes
const chirps = new Hono<AppEnv>();

// middleware for unique REQUEST ID
chirps.use("*", async (c, next) => {
  const requestId = uuidv4();

  c.set("requestId", requestId);
  logger.debug("Request received in chirps router", {
    requestId,
    path: c.req.path,
  });
  await next();
  logger.debug("Request processed in chirps router", {
    requestId,
    status: c.res.status,
  });
});

// Schema validation for creating a chirp
const createChirpSchema = z.object({
  content: z.string().min(1).max(280),
});

// Schema validation for pagination parameters
const paginationSchema = z.object({
  page: z.preprocess((val) => {
    // Якщо val не існує або є порожнім рядком, повертаємо undefined
    if (val === undefined || val === null || String(val).trim() === "") {
      return undefined;
    }
    const num = parseInt(String(val), 10);
    // Якщо parseint повернув NaN, повертаємо undefined
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

// Route for creating a new chirp (protected by auth)
chirps.post("/", authMiddleware, async (c: Context<AppEnv>) => {
  const body = await c.req.json();
  const result = createChirpSchema.safeParse(body);
  const requestId = c.get("requestId") || "N/A"; // request ID for logging
  const userId = c.get("userId");
  const username = c.get("username");

  if (!result.success) {
    logger.warn("Validation error during chirp creation", {
      context: "chirps.post",
      requestId,
      userId,
      errors: result.error.errors,
    });
    return c.json(
      { message: "Validation error", errors: result.error.errors },
      400
    );
  }

  const { content } = result.data; // Extract content from validated data

  // additional check for userId presence
  if (!userId) {
    logger.error(
      "Unauthorized: User ID not found after authMiddleware",
      new Error("Missing UserID"),
      {
        context: "chirps.post",
        requestId,
      }
    );
    return c.json({ message: "Unauthorized: User ID not found" }, 401);
  }

  try {
    const [chirp] = await knex("chirps")
      .insert({ user_id: userId, content, username: username })
      .returning("*");
    logger.info("Chirp created successfully", {
      context: "chirps.post",
      requestId,
      userId,
      chirpId: chirp.id,
    });
    return c.json({ message: "Chirp created successfully", chirp }, 201);
  } catch (error: any) {
    logger.error("Server error during chirp creation", error, {
      context: "chirps.post",
      requestId,
      userId,
      payload: body, // вхідні дані для дебагу
    });

    return c.json(
      { message: "Server error during chirp creation", error: error.message },
      500
    );
  }
});

// Route for getting all chirps with pagination
chirps.get("/", async (c: Context<AppEnv>) => {
  const requestId = c.get("requestId") || "N/A";
  const queryParams = c.req.query(); // Отримуємо параметри запиту
  const parsedParams = paginationSchema.safeParse(queryParams);

  if (!parsedParams.success) {
    logger.warn("Validation error for pagination parameters (all chirps)", {
      context: "chirps.get:/",
      requestId,
      errors: parsedParams.error.errors,
      queryParams,
    });
    return c.json(
      {
        message: "Invalid pagination parameters",
        errors: parsedParams.error.errors,
      },
      400
    );
  }

  const { page, limit } = parsedParams.data;
  const offset = (page - 1) * limit;

  try {
    // Отримуємо загальну кількість чирпів
    const [totalChirpsResult] = await knex("chirps").count("* as count");
    const totalChirps = parseInt(
      (totalChirpsResult?.count as string) ?? "0",
      10
    );
    const totalPages = Math.ceil(totalChirps / limit);

    const allChirps = await knex("chirps")
      .join("users", "chirps.user_id", "users.id")
      .select("chirps.*", "users.username as author_username")
      .orderBy("chirps.created_at", "desc")
      .limit(limit)
      .offset(offset);

    logger.info("All chirps retrieved with pagination", {
      context: "chirps.get:/",
      requestId,
      page,
      limit,
      offset,
      totalChirps,
      totalPages,
      returnedChirps: allChirps.length,
    });

    return c.json({
      chirps: allChirps,
      pagination: {
        totalChirps,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error: any) {
    logger.error("Server error retrieving all chirps with pagination", error, {
      context: "chirps.get:/",
      requestId,
      queryParams,
    });
    return c.json(
      { message: "Server error retrieving chirps", error: error.message },
      500
    );
  }
});

// Route for getting all user chirps by userId with pagination
chirps.get("/user/:userId", async (c: Context<AppEnv>) => {
  const requestId = c.get("requestId") || "N/A";
  const userIdParam = c.req.param("userId");
  const userId = parseInt(userIdParam, 10);

  if (isNaN(userId)) {
    logger.warn("Invalid user ID for getting user chirps", {
      context: "chirps.get:/user/:userId",
      requestId,
      userIdParam,
    });
    return c.json({ message: "Invalid user ID" }, 400);
  }

  const queryParams = c.req.query(); // Отримуємо параметри запиту
  const parsedParams = paginationSchema.safeParse(queryParams);

  if (!parsedParams.success) {
    logger.warn("Validation error for pagination parameters (user chirps)", {
      context: "chirps.get:/user/:userId",
      requestId,
      errors: parsedParams.error.errors,
      queryParams,
      userId,
    });
    return c.json(
      {
        message: "Invalid pagination parameters",
        errors: parsedParams.error.errors,
      },
      400
    );
  }

  const { page, limit } = parsedParams.data;
  const offset = (page - 1) * limit;

  try {
    // Отримуємо загальну кількість чирпів для конкретного користувача
    const [totalUserChirpsResult] = await knex("chirps")
      .where("user_id", userId)
      .count("* as count");
    const totalUserChirps = parseInt(
      (totalUserChirpsResult?.count as string) ?? "0",
      10
    );
    const totalPages = Math.ceil(totalUserChirps / limit);

    const userChirps = await knex("chirps")
      .join("users", "chirps.user_id", "users.id")
      .select("chirps.*", "users.username")
      .where("chirps.user_id", userId)
      .orderBy("chirps.created_at", "desc")
      .limit(limit)
      .offset(offset);

    logger.info("User chirps retrieved with pagination", {
      context: "chirps.get:/user/:userId",
      requestId,
      userId,
      page,
      limit,
      offset,
      totalUserChirps,
      totalPages,
      returnedChirps: userChirps.length,
    });

    return c.json({
      chirps: userChirps,
      pagination: {
        totalChirps: totalUserChirps,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error: any) {
    logger.error("Server error retrieving user chirps with pagination", error, {
      context: "chirps.get:/user/:userId",
      requestId,
      userId,
      queryParams,
    });
    return c.json(
      { message: "Server error retrieving user chirps", error: error.message },
      500
    );
  }
});

export default chirps;
