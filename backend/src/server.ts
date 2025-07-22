import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import knex from "../db";
import authRoutes from "./api/auth";
import chirpsRoutes from "./api/chirps";
import { cors } from "hono/cors";
import { type AppEnv } from "./types/appEnv";

// download environment variables from .env file
config({ path: "../../.env" });

// initialize Hono instance with custom AppEnv type
const app = new Hono<AppEnv>();

// Middleware CORS, for cross-origin requests from frontend to backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // frontend adress
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  })
);

// Middleware for adding Knex to Hono context (optional)
app.use(async (c, next) => {
  c.set("db", knex);
  await next();
});

// Route for health check and database connection test
app.get("/", async (c: Context<AppEnv>) => {
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

// Підключення маршрутів
app.route("/api/auth", authRoutes);
app.route("/api/chirps", chirpsRoutes);

const port = parseInt(process.env.BACKEND_PORT || "3001", 10); // definition second argument- radix as 10 for decimal interpretation string to number
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
