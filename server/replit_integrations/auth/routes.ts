import type { Express } from "express";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { storage } from "../../storage";

const validColorThemes = ["michelin-star", "forest-bistro", "vaporwave", "high-end-bar"] as const;

const updateProfileSchema = z.object({
  profileName: z.string().transform(s => s?.trim()).optional(),
  firstName: z.string().transform(s => s?.trim()).optional(),
  lastName: z.string().transform(s => s?.trim()).optional(),
  colorTheme: z.enum(validColorThemes).optional(),
});

// Register auth-specific routes
export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const replitId = req.user.claims.sub;
      const user = await authStorage.getUser(replitId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile (first name and last name only)
  app.patch("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const replitId = req.user.claims.sub;
      const parsed = updateProfileSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid request data" });
      }

      const user = await authStorage.updateUser(replitId, parsed.data);
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
      const replitId = req.user.claims.sub;
      
      // Get the user to obtain their internal UUID id
      const user = await authStorage.getUser(replitId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Delete all user's recipes using internal id (cascades to ingredients, steps, images via DB constraints)
      const userRecipes = await storage.getRecipesByUser(user.id);
      for (const recipe of userRecipes) {
        await storage.deleteRecipe(recipe.id);
      }
      
      // Delete the user account
      await authStorage.deleteUser(replitId);
      
      // Clear the session
      req.logout?.((err: any) => {
        if (err) {
          console.error("Error during logout:", err);
        }
      });
      
      res.json({ message: "Account deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });
}
