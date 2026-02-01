import {
  recipes,
  ingredients,
  recipeSteps,
  recipeImages,
  follows,
  recipeLikes,
  users,
  type Recipe,
  type InsertRecipe,
  type Ingredient,
  type InsertIngredient,
  type RecipeStep,
  type InsertRecipeStep,
  type RecipeImage,
  type InsertRecipeImage,
  type FullRecipe,
  type Follow,
  type RecipeLike,
  type SocialRecipe,
  type User,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, sql, count } from "drizzle-orm";

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
  getImage(id: number): Promise<RecipeImage | undefined>;
  getImagesByRecipe(recipeId: number): Promise<RecipeImage[]>;
  createImage(image: InsertRecipeImage): Promise<RecipeImage>;
  createImages(images: InsertRecipeImage[]): Promise<RecipeImage[]>;
  updateImage(id: number, image: Partial<InsertRecipeImage>): Promise<RecipeImage | undefined>;
  deleteImage(id: number): Promise<void>;
  deleteImagesByRecipe(recipeId: number): Promise<void>;

  // Follows
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  getFollowers(userId: string): Promise<User[]>;
  getFollowing(userId: string): Promise<User[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getFollowerCount(userId: string): Promise<number>;
  getFollowingCount(userId: string): Promise<number>;

  // Likes
  likeRecipe(userId: string, recipeId: number): Promise<RecipeLike>;
  unlikeRecipe(userId: string, recipeId: number): Promise<void>;
  isRecipeLiked(userId: string, recipeId: number): Promise<boolean>;
  getLikeCount(recipeId: number): Promise<number>;
  getLikedRecipesByUser(userId: string): Promise<Recipe[]>;

  // Social / Explore
  getPublicRecipes(limit?: number, offset?: number, excludeUserId?: string): Promise<SocialRecipe[]>;
  getPublicRecipesByUser(userId: string): Promise<Recipe[]>;
  getRecipesFromFollowing(userId: string, limit?: number, offset?: number): Promise<SocialRecipe[]>;
  getUserById(userId: string): Promise<User | undefined>;
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
  async getImage(id: number): Promise<RecipeImage | undefined> {
    const [image] = await db.select().from(recipeImages).where(eq(recipeImages.id, id));
    return image;
  }

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

  async deleteImage(id: number): Promise<void> {
    await db.delete(recipeImages).where(eq(recipeImages.id, id));
  }

  async deleteImagesByRecipe(recipeId: number): Promise<void> {
    await db.delete(recipeImages).where(eq(recipeImages.recipeId, recipeId));
  }

  // Follows
  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .returning();
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async getFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileName: users.profileName,
        profileImageUrl: users.profileImageUrl,
        colorTheme: users.colorTheme,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileName: users.profileName,
        profileImageUrl: users.profileImageUrl,
        colorTheme: users.colorTheme,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!result;
  }

  async getFollowerCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));
    return result?.count || 0;
  }

  async getFollowingCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));
    return result?.count || 0;
  }

  // Likes
  async likeRecipe(userId: string, recipeId: number): Promise<RecipeLike> {
    const [like] = await db
      .insert(recipeLikes)
      .values({ userId, recipeId })
      .returning();
    return like;
  }

  async unlikeRecipe(userId: string, recipeId: number): Promise<void> {
    await db
      .delete(recipeLikes)
      .where(and(eq(recipeLikes.userId, userId), eq(recipeLikes.recipeId, recipeId)));
  }

  async isRecipeLiked(userId: string, recipeId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(recipeLikes)
      .where(and(eq(recipeLikes.userId, userId), eq(recipeLikes.recipeId, recipeId)));
    return !!result;
  }

  async getLikeCount(recipeId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(recipeLikes)
      .where(eq(recipeLikes.recipeId, recipeId));
    return result?.count || 0;
  }

  async getLikedRecipesByUser(userId: string): Promise<Recipe[]> {
    const result = await db
      .select({
        id: recipes.id,
        userId: recipes.userId,
        title: recipes.title,
        description: recipes.description,
        servings: recipes.servings,
        prepTime: recipes.prepTime,
        cookTime: recipes.cookTime,
        coverImage: recipes.coverImage,
        isPublic: recipes.isPublic,
        createdAt: recipes.createdAt,
        updatedAt: recipes.updatedAt,
      })
      .from(recipeLikes)
      .innerJoin(recipes, eq(recipeLikes.recipeId, recipes.id))
      .where(eq(recipeLikes.userId, userId))
      .orderBy(desc(recipeLikes.createdAt));
    return result;
  }

  // Social / Explore
  async getPublicRecipes(limit: number = 20, offset: number = 0, excludeUserId?: string): Promise<SocialRecipe[]> {
    const conditions = excludeUserId
      ? and(eq(recipes.isPublic, true), ne(recipes.userId, excludeUserId))
      : eq(recipes.isPublic, true);

    const publicRecipes = await db
      .select()
      .from(recipes)
      .where(conditions)
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    const socialRecipes: SocialRecipe[] = [];
    for (const recipe of publicRecipes) {
      const [recipeIngredients, steps, images, author, likeCount] = await Promise.all([
        this.getIngredientsByRecipe(recipe.id),
        this.getStepsByRecipe(recipe.id),
        this.getImagesByRecipe(recipe.id),
        this.getUserById(recipe.userId),
        this.getLikeCount(recipe.id),
      ]);

      socialRecipes.push({
        ...recipe,
        ingredients: recipeIngredients,
        steps,
        images,
        author: {
          id: author?.id || recipe.userId,
          username: author?.username || null,
          firstName: author?.firstName || null,
          lastName: author?.lastName || null,
          profileName: author?.profileName || null,
          profileImageUrl: author?.profileImageUrl || null,
        },
        likeCount,
      });
    }

    return socialRecipes;
  }

  async getPublicRecipesByUser(userId: string): Promise<Recipe[]> {
    return db
      .select()
      .from(recipes)
      .where(and(eq(recipes.userId, userId), eq(recipes.isPublic, true)))
      .orderBy(desc(recipes.createdAt));
  }

  async getRecipesFromFollowing(userId: string, limit: number = 20, offset: number = 0): Promise<SocialRecipe[]> {
    const following = await this.getFollowing(userId);
    const followingIds = following.map(u => u.id);

    if (followingIds.length === 0) {
      return [];
    }

    const followingRecipes = await db
      .select()
      .from(recipes)
      .where(and(
        eq(recipes.isPublic, true),
        sql`${recipes.userId} = ANY(${followingIds})`
      ))
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    const socialRecipes: SocialRecipe[] = [];
    for (const recipe of followingRecipes) {
      const [recipeIngredients, steps, images, author, likeCount] = await Promise.all([
        this.getIngredientsByRecipe(recipe.id),
        this.getStepsByRecipe(recipe.id),
        this.getImagesByRecipe(recipe.id),
        this.getUserById(recipe.userId),
        this.getLikeCount(recipe.id),
      ]);

      socialRecipes.push({
        ...recipe,
        ingredients: recipeIngredients,
        steps,
        images,
        author: {
          id: author?.id || recipe.userId,
          username: author?.username || null,
          firstName: author?.firstName || null,
          lastName: author?.lastName || null,
          profileName: author?.profileName || null,
          profileImageUrl: author?.profileImageUrl || null,
        },
        likeCount,
      });
    }

    return socialRecipes;
  }

  async getUserById(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user;
  }
}

export const storage = new DatabaseStorage();
