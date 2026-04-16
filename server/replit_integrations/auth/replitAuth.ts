import { clerkMiddleware, getAuth } from "@clerk/express";
import type { Express, RequestHandler } from "express";

export async function setupAuth(app: Express) {
  app.use(clerkMiddleware());
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  return next();
};

// clerkMiddleware() is applied globally so auth context is always available.
// This is a simple passthrough for routes that work with or without auth.
export const optionalAuth: RequestHandler = (_req, _res, next) => {
  return next();
};

// Kept for interface compatibility — no longer used with Clerk JWT auth.
export function getSession() {
  return (_req: any, _res: any, next: () => void) => next();
}
