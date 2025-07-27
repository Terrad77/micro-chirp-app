import { Hono, type Context } from "hono";
import { config } from "dotenv";
import knex from "./db";
import authRoutes from "./api/auth";
import chirpsRoutes from "./api/chirps";
import { type AppEnv } from "./types/appEnv";
import { logger } from "./utils/logger";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import { cors } from "hono/cors";

// Get the current directory of the file (__dirname для ESM)
const __filename = fileURLToPath(import.meta.url); // Convert the file URL to a path
const __dirname = path.dirname(__filename); // Get the directory name from the file path

// path the root directory for the application
const projectRoot = path.resolve(__dirname, "../../");

// download environment variables from .env file
config({ path: path.join(projectRoot, ".env") }); // absolute path to .env file

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
logger.info(`CORS Origin used: ${corsOrigin}`);

// initialize Hono instance with custom AppEnv type
const app = new Hono<AppEnv>();

// custom Middleware CORS, for cross-origin requests frontend to backend
// app.use("*", async (c, next) => {
//   // заголовки для OPTIONS запитів (preflight)
//   if (c.req.method === "OPTIONS") {
//     c.header("Access-Control-Allow-Origin", "http://localhost:3002");
//     c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
//     c.header(
//       "Access-Control-Allow-Headers",
//       "Content-Type, Authorization, X-Request-ID"
//     );
//     c.header("Access-Control-Max-Age", "86400"); // Кешувати preflight відповідь на 24 години
//     c.header("Access-Control-Allow-Credentials", "false"); // не використовує куки/сертифікати

//     return c.text("", 204); // Повертаємо 204 No Content для OPTIONS
//   }

//   // Додаємо заголовки для всіх інших запитів
//   c.header("Access-Control-Allow-Origin", "http://localhost:3002");
//   c.header("Access-Control-Allow-Credentials", "false");

//   await next();
// });

//Hono CORS middleware
app.use(
  cors({
    origin: corsOrigin, // Використовуємо змінну corsOrigin
    credentials: true, // Важливо для передачі куків (JWT токена)
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Дозволені методи
    allowHeaders: ["Content-Type", "Authorization", "X-Request-ID"], // Дозволені заголовки
  })
);

// Middleware для додавання Request ID до контексту
app.use(async (c, next) => {
  const requestId = uuidv4();
  c.set("requestId", requestId); // Встановлюємо requestId у контекст Hono
  logger.info(
    `Incoming Request - Method: ${c.req.method}, Path: ${c.req.path}, RequestId: ${requestId}`
  );
  await next();
  logger.info(
    `Outgoing Response - Method: ${c.req.method}, Path: ${c.req.path}, RequestId: ${requestId}, Status: ${c.res.status}`
  );
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
    const result = await knex.raw("SELECT 1+1 AS result"); // simple query to test DB connection
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

// Start the server on specified port
// const port = parseInt(
//   process.env.PORT || process.env.BACKEND_PORT || "3001",
//   10
// ); // definition second argument- radix as 10 for decimal interpretation string to number
// logger.info(`BACKEND Server is running on port ${port}`);

// use Bun.serve замість @hono/node-server
// Bun.serve({
//   fetch: app.fetch,
//   port,
// });

process.on("SIGINT", async () => {
  logger.info("Closing database connection...");
  await knex.destroy();
  logger.info("Database connection closed. Server shutting down.");
  process.exit(0);
});

export default app;
