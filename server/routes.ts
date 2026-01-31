import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, registerAuthRoutes } from "./replit_integrations/auth";
import { ensureCompatibleFormat, speechToText } from "./replit_integrations/audio/client";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Increase body limit for audio/image uploads
  app.use(express.json({ limit: "50mb" }));

  // Setup auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // Get all recipes for current user (including seed demo recipes)
  app.get("/api/recipes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).claims.sub;
      const userRecipes = await storage.getRecipesByUser(userId);
      const seedRecipes = await storage.getRecipesByUser("seed-demo-user");
      const allRecipes = [...userRecipes, ...seedRecipes];
      res.json(allRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // Get single recipe with details
  app.get("/api/recipes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;

      const recipe = await storage.getRecipeWithDetails(id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Allow access to user's own recipes and seed demo recipes
      if (recipe.userId !== userId && recipe.userId !== "seed-demo-user") {
        return res.status(403).json({ error: "Access denied" });
      }

      res.json(recipe);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Zod schemas for request validation
  const createRecipeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    servings: z.number().optional(),
    prepTime: z.number().optional(),
    cookTime: z.number().optional(),
    ingredients: z.array(z.object({
      name: z.string(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
      notes: z.string().optional(),
    })).optional(),
    steps: z.array(z.object({
      stepNumber: z.number(),
      instruction: z.string(),
      duration: z.number().optional(),
    })).optional(),
    images: z.array(z.string()).optional(),
  });

  const transcribeRecipeSchema = z.object({
    audio: z.string().min(1, "Audio data is required"),
  });

  const analyzeImagesSchema = z.object({
    images: z.array(z.string()).min(1, "At least one image is required"),
  });

  const recipeBookSchema = z.object({
    title: z.string().optional(),
    recipeIds: z.array(z.number()).min(1, "At least one recipe ID is required"),
  });

  // Create new recipe
  app.post("/api/recipes", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = createRecipeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Invalid request body" });
      }

      const userId = (req.user as any).claims.sub;
      const { title, description, servings, prepTime, cookTime, ingredients, steps, images } = parseResult.data;

      // Create the recipe
      const recipe = await storage.createRecipe({
        userId,
        title,
        description,
        servings: servings || null,
        prepTime: prepTime || null,
        cookTime: cookTime || null,
        coverImage: null,
      });

      // Create ingredients
      if (ingredients && ingredients.length > 0) {
        await storage.createIngredients(
          ingredients.map((ing: any, index: number) => ({
            recipeId: recipe.id,
            name: ing.name,
            quantity: ing.quantity || null,
            unit: ing.unit || null,
            notes: ing.notes || null,
            orderIndex: index,
          }))
        );
      }

      // Create steps
      let createdSteps: any[] = [];
      if (steps && steps.length > 0) {
        createdSteps = await storage.createSteps(
          steps.map((step: any) => ({
            recipeId: recipe.id,
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            duration: step.duration || null,
            imageUrl: null,
            imageDescription: null,
          }))
        );
      }

      // Create images if provided
      if (images && images.length > 0) {
        const createdImages = await Promise.all(
          images.map(async (imageData: string, index: number) => {
            // Analyze the image to determine its cooking stage
            const analysis = await analyzeImage(imageData);
            
            // Try to match to a step
            let matchedStepId = null;
            if (createdSteps.length > 0 && analysis.suggestedStep) {
              const stepIndex = analysis.suggestedStep - 1;
              if (stepIndex >= 0 && stepIndex < createdSteps.length) {
                matchedStepId = createdSteps[stepIndex].id;
              }
            }

            return storage.createImage({
              recipeId: recipe.id,
              stepId: matchedStepId,
              imageUrl: null,
              imageData: imageData.replace(/^data:image\/\w+;base64,/, ""),
              stageDescription: analysis.description,
              aiAnalysis: analysis.rawAnalysis,
            });
          })
        );

        // Set the first image as cover
        if (createdImages.length > 0) {
          await storage.updateRecipe(recipe.id, {
            coverImage: `data:image/jpeg;base64,${createdImages[0].imageData}`,
          });
        }
      }

      const fullRecipe = await storage.getRecipeWithDetails(recipe.id);
      res.status(201).json(fullRecipe);
    } catch (error) {
      console.error("Error creating recipe:", error);
      res.status(500).json({ error: "Failed to create recipe" });
    }
  });

  // Delete recipe
  app.delete("/api/recipes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;

      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      if (recipe.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      await storage.deleteRecipe(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting recipe:", error);
      res.status(500).json({ error: "Failed to delete recipe" });
    }
  });

  // Update recipe schema
  const updateRecipeSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    servings: z.number().optional().nullable(),
    prepTime: z.number().optional().nullable(),
    cookTime: z.number().optional().nullable(),
    coverImage: z.string().optional().nullable(),
    ingredients: z.array(z.object({
      name: z.string(),
      quantity: z.string().optional(),
      unit: z.string().optional(),
      notes: z.string().optional(),
    })).optional(),
    steps: z.array(z.object({
      stepNumber: z.number(),
      instruction: z.string(),
      duration: z.number().optional().nullable(),
    })).optional(),
  });

  // Update recipe
  app.put("/api/recipes/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;

      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      if (recipe.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const parseResult = updateRecipeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Invalid request body" });
      }

      const { title, description, servings, prepTime, cookTime, coverImage, ingredients, steps } = parseResult.data;

      // Update the recipe
      const updateData: any = {
        title,
        description,
        servings: servings ?? null,
        prepTime: prepTime ?? null,
        cookTime: cookTime ?? null,
      };
      
      // Only update coverImage if explicitly provided (allows setting to null)
      if (coverImage !== undefined) {
        updateData.coverImage = coverImage;
      }
      
      await storage.updateRecipe(id, updateData);

      // Replace ingredients
      if (ingredients) {
        await storage.deleteIngredientsByRecipe(id);
        if (ingredients.length > 0) {
          await storage.createIngredients(
            ingredients.map((ing, index) => ({
              recipeId: id,
              name: ing.name,
              quantity: ing.quantity || null,
              unit: ing.unit || null,
              notes: ing.notes || null,
              orderIndex: index,
            }))
          );
        }
      }

      // Replace steps while preserving image associations
      if (steps) {
        // Get current steps and their images before deletion
        const oldSteps = await storage.getStepsByRecipe(id);
        const images = await storage.getImagesByRecipe(id);
        
        // Build map: stepNumber -> imageIds for images assigned to old steps
        const stepNumberToImages: Map<number, number[]> = new Map();
        for (const oldStep of oldSteps) {
          const stepImages = images.filter(img => img.stepId === oldStep.id);
          if (stepImages.length > 0) {
            stepNumberToImages.set(oldStep.stepNumber, stepImages.map(img => img.id));
          }
        }
        
        // Clear stepId on all images that were assigned to steps (will be re-assigned after new steps are created)
        for (const oldStep of oldSteps) {
          for (const img of images) {
            if (img.stepId === oldStep.id) {
              await storage.updateImage(img.id, { stepId: null });
            }
          }
        }
        
        // Delete old steps and create new ones
        await storage.deleteStepsByRecipe(id);
        if (steps.length > 0) {
          const newSteps = await storage.createSteps(
            steps.map((step) => ({
              recipeId: id,
              stepNumber: step.stepNumber,
              instruction: step.instruction,
              duration: step.duration || null,
              imageUrl: null,
              imageDescription: null,
            }))
          );
          
          // Re-assign images to new steps based on stepNumber
          for (const newStep of newSteps) {
            const imageIds = stepNumberToImages.get(newStep.stepNumber);
            if (imageIds) {
              for (const imageId of imageIds) {
                await storage.updateImage(imageId, { stepId: newStep.id });
              }
            }
          }
        }
      }

      const fullRecipe = await storage.getRecipeWithDetails(id);
      res.json(fullRecipe);
    } catch (error) {
      console.error("Error updating recipe:", error);
      res.status(500).json({ error: "Failed to update recipe" });
    }
  });

  // Add image to recipe
  app.post("/api/recipes/:id/images", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;

      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      if (recipe.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const { imageData, stepId } = req.body;
      if (!imageData) {
        return res.status(400).json({ error: "Image data is required" });
      }

      // Analyze the image
      const analysis = await analyzeImage(imageData);

      const image = await storage.createImage({
        recipeId,
        stepId: stepId || null,
        imageUrl: null,
        imageData: imageData.replace(/^data:image\/\w+;base64,/, ""),
        stageDescription: analysis.description,
        aiAnalysis: analysis.rawAnalysis,
      });

      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding image:", error);
      res.status(500).json({ error: "Failed to add image" });
    }
  });

  // Update image (e.g., assign to step)
  app.patch("/api/recipes/:recipeId/images/:imageId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const imageId = parseInt(req.params.imageId);
      const userId = (req.user as any).claims.sub;

      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      if (recipe.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const image = await storage.getImage(imageId);
      if (!image || image.recipeId !== recipeId) {
        return res.status(404).json({ error: "Image not found" });
      }

      const { stepId } = req.body;
      const updated = await storage.updateImage(imageId, { stepId: stepId ?? null });
      res.json(updated);
    } catch (error) {
      console.error("Error updating image:", error);
      res.status(500).json({ error: "Failed to update image" });
    }
  });

  // Delete image
  app.delete("/api/recipes/:recipeId/images/:imageId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const recipeId = parseInt(req.params.recipeId);
      const imageId = parseInt(req.params.imageId);
      const userId = (req.user as any).claims.sub;

      const recipe = await storage.getRecipe(recipeId);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      if (recipe.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const image = await storage.getImage(imageId);
      if (!image || image.recipeId !== recipeId) {
        return res.status(404).json({ error: "Image not found" });
      }

      await storage.deleteImage(imageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  // Transcribe audio and generate structured recipe
  app.post("/api/transcribe-recipe", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = transcribeRecipeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Audio data required" });
      }
      const { audio } = parseResult.data;

      // Convert and transcribe audio
      const rawBuffer = Buffer.from(audio, "base64");
      const { buffer: audioBuffer, format } = await ensureCompatibleFormat(rawBuffer);
      const transcription = await speechToText(audioBuffer, format);

      // Use GPT to structure the recipe
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: `You are a recipe parser. Convert the spoken recipe description into a structured JSON format.
            
Extract the following information:
- title: The name of the recipe
- description: A brief description of the dish
- servings: Number of servings (estimate if not mentioned)
- prepTime: Preparation time in minutes (estimate if not mentioned)
- cookTime: Cooking time in minutes (estimate if not mentioned)
- ingredients: Array of { name, quantity, unit, notes }
- steps: Array of { stepNumber, instruction, duration (in minutes, optional) }

Be thorough in extracting all ingredients and steps. If quantities are mentioned informally (like "a pinch of salt"), include them as they are.

Return ONLY valid JSON, no additional text.`,
          },
          {
            role: "user",
            content: transcription,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 4096,
      });

      const recipeData = JSON.parse(response.choices[0]?.message?.content || "{}");
      res.json(recipeData);
    } catch (error) {
      console.error("Error transcribing recipe:", error);
      res.status(500).json({ error: "Failed to transcribe recipe" });
    }
  });

  // Analyze cooking stage images
  app.post("/api/analyze-images", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = analyzeImagesSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Images array required" });
      }
      const { images } = parseResult.data;

      const analyses = await Promise.all(
        images.map(async (imageData: string, index: number) => {
          const analysis = await analyzeImage(imageData);
          return {
            index,
            description: analysis.description,
            suggestedStep: analysis.suggestedStep,
          };
        })
      );

      res.json({ analyses });
    } catch (error) {
      console.error("Error analyzing images:", error);
      res.status(500).json({ error: "Failed to analyze images" });
    }
  });

  // Generate printable recipe page
  app.get("/api/recipes/:id/print", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;

      const recipe = await storage.getRecipeWithDetails(id);
      if (!recipe) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      if (recipe.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      // Generate HTML for printing
      const html = generateRecipeHtml(recipe);
      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch (error) {
      console.error("Error generating print view:", error);
      res.status(500).json({ error: "Failed to generate print view" });
    }
  });

  // Generate recipe book HTML (printable)
  app.post("/api/recipes/book", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = recipeBookSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0]?.message || "Invalid request" });
      }
      const { title, recipeIds } = parseResult.data;
      const userId = (req.user as any).claims.sub;

      // Fetch all recipes
      const recipes = await Promise.all(
        recipeIds.map((id: number) => storage.getRecipeWithDetails(id))
      );

      // Filter out null recipes and check ownership (including seed demo recipes)
      const validRecipes = recipes.filter(
        (recipe) => recipe && (recipe.userId === userId || recipe.userId === "seed-demo-user")
      );

      if (validRecipes.length === 0) {
        return res.status(400).json({ error: "No valid recipes found" });
      }

      // Generate HTML for the recipe book
      const html = generateRecipeBookHtml(title || "My Recipe Collection", validRecipes as any);
      
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="${title || "recipe-book"}.html"`);
      res.send(html);
    } catch (error) {
      console.error("Error generating recipe book:", error);
      res.status(500).json({ error: "Failed to generate recipe book" });
    }
  });

  return httpServer;
}

// Helper function to analyze an image
async function analyzeImage(imageData: string): Promise<{
  description: string;
  suggestedStep: number | null;
  rawAnalysis: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      messages: [
        {
          role: "system",
          content: `You are a cooking expert analyzing food preparation images. 
          
Analyze the image and provide:
1. A brief description of what cooking stage is shown (e.g., "Chopped vegetables ready for sautéing", "Dough rising in a bowl")
2. An estimated step number (1-10) where this image would fit in a typical recipe

Return JSON: { "description": "...", "suggestedStep": number }`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: imageData.startsWith("data:") ? imageData : `data:image/jpeg;base64,${imageData}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    return {
      description: result.description || "Cooking stage",
      suggestedStep: result.suggestedStep || null,
      rawAnalysis: response.choices[0]?.message?.content || "",
    };
  } catch (error) {
    console.error("Image analysis error:", error);
    return {
      description: "Cooking stage",
      suggestedStep: null,
      rawAnalysis: "",
    };
  }
}

// Generate HTML for a single recipe
function generateRecipeHtml(recipe: any): string {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${recipe.title} - RecipeVault</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1614; background: #faf8f6; }
    h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; font-weight: 500; }
    h1 { font-size: 2.5rem; margin-bottom: 0.5rem; color: #1a1614; letter-spacing: -0.01em; }
    .description { font-style: italic; color: #6b5f58; margin-bottom: 1.5rem; font-size: 1.1rem; }
    .meta { display: flex; gap: 2rem; margin-bottom: 2rem; padding: 1rem 1.25rem; background: #f0ebe6; border-radius: 6px; border-left: 3px solid #d9a441; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 0.75rem; color: #8a7f78; text-transform: uppercase; letter-spacing: 0.1em; }
    .meta-value { font-size: 1.1rem; font-weight: 600; color: #1a1614; }
    .cover-image { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .section-title { font-size: 1.4rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #d9a441; color: #1a1614; }
    .ingredients { margin-bottom: 2rem; }
    .ingredients ul { list-style: none; }
    .ingredients li { padding: 0.5rem 0; border-bottom: 1px solid #e8e2dc; display: flex; }
    .ingredients li::before { content: ""; width: 6px; height: 6px; background: #d9a441; border-radius: 50%; margin-right: 0.75rem; margin-top: 0.5rem; flex-shrink: 0; }
    .ingredient-qty { font-weight: 600; margin-right: 0.5rem; color: #1a1614; }
    .steps { margin-bottom: 2rem; }
    .step { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .step-number { width: 32px; height: 32px; background: linear-gradient(135deg, #d9a441 0%, #c49235 100%); color: #1a1614; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; font-size: 0.9rem; }
    .step-content { flex: 1; line-height: 1.7; }
    .step-image { max-width: 300px; border-radius: 6px; margin-top: 1rem; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e8e2dc; text-align: center; color: #8a7f78; font-size: 0.85rem; }
    @media print {
      body { padding: 20px; background: white; }
      .cover-image { max-height: 300px; }
    }
  </style>
</head>
<body>
  ${recipe.coverImage ? `<img src="${recipe.coverImage}" alt="${recipe.title}" class="cover-image">` : ""}
  <h1>${recipe.title}</h1>
  ${recipe.description ? `<p class="description">${recipe.description}</p>` : ""}
  
  <div class="meta">
    ${totalTime > 0 ? `<div class="meta-item"><span class="meta-label">Total Time</span><span class="meta-value">${totalTime} min</span></div>` : ""}
    ${recipe.prepTime ? `<div class="meta-item"><span class="meta-label">Prep</span><span class="meta-value">${recipe.prepTime} min</span></div>` : ""}
    ${recipe.cookTime ? `<div class="meta-item"><span class="meta-label">Cook</span><span class="meta-value">${recipe.cookTime} min</span></div>` : ""}
    ${recipe.servings ? `<div class="meta-item"><span class="meta-label">Servings</span><span class="meta-value">${recipe.servings}</span></div>` : ""}
  </div>

  <div class="ingredients">
    <h2 class="section-title">Ingredients</h2>
    <ul>
      ${recipe.ingredients.map((ing: any) => `
        <li>
          <span class="ingredient-qty">${ing.quantity || ""} ${ing.unit || ""}</span>
          ${ing.name}${ing.notes ? ` (${ing.notes})` : ""}
        </li>
      `).join("")}
    </ul>
  </div>

  <div class="steps">
    <h2 class="section-title">Instructions</h2>
    ${recipe.steps.map((step: any) => {
      const stepImage = recipe.images.find((img: any) => img.stepId === step.id);
      return `
        <div class="step">
          <div class="step-number">${step.stepNumber}</div>
          <div class="step-content">
            <p>${step.instruction}</p>
            ${step.duration ? `<small style="color: #8a7f78;">About ${step.duration} minutes</small>` : ""}
            ${stepImage ? `<img src="data:image/jpeg;base64,${stepImage.imageData}" alt="${stepImage.stageDescription || ''}" class="step-image">` : ""}
          </div>
        </div>
      `;
    }).join("")}
  </div>
  <div class="footer">Created with RecipeVault</div>
</body>
</html>`;
}

// Generate HTML for recipe book
function generateRecipeBookHtml(title: string, recipes: any[]): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - RecipeVault</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; color: #1a1614; }
    h1, h2, h3 { font-family: 'Playfair Display', Georgia, serif; font-weight: 500; }
    .page { page-break-after: always; min-height: 100vh; padding: 50px; background: #faf8f6; }
    .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: linear-gradient(135deg, #1a1614 0%, #2d2622 50%, #1a1614 100%); color: #e8e2dc; }
    .cover h1 { font-size: 3.5rem; margin-bottom: 1rem; color: #d9a441; letter-spacing: -0.02em; }
    .cover p { font-size: 1.2rem; color: #a89c94; }
    .cover .subtitle { margin-top: 0.5rem; font-style: italic; }
    .cover .footer { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #3d3632; font-size: 0.9rem; color: #6b5f58; }
    .toc { padding-top: 60px; background: #faf8f6; }
    .toc h2 { font-size: 2rem; margin-bottom: 2rem; text-align: center; color: #1a1614; }
    .toc ul { list-style: none; max-width: 600px; margin: 0 auto; }
    .toc li { padding: 1rem 0; border-bottom: 1px solid #e8e2dc; display: flex; justify-content: space-between; }
    .toc li span:first-child { color: #1a1614; }
    .toc li span:last-child { color: #d9a441; font-weight: 600; }
    .recipe-page { background: #faf8f6; }
    .recipe-page h1 { font-size: 2rem; color: #1a1614; margin-bottom: 0.5rem; }
    .recipe-page .description { font-style: italic; color: #6b5f58; margin-bottom: 1rem; }
    .recipe-page .meta { display: flex; gap: 2rem; margin-bottom: 1.5rem; padding: 0.75rem 1rem; background: #f0ebe6; border-radius: 6px; font-size: 0.9rem; border-left: 3px solid #d9a441; }
    .recipe-page .meta span { color: #1a1614; }
    .recipe-page .section-title { font-size: 1.25rem; margin: 1.5rem 0 0.75rem; padding-bottom: 0.25rem; border-bottom: 2px solid #d9a441; color: #1a1614; }
    .recipe-page .ingredients ul { list-style: none; columns: 2; column-gap: 2rem; }
    .recipe-page .ingredients li { padding: 0.3rem 0; break-inside: avoid; display: flex; align-items: baseline; }
    .recipe-page .ingredients li::before { content: ""; width: 5px; height: 5px; background: #d9a441; border-radius: 50%; margin-right: 0.5rem; flex-shrink: 0; }
    .recipe-page .step { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
    .recipe-page .step-number { width: 24px; height: 24px; background: linear-gradient(135deg, #d9a441 0%, #c49235 100%); color: #1a1614; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 600; flex-shrink: 0; }
    .recipe-page .step-content { flex: 1; line-height: 1.6; font-size: 0.95rem; }
    @media print {
      .page { padding: 35px; }
      .cover { min-height: 100vh; }
    }
  </style>
</head>
<body>
  <div class="page cover">
    <h1>${title}</h1>
    <p class="subtitle">${recipes.length} curated recipes</p>
    <p class="footer">Created with RecipeVault</p>
  </div>

  <div class="page toc">
    <h2>Table of Contents</h2>
    <ul>
      ${recipes.map((recipe, index) => `
        <li>
          <span>${recipe.title}</span>
          <span>${index + 1}</span>
        </li>
      `).join("")}
    </ul>
  </div>

  ${recipes.map((recipe) => `
    <div class="page recipe-page">
      <h1>${recipe.title}</h1>
      ${recipe.description ? `<p class="description">${recipe.description}</p>` : ""}
      
      <div class="meta">
        ${recipe.prepTime ? `<span>Prep: ${recipe.prepTime} min</span>` : ""}
        ${recipe.cookTime ? `<span>Cook: ${recipe.cookTime} min</span>` : ""}
        ${recipe.servings ? `<span>Serves: ${recipe.servings}</span>` : ""}
      </div>

      <div class="ingredients">
        <h3 class="section-title">Ingredients</h3>
        <ul>
          ${recipe.ingredients.map((ing: any) => `
            <li><strong>${ing.quantity || ""} ${ing.unit || ""}</strong> ${ing.name}</li>
          `).join("")}
        </ul>
      </div>

      <div class="steps">
        <h3 class="section-title">Instructions</h3>
        ${recipe.steps.map((step: any) => `
          <div class="step">
            <div class="step-number">${step.stepNumber}</div>
            <div class="step-content">${step.instruction}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `).join("")}
</body>
</html>`;
}
