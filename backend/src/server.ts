import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import knex from "../db";
import authRoutes from "./api/auth";
import { Knex } from "knex";
import { cors } from "hono/cors";

// завантаження перемінних середовища з файлу .env
config({ path: "../../.env" });

// definition custom type environment (Env) for Hono
interface Env {
  Variables: {
    db: Knex; // property 'db' will be of type Knex
  };
}

// initialize Hono instance with custom type Env
const app = new Hono<Env>();

// Middleware CORS, for cross-origin requests from frontend to backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // adress of the frontend
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  })
);

// Middleware для додавання Knex в контекст Hono (опціонально)
app.use(async (c, next) => {
  c.set("db", knex);
  await next();
});

// Маршрут для перевірки роботи сервера і бази даних
app.get("/", async (c) => {
  try {
    const result = await knex.raw("SELECT 1+1 AS result");
    return c.json({ message: "Hello Hono!", dbCheck: result.rows[0].result });
  } catch (error: any) {
    console.error("Database connection error:", error.message);
    return c.json(
      {
        message: "Hello Hono! Database connection failed.",
        error: error.message,
      },
      500
    );
  }
});

// Підключення маршрутів аутентифікації
app.route("/api/auth", authRoutes);

const port = parseInt(process.env.BACKEND_PORT || "3001", 10); // (defensive programming) definition second argument- radix as 10 for decimal interpretation string to number
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

process.on("SIGINT", async () => {
  console.log("Closing database connection...");
  await knex.destroy();
  console.log("Database connection closed. Server shutting down.");
  process.exit(0);
});

export default app;
