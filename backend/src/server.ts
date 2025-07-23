import { Hono, type Context } from "hono";
import { serve } from "@hono/node-server";
import { config } from "dotenv";
import { getKnexInstance } from "./db";
import authRoutes from "./api/auth";
import chirpsRoutes from "./api/chirps";
import { cors } from "hono/cors";
import { type AppEnv } from "./types/appEnv";
import { logger } from "./utils/logger";
import path from "path";
import { fileURLToPath } from "url";

// Get the current directory of the file (__dirname для ESM)
const __filename = fileURLToPath(import.meta.url); // Convert the file URL to a path
const __dirname = path.dirname(__filename); // Get the directory name from the file path

// path the root directory for the application
const projectRoot = path.resolve(__dirname, "../../");

// download environment variables from .env file
config({ path: path.join(projectRoot, ".env") }); // absolute path to .env file

// Initialize Knex after loading .env ---
const knex = getKnexInstance();

// checking existence FRONTEND_URL
const frontendUrl = process.env.FRONTEND_URL;
let corsOrigin: string;

if (!frontendUrl) {
  // Log an error if FRONTEND_URL is not defined
  const error = new Error("FRONTEND_URL environment variable is not defined.");
  logger.error(
    "FRONTEND_URL is not defined in .env! Using http://localhost:3002 as fallback.",
    error,
    { context: "CORS configuration" }
  );
  corsOrigin = "http://localhost:3002";
} else {
  corsOrigin = frontendUrl;
}

// initialize Hono instance with custom AppEnv type
const app = new Hono<AppEnv>();

// Middleware CORS, for cross-origin requests frontend to backend
app.use(
  cors({
    origin: corsOrigin, // frontend address
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
    exposeHeaders: ["X-Request-ID"], // expose custom headers to frontend
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  })
);

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

// connecting routes to the app
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
