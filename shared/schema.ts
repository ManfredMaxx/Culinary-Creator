import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// Re-export auth models
export * from "./models/auth";
export * from "./models/chat";

// Recipes table
export const recipes = pgTable("recipes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  servings: integer("servings"),
  prepTime: integer("prep_time"),
  cookTime: integer("cook_time"),
  coverImage: text("cover_image"),
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Follows table for social connections
export const follows = pgTable("follows", {
  followerId: varchar("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  followingId: varchar("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
}));

// Recipe likes table
export const recipeLikes = pgTable("recipe_likes", {
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.recipeId] }),
}));

// Ingredients table
export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  quantity: text("quantity"),
  unit: text("unit"),
  notes: text("notes"),
  orderIndex: integer("order_index").notNull().default(0),
});

// Recipe steps table
export const recipeSteps = pgTable("recipe_steps", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  stepNumber: integer("step_number").notNull(),
  instruction: text("instruction").notNull(),
  imageUrl: text("image_url"),
  imageDescription: text("image_description"),
  duration: integer("duration"),
});

// Recipe images (for cooking stage photos)
export const recipeImages = pgTable("recipe_images", {
  id: serial("id").primaryKey(),
  recipeId: integer("recipe_id").notNull().references(() => recipes.id, { onDelete: "cascade" }),
  stepId: integer("step_id").references(() => recipeSteps.id, { onDelete: "set null" }),
  imageUrl: text("image_url"),
  imageData: text("image_data"),
  stageDescription: text("stage_description"),
  aiAnalysis: text("ai_analysis"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Relations
export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(ingredients),
  steps: many(recipeSteps),
  images: many(recipeImages),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [ingredients.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeStepsRelations = relations(recipeSteps, ({ one, many }) => ({
  recipe: one(recipes, {
    fields: [recipeSteps.recipeId],
    references: [recipes.id],
  }),
  images: many(recipeImages),
}));

export const recipeImagesRelations = relations(recipeImages, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeImages.recipeId],
    references: [recipes.id],
  }),
  step: one(recipeSteps, {
    fields: [recipeImages.stepId],
    references: [recipeSteps.id],
  }),
}));

// Follows relations
export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "follower",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));

// Recipe likes relations
export const recipeLikesRelations = relations(recipeLikes, ({ one }) => ({
  user: one(users, {
    fields: [recipeLikes.userId],
    references: [users.id],
  }),
  recipe: one(recipes, {
    fields: [recipeLikes.recipeId],
    references: [recipes.id],
  }),
}));

// Zod schemas
export const insertRecipeSchema = createInsertSchema(recipes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export const insertRecipeStepSchema = createInsertSchema(recipeSteps).omit({
  id: true,
});

export const insertRecipeImageSchema = createInsertSchema(recipeImages).omit({
  id: true,
  createdAt: true,
});

// Types
export type Recipe = typeof recipes.$inferSelect;
export type InsertRecipe = z.infer<typeof insertRecipeSchema>;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;
export type RecipeStep = typeof recipeSteps.$inferSelect;
export type InsertRecipeStep = z.infer<typeof insertRecipeStepSchema>;
export type RecipeImage = typeof recipeImages.$inferSelect;
export type InsertRecipeImage = z.infer<typeof insertRecipeImageSchema>;
export type Follow = typeof follows.$inferSelect;
export type RecipeLike = typeof recipeLikes.$inferSelect;

// Full recipe with related data
export type FullRecipe = Recipe & {
  ingredients: Ingredient[];
  steps: RecipeStep[];
  images: RecipeImage[];
};

// Recipe with author and like info for explore/social views
export type SocialRecipe = FullRecipe & {
  author: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profileName: string | null;
    profileImageUrl: string | null;
  };
  likeCount: number;
  isLikedByUser?: boolean;
};
