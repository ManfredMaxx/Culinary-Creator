import type { Recipe, Ingredient, RecipeStep, RecipeImage } from "@shared/schema";

interface RecipeWithDetails extends Recipe {
  ingredients: Ingredient[];
  steps: RecipeStep[];
  images: RecipeImage[];
}

interface BookData {
  title: string;
  recipes: RecipeWithDetails[];
  includeStepImages?: boolean;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
}

function generateRecipePage(recipe: RecipeWithDetails, pageNumber: number, includeStepImages: boolean = true, isLast: boolean = false): string {
  const coverImage = recipe.coverImage || recipe.images?.[0]?.imageUrl;
  
  const ingredientsList = recipe.ingredients
    .map(ing => {
      const quantity = ing.quantity ? `${ing.quantity}` : "";
      const unit = ing.unit || "";
      const name = escapeHtml(ing.name);
      return `<li>${quantity} ${unit} ${name}</li>`;
    })
    .join("\n");

  const stepsList = recipe.steps
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map(step => {
      const stepImage = (includeStepImages && step.imageUrl)
        ? `<img src="${step.imageUrl}" alt="Step ${step.stepNumber}" class="step-image" />`
        : "";
      return `
        <li>
          <div class="step-content">
            <p>${escapeHtml(step.instruction)}</p>
            ${stepImage}
          </div>
        </li>
      `;
    })
    .join("\n");

  const additionalImages = recipe.images
    .filter(img => !img.stepId)
    .slice(0, 4)
    .map(img => `<img src="${img.imageUrl}" alt="${escapeHtml(img.stageDescription || 'Cooking photo')}" class="gallery-image" />`)
    .join("\n");

  const timeInfo = [];
  if (recipe.prepTime) timeInfo.push(`<span class="time-item"><strong>Prep:</strong> ${formatTime(recipe.prepTime)}</span>`);
  if (recipe.cookTime) timeInfo.push(`<span class="time-item"><strong>Cook:</strong> ${formatTime(recipe.cookTime)}</span>`);
  if (recipe.servings) timeInfo.push(`<span class="time-item"><strong>Serves:</strong> ${recipe.servings}</span>`);

  return `
    <div class="recipe-page${isLast ? ' recipe-page-last' : ''}">
      <div class="recipe-header">
        ${coverImage ? `<div class="recipe-hero"><img src="${coverImage}" alt="${escapeHtml(recipe.title)}" /></div>` : ""}
        <div class="recipe-title-block">
          <h2 class="recipe-title">${escapeHtml(recipe.title)}</h2>
          ${recipe.description ? `<p class="recipe-description">${escapeHtml(recipe.description)}</p>` : ""}
          ${timeInfo.length > 0 ? `<div class="recipe-meta">${timeInfo.join("")}</div>` : ""}
        </div>
      </div>
      
      <div class="recipe-content">
        <div class="ingredients-section">
          <h3 class="section-heading">Ingredients</h3>
          <ul class="ingredients-list">
            ${ingredientsList}
          </ul>
        </div>
        
        <div class="instructions-section">
          <h3 class="section-heading">Instructions</h3>
          <ol class="instructions-list">
            ${stepsList}
          </ol>
        </div>
      </div>

      ${additionalImages ? `
        <div class="photo-gallery">
          <h3 class="section-heading">Cooking Gallery</h3>
          <div class="gallery-grid">
            ${additionalImages}
          </div>
        </div>
      ` : ""}
      
      <div class="page-footer">
        <span class="page-number">${pageNumber}</span>
      </div>
    </div>
  `;
}

function generateTableOfContents(recipes: RecipeWithDetails[]): string {
  const entries = recipes
    .map((recipe, index) => `
      <li class="toc-entry">
        <span class="toc-title">${escapeHtml(recipe.title)}</span>
        <span class="toc-dots"></span>
        <span class="toc-page">${index + 3}</span>
      </li>
    `)
    .join("\n");

  return `
    <div class="toc-page">
      <h2 class="toc-heading">Table of Contents</h2>
      <ul class="toc-list">
        ${entries}
      </ul>
      <div class="page-footer">
        <span class="page-number">2</span>
      </div>
    </div>
  `;
}

function generateCoverPage(title: string, recipeCount: number): string {
  const currentYear = new Date().getFullYear();
  return `
    <div class="cover-page">
      <div class="cover-content">
        <div class="cover-ornament top"></div>
        <h1 class="cover-title">${escapeHtml(title)}</h1>
        <div class="cover-subtitle">A Collection of ${recipeCount} Treasured Recipes</div>
        <div class="cover-ornament bottom"></div>
        <div class="cover-year">${currentYear}</div>
      </div>
    </div>
  `;
}

export function generateRecipeBookHtml(data: BookData): string {
  const includeStepImages = data.includeStepImages !== false;
  const coverPage = generateCoverPage(data.title, data.recipes.length);
  const tocPage = generateTableOfContents(data.recipes);
  const recipePages = data.recipes
    .map((recipe, index) => {
      const isLast = index === data.recipes.length - 1;
      return generateRecipePage(recipe, index + 3, includeStepImages, isLast);
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(data.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-gold: #d9a441;
      --color-gold-light: #e8c078;
      --color-burgundy: #8B4557;
      --color-burgundy-dark: #6a3444;
      --color-cream: #faf8f5;
      --color-dark: #1a1715;
      --color-dark-warm: #2a2420;
      --color-text: #3d3833;
      --color-text-light: #6b635a;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @page {
      size: letter;
      margin: 0;
    }

    body {
      font-family: 'Cormorant Garamond', Georgia, serif;
      background: var(--color-cream);
      color: var(--color-text);
      line-height: 1.6;
      font-size: 12pt;
    }

    /* Cover Page */
    .cover-page {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--color-dark) 0%, var(--color-dark-warm) 50%, #352d28 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(ellipse at 30% 20%, rgba(217, 164, 65, 0.15) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 80%, rgba(139, 69, 87, 0.1) 0%, transparent 50%);
    }

    .cover-content {
      text-align: center;
      padding: 4rem 3rem;
      position: relative;
      z-index: 1;
    }

    .cover-ornament {
      width: 200px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
      margin: 2rem auto;
    }

    .cover-ornament::before {
      content: '❧';
      display: block;
      color: var(--color-gold);
      font-size: 1.5rem;
      margin-bottom: -0.5rem;
    }

    .cover-ornament.bottom::before {
      margin-top: -0.5rem;
      margin-bottom: 0;
      transform: rotate(180deg);
    }

    .cover-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 3.5rem;
      font-weight: 600;
      color: var(--color-cream);
      letter-spacing: 0.05em;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      margin: 1rem 0;
    }

    .cover-subtitle {
      font-size: 1.3rem;
      color: var(--color-gold-light);
      font-style: italic;
      letter-spacing: 0.1em;
    }

    .cover-year {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.2rem;
      color: var(--color-gold);
      margin-top: 3rem;
      letter-spacing: 0.3em;
    }

    /* Table of Contents */
    .toc-page {
      min-height: 100vh;
      padding: 4rem 3rem;
      background: var(--color-cream);
      page-break-after: always;
      position: relative;
    }

    .toc-heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.2rem;
      color: var(--color-burgundy);
      text-align: center;
      margin-bottom: 3rem;
      letter-spacing: 0.1em;
    }

    .toc-list {
      list-style: none;
      max-width: 500px;
      margin: 0 auto;
    }

    .toc-entry {
      display: flex;
      align-items: baseline;
      padding: 0.8rem 0;
      border-bottom: 1px solid rgba(217, 164, 65, 0.2);
    }

    .toc-title {
      font-size: 1.1rem;
      color: var(--color-text);
    }

    .toc-dots {
      flex: 1;
      border-bottom: 1px dotted var(--color-gold);
      margin: 0 0.5rem;
      min-width: 20px;
    }

    .toc-page-num {
      font-family: 'Playfair Display', Georgia, serif;
      color: var(--color-burgundy);
      font-weight: 600;
    }

    /* Recipe Pages */
    .recipe-page {
      min-height: 100vh;
      padding: 2rem;
      background: var(--color-cream);
      page-break-after: always;
      position: relative;
    }

    .recipe-page-last {
      page-break-after: auto;
    }

    .recipe-header {
      margin-bottom: 2rem;
    }

    .recipe-hero {
      width: 100%;
      height: 280px;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1.5rem;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
    }

    .recipe-hero img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .recipe-title-block {
      text-align: center;
      padding: 0 1rem;
    }

    .recipe-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2rem;
      color: var(--color-burgundy);
      margin-bottom: 0.5rem;
      letter-spacing: 0.02em;
    }

    .recipe-description {
      font-style: italic;
      color: var(--color-text-light);
      font-size: 1.1rem;
      max-width: 600px;
      margin: 0 auto 1rem;
    }

    .recipe-meta {
      display: flex;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
      color: var(--color-text-light);
      font-size: 0.95rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(217, 164, 65, 0.3);
    }

    .time-item {
      display: flex;
      gap: 0.3rem;
    }

    .time-item strong {
      color: var(--color-gold);
    }

    .recipe-content {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 2rem;
      margin-top: 2rem;
    }

    .section-heading {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.3rem;
      color: var(--color-burgundy);
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--color-gold);
    }

    .ingredients-section {
      background: linear-gradient(135deg, rgba(217, 164, 65, 0.08) 0%, rgba(217, 164, 65, 0.03) 100%);
      padding: 1.5rem;
      border-radius: 8px;
      height: fit-content;
    }

    .ingredients-list {
      list-style: none;
    }

    .ingredients-list li {
      padding: 0.4rem 0;
      border-bottom: 1px solid rgba(217, 164, 65, 0.15);
      font-size: 0.95rem;
    }

    .ingredients-list li:last-child {
      border-bottom: none;
    }

    .instructions-section {
      padding-right: 1rem;
    }

    .instructions-list {
      list-style: none;
      counter-reset: step-counter;
    }

    .instructions-list li {
      counter-increment: step-counter;
      position: relative;
      padding-left: 2.5rem;
      margin-bottom: 1.2rem;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .instructions-list li::before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: 0;
      width: 1.8rem;
      height: 1.8rem;
      background: var(--color-burgundy);
      color: var(--color-cream);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .step-content p {
      margin-bottom: 0.8rem;
    }

    .step-image {
      max-width: 200px;
      height: auto;
      border-radius: 6px;
      margin-top: 0.5rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .photo-gallery {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(217, 164, 65, 0.3);
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .gallery-image {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 6px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .page-footer {
      position: absolute;
      bottom: 2rem;
      left: 0;
      right: 0;
      text-align: center;
    }

    .page-number {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 0.9rem;
      color: var(--color-gold);
    }

    /* Print Styles */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .cover-page, .toc-page, .recipe-page {
        page-break-inside: avoid;
      }

      .recipe-hero {
        height: 200px;
      }

      .recipe-content {
        grid-template-columns: 1fr 1.5fr;
      }
    }

    /* Responsive for screen viewing */
    @media screen and (max-width: 768px) {
      .recipe-content {
        grid-template-columns: 1fr;
      }

      .cover-title {
        font-size: 2.5rem;
      }

      .recipe-title {
        font-size: 1.6rem;
      }
    }
  </style>
</head>
<body>
  ${coverPage}
  ${tocPage}
  ${recipePages}
</body>
</html>`;
}
