import { Hono } from "hono";
import { authMiddleware } from "../../middleware/auth.js";
import { type AppEnv } from "../../types/appEnv.js";
import { logger } from "../../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import * as chirpsController from "../../controllers/chirpsController.js";

// Initialize Hono instance for chirps routes
const chirps = new Hono<AppEnv>();

// middleware for unique REQUEST ID
chirps.use("*", async (c, next) => {
  const requestId = uuidv4();

  c.set("requestId", requestId);
  logger.debug("Request received in chirps router", {
    requestId,
    path: c.req.path,
  });
  await next();
  logger.debug("Request processed in chirps router", {
    requestId,
    status: c.res.status,
  });
});

// Використання методів контролера для кожного роуту

chirps.post("/", authMiddleware, chirpsController.createChirpHandler);
chirps.get("/", chirpsController.getAllChirpsHandler);
chirps.get("/user/:userId", chirpsController.getUserChirpsHandler);

export default chirps;
