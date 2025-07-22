import { Hono, type Context } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { type AppEnv } from "../../types/appEnv";
import knex from "../../../db";
import { logger } from "../../utils/logger";

// Initialize Hono instance for chirps routes
const chirps = new Hono<AppEnv>();

// Schema validation for creating a chirp
const createChirpSchema = z.object({
  content: z.string().min(1).max(280),
});

// Route for creating a new chirp (protected by auth)
chirps.post("/", authMiddleware, async (c: Context<AppEnv>) => {
  const body = await c.req.json();
  const result = createChirpSchema.safeParse(body);
  const requestId = c.get("requestId") || "N/A"; // request ID for logging
  const userId = c.req.userId!;

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

  // additional check for userId presence -переревірка повинна бути зайвою, якщо authMiddleware спрацювала
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
      .insert({ user_id: userId, content })
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
    console.error("Create chirp error:", error);
    return c.json(
      { message: "Server error during chirp creation", error: error.message },
      500
    );
  }
});

// Route for getting all chirps
chirps.get("/", async (c: Context<AppEnv>) => {
  try {
    const allChirps = await knex("chirps")
      .join("users", "chirps.user_id", "users.id")
      .select("chirps.*", "users.username")
      .orderBy("chirps.created_at", "desc"); // desc - descendingsort by creation date, recently first

    return c.json({ chirps: allChirps });
  } catch (error: any) {
    console.error("Get chirps error:", error);
    return c.json(
      { message: "Server error retrieving chirps", error: error.message },
      500
    );
  }
});

// Route for getting chirps by user ID
chirps.get("/user/:userId", async (c: Context<AppEnv>) => {
  const userId = parseInt(c.req.param("userId"), 10);

  if (isNaN(userId)) {
    return c.json({ message: "Invalid user ID" }, 400);
  }

  try {
    const userChirps = await knex("chirps")
      .join("users", "chirps.user_id", "users.id")
      .select("chirps.*", "users.username")
      .where("chirps.user_id", userId)
      .orderBy("chirps.created_at", "desc");

    return c.json({ chirps: userChirps });
  } catch (error: any) {
    console.error("Get user chirps error:", error);
    return c.json(
      { message: "Server error retrieving user chirps", error: error.message },
      500
    );
  }
});

export default chirps;
