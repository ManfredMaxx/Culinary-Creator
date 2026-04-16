import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { getAuth, createClerkClient } from "@clerk/express";
import { z } from "zod";
import { storage } from "../../storage";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const validColorThemes = ["michelin-star", "forest-bistro", "vaporwave", "high-end-bar"] as const;

const updateProfileSchema = z.object({
  profileName: z.string().transform(s => s?.trim()).optional(),
  firstName: z.string().transform(s => s?.trim()).optional(),
  lastName: z.string().transform(s => s?.trim()).optional(),
  colorTheme: z.enum(validColorThemes).optional(),
});

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user — auto-syncs from Clerk on first call
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      let user = await authStorage.getUser(userId);

      // First-time sign-in: pull profile from Clerk and create DB record
      if (!user) {
        try {
          const clerkUser = await clerkClient.users.getUser(userId);
          await authStorage.upsertUser({
            replitId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress ?? null,
            firstName: clerkUser.firstName ?? null,
            lastName: clerkUser.lastName ?? null,
            profileImageUrl: clerkUser.imageUrl ?? null,
          });
          user = await authStorage.getUser(userId);
        } catch (err) {
          console.error("Failed to sync user from Clerk:", err);
          return res.status(503).json({ message: "Failed to sync user from auth provider" });
        }
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const user = await authStorage.updateUser(userId, parsed.data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user account and all associated data
  app.delete("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = getAuth(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete all user's recipes (cascades to ingredients, steps, images via DB constraints)
      const userRecipes = await storage.getRecipesByUser(user.id);
      for (const recipe of userRecipes) {
        await storage.deleteRecipe(recipe.id);
      }

      // Delete the user account
      await authStorage.deleteUser(userId);

      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
}
