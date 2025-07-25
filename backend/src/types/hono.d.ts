import "hono"; // import Hono to extend its module types

// Extend the HonoRequest interface, which is part of Hono
declare module "hono" {
  interface HonoRequest {
    userId?: number; // Optional userId field to store the authenticated user's ID
    username?: string;
  }
}
