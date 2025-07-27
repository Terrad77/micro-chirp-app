import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "dotenv";

// download environment variables from .env file
config({ path: "../.env" });

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

/**
 * Hashes user password
 * @param password plain password
 * @returns hashed password
 */

// function for hash a password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compares a plain password with a hashed password
 * @param password plain password
 * @param hashedPassword hashed password
 * @returns true, if passwords match, otherwise false.
 */

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * generate JWT token for user
 * @param userId - ID user
 * @param username - username user
 * @returns JWT token as a string.
 */

export const generateToken = (userId: number, username: string): string => {
  return jwt.sign({ id: userId, username: username }, JWT_SECRET, {
    expiresIn: "7d", // token expires in 7 days
  });
};

/**
 * Verify JWT token.
 * @param token JWT token to verify
 * @returns decoded token with user ID and username, or null if verification fails.
 */
export const verifyToken = (
  token: string
): { id: number; username: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
};
