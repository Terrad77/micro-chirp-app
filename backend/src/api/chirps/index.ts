import { Hono, type Context } from "hono";
import { z } from "zod";
import { authMiddleware } from "../../middleware/auth";
import { type AppEnv } from "../../types/appEnv";
import knex from "../../../db";

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

  if (!result.success) {
    return c.json(
      { message: "Validation error", errors: result.error.errors },
      400
    );
  }

  const { content } = result.data;
  // Use type assertion to access userId injected by authMiddleware
  const userId = c.req.userId!;

  if (!userId) {
    // additional check for userId presence
    return c.json({ message: "Unauthorized: User ID not found" }, 401);
  }

  try {
    const [chirp] = await knex("chirps")
      .insert({ user_id: userId, content })
      .returning("*");
    return c.json({ message: "Chirp created successfully", chirp }, 201);
  } catch (error: any) {
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
      .orderBy("chirps.created_at", "desc"); // sort by creation date, recently first

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
