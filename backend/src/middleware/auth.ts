import type { Context, Next } from "hono";
import { verifyToken } from "../utils/auth";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  console.log("Auth header:", authHeader); // Логуємо заголовок

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("No auth header or invalid format"); // Логуємо причину
    return c.json({ message: "Authorization token required" }, 401); // Unauthorized
  }

  // Extract the token from the header
  const token = authHeader.split(" ")[1];
  console.log("Extracted token:", token); // Логуємо витягнутий токен

  // prevent error if token is not present
  if (!token) {
    console.log("Token is empty after split"); // Логуємо причину
    return c.json({ message: "Invalid token format" }, 401); // for something like "Bearer" without token
  }
  // Verify the token
  const decodedToken = verifyToken(token);
  console.log("Decoded token:", decodedToken); // Логуємо декодований токен

  if (!decodedToken) {
    console.log("Token verification failed"); // Логуємо причину
    return c.json({ message: "Invalid or expired token" }, 403); // Forbidden
  }

  // add userId to request object for access in routes
  c.req.userId = decodedToken.id;
  console.log("UserID set on request:", c.req.userId); // Логуємо встановлений userId

  await next();
};
