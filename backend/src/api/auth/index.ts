import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod"; //  bun add zod @hono/zod-validator
import knex from "../../../db"; // import instance of Knex
import { hashPassword, comparePassword, generateToken } from "../../utils/auth";

const auth = new Hono();

// Schema validation for registration new user
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
});

// Route for registration
auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { username, password } = c.req.valid("json");

  try {
    const existingUser = await knex("users").where({ username }).first();
    if (existingUser) {
      return c.json({ message: "User already exists" }, 409); // Conflict
    }

    const password_hash = await hashPassword(password);

    const [userId] = await knex("users")
      .insert({ username, password_hash })
      .returning("id");

    const token = generateToken(userId.id);

    return c.json(
      { message: "User registered successfully", token, userId: userId.id },
      201
    ); // Created
  } catch (error: any) {
    console.error("Registration error:", error);
    return c.json(
      { message: "Server error during registration", error: error.message },
      500
    ); // Internal Server Error
  }
});

// Route for login
auth.post("/login", zValidator("json", registerSchema), async (c) => {
  const { username, password } = c.req.valid("json");

  try {
    const user = await knex("users").where({ username }).first();
    if (!user) {
      return c.json({ message: "Invalid credentials" }, 401); // Unauthorized
    }

    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return c.json({ message: "Invalid credentials" }, 401); // Unauthorized
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
