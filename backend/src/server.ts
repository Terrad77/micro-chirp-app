import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import knex from "../db";
import authRoutes from "./api/auth";
import chirpsRoutes from "./api/chirps";
import { cors } from "hono/cors";
import { type AppEnv } from "./types/appEnv";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./utils/logger";

// download environment variables from .env file
config({ path: "../../.env" });

// initialize Hono instance with custom AppEnv type
const app = new Hono<AppEnv>();

// Middleware CORS, for cross-origin requests frontend to backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // frontend adress
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID"], // expose custom headers to frontend
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  })
);

// Middleware для додавання Request ID
app.use(async (c, next) => {
  const requestId = uuidv4();

  c.set("requestId", requestId);
  logger.debug("Request received", { requestId, path: c.req.path });
  await next();
  logger.debug("Request processed", { requestId, status: c.res.status });
});

// Middleware for adding instance of Knex to Hono context (optional)
app.use(async (c, next) => {
  c.set("db", knex);
  await next();
});

// Route for health check and database connection test
app.get("/", async (c: Context<AppEnv>) => {
  const requestId = c.get("requestId") || "N/A";
  try {
    const result = await knex.raw("SELECT 1+1 AS result");
    logger.info("Health check successful", {
      context: "server.get:/",
      requestId,
      dbCheck: result.rows[0].result,
    });
    return c.json({ message: "Hello Hono!", dbCheck: result.rows[0].result });
  } catch (error: any) {
    logger.error("Health check failed - Database connection error", error, {
      context: "server.get:/",
      requestId,
    });
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
logger.info(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

process.on("SIGINT", async () => {
  logger.info("Closing database connection...");
  await knex.destroy();
  logger.info("Database connection closed. Server shutting down.");
  process.exit(0);
});

export default app;
