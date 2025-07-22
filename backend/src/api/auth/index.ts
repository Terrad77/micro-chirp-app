import { Hono, type Context } from "hono";
import { z } from "zod";
import knex from "../../../db";
import { hashPassword, comparePassword, generateToken } from "../../utils/auth";
import { type AppEnv } from "../../types/appEnv";
import { logger } from "../../utils/logger";
import { v4 as uuidv4 } from "uuid";

const auth = new Hono<AppEnv>();

// middleware for unique REQUEST ID
auth.use("*", async (c, next) => {
  const requestId = uuidv4();
  console.log("CHIRPS ROUTER MIDDLEWARE: Generated requestId:", requestId);

  c.set("requestId", requestId);
  logger.debug("Request received in auth router", {
    requestId,
    path: c.req.path,
  });
  await next();
  logger.debug("Request processed in auth router", {
    requestId,
    status: c.res.status,
  });
});

// Схема валідації для реєстрації та логіна
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

// Реєстрація
auth.post("/register", async (c: Context<AppEnv>) => {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);
  const requestId = c.get("requestId") || "N/A";

  if (!result.success) {
    // Log validation errors
    logger.warn("Validation error during user registration", {
      context: "auth.register",
      requestId,
      errors: result.error.errors,
      payload: body,
    });
    return c.json(
      { message: "Validation error", errors: result.error.errors },
      400
    );
  }

  const { username, password } = result.data;

  try {
    const existingUser = await knex("users").where({ username }).first();
    if (existingUser) {
      // Log attempt to register with an existing username
      logger.warn("User registration attempt with existing username", {
        context: "auth.register",
        requestId,
        username,
      });
      return c.json({ message: "User already exists" }, 409);
    }

    const password_hash = await hashPassword(password);
    const [userId] = await knex("users")
      .insert({ username, password_hash })
      .returning("id");

    const token = generateToken(userId.id);
    // Log successful registration
    logger.info("User registered successfully", {
      context: "auth.register",
      requestId,
      userId: userId.id,
      username,
    });
    return c.json(
      { message: "User registered successfully", token, userId: userId.id },
      201
    );
  } catch (error: any) {
    logger.error("Server error during user registration", error, {
      context: "auth.register",
      requestId,
      username,
      payload: body,
    });
    return c.json(
      { message: "Server error during registration", error: error.message },
      500
    );
  }
});

// Логін
auth.post("/login", async (c: Context<AppEnv>) => {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);
  const requestId = c.get("requestId") || "N/A";
  console.log("AUTH LOGIN ROUTE: requestId before log:", requestId);

  if (!result.success) {
    logger.warn("Validation error during user login", {
      context: "auth.login",
      requestId,
      errors: result.error.errors,
      payload: body,
    });
    return c.json(
      { message: "Validation error", errors: result.error.errors },
      400
    );
  }

  const { username, password } = result.data;

  try {
    const user = await knex("users").where({ username }).first();
    if (!user) {
      logger.warn("Login attempt with invalid username", {
        context: "auth.login",
        requestId,
        username,
      });
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      logger.warn("Login attempt with invalid password", {
        context: "auth.login",
        requestId,
        username,
        userId: user.id, // Log user ID for tracking
      });
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const token = generateToken(user.id);

    logger.info("User logged in successfully", {
      context: "auth.login",
      requestId,
      userId: user.id,
      username,
    });

    return c.json(
      { message: "Logged in successfully", token, userId: user.id },
      200
    );
  } catch (error: any) {
    logger.error("Server error during user login", error, {
      context: "auth.login",
      requestId,
      username,
      payload: body,
    });
    return c.json(
      { message: "Server error during login", error: error.message },
      500
    );
  }
});

export default auth;
