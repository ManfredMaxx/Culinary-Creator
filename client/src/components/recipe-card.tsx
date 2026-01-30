import { Clock, Users, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@shared/schema";
import { Link } from "wouter";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <Link href={`/recipe/${recipe.id}`}>
      <Card
        className="group cursor-pointer overflow-hidden hover-elevate"
        data-testid={`card-recipe-${recipe.id}`}
      >
        <div className="aspect-[4/3] relative overflow-hidden bg-muted">
          {recipe.coverImage ? (
            <img
              src={recipe.coverImage}
              alt={recipe.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <ChefHat className="w-16 h-16 text-primary/40" />
            </div>
          )}
        </div>
        <CardHeader className="p-4 pb-2">
          <h3 className="font-serif text-xl font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {recipe.title}
          </h3>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {recipe.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {recipe.description}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {totalTime > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="w-3 h-3" />
                {totalTime} min
              </Badge>
            )}
            {recipe.servings && (
              <Badge variant="secondary" className="gap-1">
                <Users className="w-3 h-3" />
                {recipe.servings} servings
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
