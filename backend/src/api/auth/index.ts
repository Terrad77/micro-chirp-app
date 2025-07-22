import { Hono, type Context } from "hono";
import { z } from "zod";
import knex from "../../../db";
import { hashPassword, comparePassword, generateToken } from "../../utils/auth";
import { type AppEnv } from "../../types/appEnv";

const auth = new Hono<AppEnv>();

// Схема валидации для регистрации и логина
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

// Регистрация
auth.post("/register", async (c: Context<AppEnv>) => {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      { message: "Validation error", errors: result.error.errors },
      400
    );
  }

  const { username, password } = result.data;

  try {
    const existingUser = await knex("users").where({ username }).first();
    if (existingUser) {
      return c.json({ message: "User already exists" }, 409);
    }

    const password_hash = await hashPassword(password);

    const [userId] = await knex("users")
      .insert({ username, password_hash })
      .returning("id");

    const token = generateToken(userId.id);

    return c.json(
      { message: "User registered successfully", token, userId: userId.id },
      201
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return c.json(
      { message: "Server error during registration", error: error.message },
      500
    );
  }
});

// Логин
auth.post("/login", async (c: Context<AppEnv>) => {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return c.json(
      { message: "Validation error", errors: result.error.errors },
      400
    );
  }

  const { username, password } = result.data;

  try {
    const user = await knex("users").where({ username }).first();
    if (!user) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return c.json({ message: "Invalid credentials" }, 401);
    }

    const token = generateToken(user.id);

    return c.json(
      { message: "Logged in successfully", token, userId: user.id },
      200
    );
  } catch (error: any) {
    console.error("Login error:", error);
    return c.json(
      { message: "Server error during login", error: error.message },
      500
    );
  }
});

export default auth;
