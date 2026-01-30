import {
  recipes,
  ingredients,
  recipeSteps,
  recipeImages,
  type Recipe,
  type InsertRecipe,
  type Ingredient,
  type InsertIngredient,
  type RecipeStep,
  type InsertRecipeStep,
  type RecipeImage,
  type InsertRecipeImage,
  type FullRecipe,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Recipes
  getRecipe(id: number): Promise<Recipe | undefined>;
  getRecipeWithDetails(id: number): Promise<FullRecipe | undefined>;
  getRecipesByUser(userId: string): Promise<Recipe[]>;
  createRecipe(recipe: InsertRecipe): Promise<Recipe>;
  updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined>;
  deleteRecipe(id: number): Promise<void>;

  // Ingredients
  getIngredientsByRecipe(recipeId: number): Promise<Ingredient[]>;
  createIngredient(ingredient: InsertIngredient): Promise<Ingredient>;
  createIngredients(ingredients: InsertIngredient[]): Promise<Ingredient[]>;
  deleteIngredientsByRecipe(recipeId: number): Promise<void>;

  // Steps
  getStepsByRecipe(recipeId: number): Promise<RecipeStep[]>;
  createStep(step: InsertRecipeStep): Promise<RecipeStep>;
  createSteps(steps: InsertRecipeStep[]): Promise<RecipeStep[]>;
  deleteStepsByRecipe(recipeId: number): Promise<void>;

  // Images
  getImagesByRecipe(recipeId: number): Promise<RecipeImage[]>;
  createImage(image: InsertRecipeImage): Promise<RecipeImage>;
  createImages(images: InsertRecipeImage[]): Promise<RecipeImage[]>;
  updateImage(id: number, image: Partial<InsertRecipeImage>): Promise<RecipeImage | undefined>;
  deleteImagesByRecipe(recipeId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Recipes
  async getRecipe(id: number): Promise<Recipe | undefined> {
    const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id));
    return recipe;
  }

  async getRecipeWithDetails(id: number): Promise<FullRecipe | undefined> {
    const recipe = await this.getRecipe(id);
    if (!recipe) return undefined;

    const [recipeIngredients, steps, images] = await Promise.all([
      this.getIngredientsByRecipe(id),
      this.getStepsByRecipe(id),
      this.getImagesByRecipe(id),
    ]);

    return {
      ...recipe,
      ingredients: recipeIngredients,
      steps,
      images,
    };
  }

  async getRecipesByUser(userId: string): Promise<Recipe[]> {
    return db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, userId))
      .orderBy(desc(recipes.createdAt));
  }

  async createRecipe(recipe: InsertRecipe): Promise<Recipe> {
    const [created] = await db.insert(recipes).values(recipe).returning();
    return created;
  }

  async updateRecipe(id: number, recipe: Partial<InsertRecipe>): Promise<Recipe | undefined> {
    const [updated] = await db
      .update(recipes)
      .set({ ...recipe, updatedAt: new Date() })
      .where(eq(recipes.id, id))
      .returning();
    return updated;
  }

  async deleteRecipe(id: number): Promise<void> {
    await db.delete(recipes).where(eq(recipes.id, id));
  }

  // Ingredients
  async getIngredientsByRecipe(recipeId: number): Promise<Ingredient[]> {
    return db
      .select()
      .from(ingredients)
      .where(eq(ingredients.recipeId, recipeId))
      .orderBy(ingredients.orderIndex);
  }

  async createIngredient(ingredient: InsertIngredient): Promise<Ingredient> {
    const [created] = await db.insert(ingredients).values(ingredient).returning();
    return created;
  }

  async createIngredients(ingredientList: InsertIngredient[]): Promise<Ingredient[]> {
    if (ingredientList.length === 0) return [];
    return db.insert(ingredients).values(ingredientList).returning();
  }

  async deleteIngredientsByRecipe(recipeId: number): Promise<void> {
    await db.delete(ingredients).where(eq(ingredients.recipeId, recipeId));
  }

  // Steps
  async getStepsByRecipe(recipeId: number): Promise<RecipeStep[]> {
    return db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, recipeId))
      .orderBy(recipeSteps.stepNumber);
  }

  async createStep(step: InsertRecipeStep): Promise<RecipeStep> {
    const [created] = await db.insert(recipeSteps).values(step).returning();
    return created;
  }

  async createSteps(stepList: InsertRecipeStep[]): Promise<RecipeStep[]> {
    if (stepList.length === 0) return [];
    return db.insert(recipeSteps).values(stepList).returning();
  }

  async deleteStepsByRecipe(recipeId: number): Promise<void> {
    await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, recipeId));
  }

  // Images
  async getImagesByRecipe(recipeId: number): Promise<RecipeImage[]> {
    return db.select().from(recipeImages).where(eq(recipeImages.recipeId, recipeId));
  }

  async createImage(image: InsertRecipeImage): Promise<RecipeImage> {
    const [created] = await db.insert(recipeImages).values(image).returning();
    return created;
  }

  async createImages(imageList: InsertRecipeImage[]): Promise<RecipeImage[]> {
    if (imageList.length === 0) return [];
    return db.insert(recipeImages).values(imageList).returning();
  }

  async updateImage(id: number, image: Partial<InsertRecipeImage>): Promise<RecipeImage | undefined> {
    const [updated] = await db
      .update(recipeImages)
      .set(image)
      .where(eq(recipeImages.id, id))
      .returning();
    return updated;
  }

  async deleteImagesByRecipe(recipeId: number): Promise<void> {
    await db.delete(recipeImages).where(eq(recipeImages.recipeId, recipeId));
  }
}

export const storage = new DatabaseStorage();
