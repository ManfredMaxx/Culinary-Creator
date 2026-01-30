import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

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

// Full recipe with related data
export type FullRecipe = Recipe & {
  ingredients: Ingredient[];
  steps: RecipeStep[];
  images: RecipeImage[];
};
