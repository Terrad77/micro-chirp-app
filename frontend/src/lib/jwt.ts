import { jwtDecode } from "jwt-decode";
import { getAuthToken, removeAuthToken } from "./auth";
import { logger } from "@/lib/logger";

// Interface for Payload JWT
export interface DecodedToken {
  id: number;
  username: string;
  iat: number; // Issued At (time the token was issued)
  exp: number; // Expiration Time (time the token expires)
}

// function decodes the JWT from localStorage and returns its payload
export function getDecodedToken(): DecodedToken | null {
  const token = getAuthToken();

  // const token = localStorage.getItem("authToken");
  if (!token) {
    logger.debug("getDecodedToken: No auth token found.", { context: "jwt" });
    return null;
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000; // Current time in Unix seconds

    // check if the token is expired
    if (decoded.exp < currentTime) {
      logger.warn("JWT token is expired. Removing from localStorage.", {
        context: "jwt",
      });
      removeAuthToken();
      return null;
    }
    logger.info("Token is valid and not expired.", { context: "jwt" });
    return decoded;
  } catch (error) {
    logger.error(
      "Failed to decode token or token is invalid. Removing invalid token.",
      error,
      { context: "jwt" }
    );

    removeAuthToken(); // Remove invalid token
    return null;
  }
}

//Returns the username from the decoded JWT
export function getCurrentUsername(): string | null {
  const decodedToken = getDecodedToken();
  logger.info("Decoded token for username.", {
    username: decodedToken?.username,
    context: "jwt",
  });
  return decodedToken ? decodedToken.username : null; //null if the token is absent, invalid, or does not contain a username
}

// function checks if the JWT token is valid.
export function isTokenValid(): boolean {
  const isValid = getDecodedToken() !== null;
  logger.info("Is token valid result.", { isValid, context: "jwt" });
  return isValid;
}
