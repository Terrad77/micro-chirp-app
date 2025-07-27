import { jwtDecode } from "jwt-decode";
import { getAuthToken, removeAuthToken } from "./auth";

// Interface for Payload JWT
export interface DecodedToken {
  id: number;
  username: string;
  iat: number; // Issued At (час видачі токена)
  exp: number; // Expiration Time (час закінчення дії токена)
}

// function decodes the JWT from localStorage and returns its payload
export function getDecodedToken(): DecodedToken | null {
  const token = getAuthToken();
  console.log("getDecodedToken: Token found?", !!token); // Лог
  // const token = localStorage.getItem("authToken");
  if (!token) {
    return null;
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000; // Поточний час у секундах Unix

    console.log("getDecodedToken: Decoded token exp (seconds):", decoded.exp);
    console.log("getDecodedToken: Current time (seconds):", currentTime);
    console.log("getDecodedToken: Is expired?", decoded.exp < currentTime);

    // check if the token is expired
    if (decoded.exp < currentTime) {
      // <-- ВИПРАВЛЕНО: порівнюємо секунди з секундами
      console.warn("JWT token is expired. Removing from localStorage.");
      removeAuthToken(); // Використовуємо вашу функцію removeAuthToken з lib/auth
      return null;
    }
    console.log("getDecodedToken: Token is valid and not expired.");
    return decoded;
  } catch (error) {
    console.error(
      "getDecodedToken: Failed to decode token or token is invalid:",
      error
    );
    // Remove invalid token
    removeAuthToken(); // Використовуємо вашу функцію removeAuthToken з lib/auth
    return null;
  }
}

//Returns the username from the decoded JWT
export function getCurrentUsername(): string | null {
  const decodedToken = getDecodedToken();
  console.log(
    "getCurrentUsername: Decoded token for username:",
    decodedToken?.username
  );
  return decodedToken ? decodedToken.username : null; //null if the token is absent, invalid, or does not contain a username
}

// function checks if the JWT token is valid.
export function isTokenValid(): boolean {
  const isValid = getDecodedToken() !== null;
  console.log("isTokenValid: Result:", isValid);
  return isValid;
}
