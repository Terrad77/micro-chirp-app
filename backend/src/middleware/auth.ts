import type { Context, Next } from "hono";
import { verifyToken } from "../utils/auth";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  console.log("Auth header:", authHeader); // Log the auth header

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ message: "Authorization token required" }, 401); // Unauthorized
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1];
  console.log("Extracted token:", token); // extracted token for debugging

  // prevent error if token is not presentP
  if (!token) {
    return c.json({ message: "Invalid token format" }, 401); // for something like "Bearer" without token
  }
  // Verify the token
  const decodedToken = verifyToken(token);
  console.log("Decoded token:", decodedToken); // decoded token for debugging

  if (!decodedToken) {
    return c.json({ message: "Invalid or expired token" }, 403); // Forbidden
  }

  // add userId to request object for access in routes
  c.req.userId = decodedToken.id;
  c.req.username = decodedToken.username;

  await next();
};
