import { jwtDecode } from "jwt-decode";

// Interface for Payload JWT
// Переконайтеся, що ці поля (id, username, iat, exp) відповідають тому,
// що ваш бекенд додає до токена.
export interface DecodedToken {
  id: number;
  username: string;
  iat: number; // Issued At (час видачі токена)
  exp: number; // Expiration Time (час закінчення дії токена)
}

// function decodes the JWT from localStorage and returns its payload
export function getDecodedToken(): DecodedToken | null {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return null;
  }
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // check if the token is expired
    if (decoded.exp * 1000 < Date.now()) {
      console.warn("JWT token is expired.");
      // Optionally: remove expired token if it still exists
      localStorage.removeItem("authToken");
      return null;
    }
    return decoded;
  } catch (error) {
    console.error("Failed to decode token or token is invalid:", error);
    // Remove invalid token
    localStorage.removeItem("authToken");
    return null;
  }
}

//Returns the username from the decoded JWT
export function getCurrentUsername(): string | null {
  const decodedToken = getDecodedToken();
  return decodedToken ? decodedToken.username : null; //null if the token is absent, invalid, or does not contain a username
}

// function checks if the JWT token is valid.
export function isTokenValid(): boolean {
  return getDecodedToken() !== null;
}
