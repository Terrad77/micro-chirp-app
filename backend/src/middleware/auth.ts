import type { Context, Next } from "hono";
import { verifyToken } from "../utils/auth";
import { type AppEnv } from "../types/appEnv";

export const authMiddleware = async (c: Context<AppEnv>, next: Next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Authorization token required" }, 401); // Unauthorized
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1];

  // prevent error if token is not presentP
  if (!token) {
    return c.json({ message: "Invalid token format" }, 401); // for something like "Bearer" without token
  }
  // Verify the token
  const decodedToken = verifyToken(token);

  if (!decodedToken) {
    return c.json({ message: "Invalid or expired token" }, 403); // Forbidden
  }

  // add userId to request object for access in routes
  c.set("userId", decodedToken.id);
  c.set("username", decodedToken.username);

  await next();
};
