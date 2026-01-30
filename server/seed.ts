import { storage } from "./storage";
import { db } from "./db";
import { recipes } from "@shared/schema";

const SEED_USER_ID = "seed-demo-user";

export async function seedDatabase() {
  try {
    // Check if we already have seed data
    const existingRecipes = await storage.getRecipesByUser(SEED_USER_ID);
    if (existingRecipes.length > 0) {
      console.log("Seed data already exists, skipping...");
      return;
    }

    console.log("Seeding database with sample recipes...");

    // Recipe 1: Classic Chocolate Chip Cookies
    const cookies = await storage.createRecipe({
      userId: SEED_USER_ID,
      title: "Classic Chocolate Chip Cookies",
      description: "Soft, chewy cookies with melty chocolate chips - a timeless family favorite that brings back childhood memories.",
      servings: 24,
      prepTime: 15,
      cookTime: 12,
      coverImage: null,
    });

    await storage.createIngredients([
      { recipeId: cookies.id, name: "all-purpose flour", quantity: "2 1/4", unit: "cups", notes: null, orderIndex: 0 },
      { recipeId: cookies.id, name: "baking soda", quantity: "1", unit: "tsp", notes: null, orderIndex: 1 },
      { recipeId: cookies.id, name: "salt", quantity: "1", unit: "tsp", notes: null, orderIndex: 2 },
      { recipeId: cookies.id, name: "butter", quantity: "1", unit: "cup", notes: "softened", orderIndex: 3 },
      { recipeId: cookies.id, name: "granulated sugar", quantity: "3/4", unit: "cup", notes: null, orderIndex: 4 },
      { recipeId: cookies.id, name: "brown sugar", quantity: "3/4", unit: "cup", notes: "packed", orderIndex: 5 },
      { recipeId: cookies.id, name: "vanilla extract", quantity: "1", unit: "tsp", notes: null, orderIndex: 6 },
      { recipeId: cookies.id, name: "eggs", quantity: "2", unit: "large", notes: null, orderIndex: 7 },
      { recipeId: cookies.id, name: "chocolate chips", quantity: "2", unit: "cups", notes: null, orderIndex: 8 },
    ]);

    await storage.createSteps([
      { recipeId: cookies.id, stepNumber: 1, instruction: "Preheat oven to 375°F (190°C). Line baking sheets with parchment paper.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: cookies.id, stepNumber: 2, instruction: "In a medium bowl, whisk together flour, baking soda, and salt. Set aside.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: cookies.id, stepNumber: 3, instruction: "In a large bowl, beat butter with both sugars until light and fluffy, about 3 minutes.", duration: 3, imageUrl: null, imageDescription: null },
      { recipeId: cookies.id, stepNumber: 4, instruction: "Add vanilla and eggs one at a time, beating well after each addition.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: cookies.id, stepNumber: 5, instruction: "Gradually add flour mixture to butter mixture, mixing on low until just combined.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: cookies.id, stepNumber: 6, instruction: "Fold in chocolate chips with a spatula.", duration: 1, imageUrl: null, imageDescription: null },
      { recipeId: cookies.id, stepNumber: 7, instruction: "Drop rounded tablespoons of dough onto prepared baking sheets, spacing 2 inches apart.", duration: 3, imageUrl: null, imageDescription: null },
      { recipeId: cookies.id, stepNumber: 8, instruction: "Bake for 10-12 minutes until edges are golden but centers look slightly underdone. Let cool on pan for 5 minutes before transferring to a wire rack.", duration: 12, imageUrl: null, imageDescription: null },
    ]);

    // Recipe 2: Creamy Garlic Pasta
    const pasta = await storage.createRecipe({
      userId: SEED_USER_ID,
      title: "Creamy Garlic Parmesan Pasta",
      description: "A quick and indulgent weeknight dinner with a velvety garlic cream sauce that comes together in under 30 minutes.",
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      coverImage: null,
    });

    await storage.createIngredients([
      { recipeId: pasta.id, name: "fettuccine pasta", quantity: "1", unit: "lb", notes: null, orderIndex: 0 },
      { recipeId: pasta.id, name: "butter", quantity: "4", unit: "tbsp", notes: null, orderIndex: 1 },
      { recipeId: pasta.id, name: "garlic", quantity: "6", unit: "cloves", notes: "minced", orderIndex: 2 },
      { recipeId: pasta.id, name: "heavy cream", quantity: "2", unit: "cups", notes: null, orderIndex: 3 },
      { recipeId: pasta.id, name: "parmesan cheese", quantity: "1 1/2", unit: "cups", notes: "freshly grated", orderIndex: 4 },
      { recipeId: pasta.id, name: "salt", quantity: "1", unit: "tsp", notes: null, orderIndex: 5 },
      { recipeId: pasta.id, name: "black pepper", quantity: "1/2", unit: "tsp", notes: "freshly ground", orderIndex: 6 },
      { recipeId: pasta.id, name: "fresh parsley", quantity: "1/4", unit: "cup", notes: "chopped, for garnish", orderIndex: 7 },
    ]);

    await storage.createSteps([
      { recipeId: pasta.id, stepNumber: 1, instruction: "Bring a large pot of salted water to a boil. Cook pasta according to package directions until al dente. Reserve 1 cup pasta water before draining.", duration: 12, imageUrl: null, imageDescription: null },
      { recipeId: pasta.id, stepNumber: 2, instruction: "While pasta cooks, melt butter in a large skillet over medium heat. Add minced garlic and sauté for 1-2 minutes until fragrant but not browned.", duration: 3, imageUrl: null, imageDescription: null },
      { recipeId: pasta.id, stepNumber: 3, instruction: "Pour in heavy cream and bring to a gentle simmer. Cook for 3-4 minutes, stirring occasionally.", duration: 4, imageUrl: null, imageDescription: null },
      { recipeId: pasta.id, stepNumber: 4, instruction: "Reduce heat to low and gradually whisk in parmesan cheese until melted and smooth. Season with salt and pepper.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: pasta.id, stepNumber: 5, instruction: "Add drained pasta to the sauce and toss to coat. Add reserved pasta water a little at a time if sauce is too thick.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: pasta.id, stepNumber: 6, instruction: "Serve immediately, garnished with fresh parsley and extra parmesan if desired.", duration: 1, imageUrl: null, imageDescription: null },
    ]);

    // Recipe 3: Honey Garlic Salmon
    const salmon = await storage.createRecipe({
      userId: SEED_USER_ID,
      title: "Honey Garlic Glazed Salmon",
      description: "Perfectly pan-seared salmon with a sweet and savory glaze that caramelizes beautifully. Restaurant-quality dinner in 20 minutes.",
      servings: 4,
      prepTime: 5,
      cookTime: 15,
      coverImage: null,
    });

    await storage.createIngredients([
      { recipeId: salmon.id, name: "salmon fillets", quantity: "4", unit: "6-oz", notes: "skin-on or skinless", orderIndex: 0 },
      { recipeId: salmon.id, name: "honey", quantity: "1/4", unit: "cup", notes: null, orderIndex: 1 },
      { recipeId: salmon.id, name: "soy sauce", quantity: "3", unit: "tbsp", notes: null, orderIndex: 2 },
      { recipeId: salmon.id, name: "garlic", quantity: "4", unit: "cloves", notes: "minced", orderIndex: 3 },
      { recipeId: salmon.id, name: "olive oil", quantity: "2", unit: "tbsp", notes: null, orderIndex: 4 },
      { recipeId: salmon.id, name: "lemon juice", quantity: "1", unit: "tbsp", notes: null, orderIndex: 5 },
      { recipeId: salmon.id, name: "salt and pepper", quantity: "", unit: "", notes: "to taste", orderIndex: 6 },
      { recipeId: salmon.id, name: "sesame seeds", quantity: "1", unit: "tbsp", notes: "for garnish", orderIndex: 7 },
      { recipeId: salmon.id, name: "green onions", quantity: "2", unit: "", notes: "sliced, for garnish", orderIndex: 8 },
    ]);

    await storage.createSteps([
      { recipeId: salmon.id, stepNumber: 1, instruction: "In a small bowl, whisk together honey, soy sauce, minced garlic, and lemon juice. Set aside.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: salmon.id, stepNumber: 2, instruction: "Pat salmon fillets dry with paper towels. Season both sides with salt and pepper.", duration: 1, imageUrl: null, imageDescription: null },
      { recipeId: salmon.id, stepNumber: 3, instruction: "Heat olive oil in a large skillet over medium-high heat. When oil shimmers, add salmon fillets presentation-side down.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: salmon.id, stepNumber: 4, instruction: "Sear for 4 minutes without moving. The bottom should be golden and crispy.", duration: 4, imageUrl: null, imageDescription: null },
      { recipeId: salmon.id, stepNumber: 5, instruction: "Flip salmon and reduce heat to medium. Pour the honey garlic sauce over the fillets.", duration: 1, imageUrl: null, imageDescription: null },
      { recipeId: salmon.id, stepNumber: 6, instruction: "Cook for another 4-5 minutes, spooning sauce over salmon occasionally, until fish flakes easily with a fork.", duration: 5, imageUrl: null, imageDescription: null },
      { recipeId: salmon.id, stepNumber: 7, instruction: "Transfer to plates, spoon remaining sauce from pan over salmon. Garnish with sesame seeds and green onions.", duration: 1, imageUrl: null, imageDescription: null },
    ]);

    // Recipe 4: Fresh Garden Salad
    const salad = await storage.createRecipe({
      userId: SEED_USER_ID,
      title: "Mediterranean Garden Salad",
      description: "A vibrant, colorful salad with crisp vegetables, tangy feta, and a zesty lemon herb dressing. Perfect as a side or light meal.",
      servings: 6,
      prepTime: 15,
      cookTime: 0,
      coverImage: null,
    });

    await storage.createIngredients([
      { recipeId: salad.id, name: "mixed greens", quantity: "8", unit: "cups", notes: null, orderIndex: 0 },
      { recipeId: salad.id, name: "cherry tomatoes", quantity: "1", unit: "pint", notes: "halved", orderIndex: 1 },
      { recipeId: salad.id, name: "cucumber", quantity: "1", unit: "large", notes: "diced", orderIndex: 2 },
      { recipeId: salad.id, name: "red onion", quantity: "1/2", unit: "", notes: "thinly sliced", orderIndex: 3 },
      { recipeId: salad.id, name: "kalamata olives", quantity: "1/2", unit: "cup", notes: null, orderIndex: 4 },
      { recipeId: salad.id, name: "feta cheese", quantity: "1", unit: "cup", notes: "crumbled", orderIndex: 5 },
      { recipeId: salad.id, name: "extra virgin olive oil", quantity: "1/4", unit: "cup", notes: null, orderIndex: 6 },
      { recipeId: salad.id, name: "lemon juice", quantity: "3", unit: "tbsp", notes: "fresh", orderIndex: 7 },
      { recipeId: salad.id, name: "dried oregano", quantity: "1", unit: "tsp", notes: null, orderIndex: 8 },
      { recipeId: salad.id, name: "garlic", quantity: "1", unit: "clove", notes: "minced", orderIndex: 9 },
    ]);

    await storage.createSteps([
      { recipeId: salad.id, stepNumber: 1, instruction: "In a small jar with a lid, combine olive oil, lemon juice, oregano, minced garlic, salt, and pepper. Shake vigorously until emulsified.", duration: 2, imageUrl: null, imageDescription: null },
      { recipeId: salad.id, stepNumber: 2, instruction: "In a large salad bowl, combine mixed greens, halved cherry tomatoes, diced cucumber, and sliced red onion.", duration: 3, imageUrl: null, imageDescription: null },
      { recipeId: salad.id, stepNumber: 3, instruction: "Add kalamata olives and crumbled feta cheese.", duration: 1, imageUrl: null, imageDescription: null },
      { recipeId: salad.id, stepNumber: 4, instruction: "Drizzle dressing over salad just before serving. Toss gently to coat all ingredients evenly.", duration: 1, imageUrl: null, imageDescription: null },
    ]);

    console.log("Database seeded successfully with 4 sample recipes!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
