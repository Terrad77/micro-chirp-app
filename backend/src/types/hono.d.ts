import "hono"; // import Hono to extend its module types

// Extend the HonoRequest interface, which is part of Hono
declare module "hono" {
  interface HonoRequest {
    userId?: number; // userId optional at the HonoRequest level
  }
}
