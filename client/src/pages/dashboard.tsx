import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, BookOpen, Search, UtensilsCrossed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { RecipeCard } from "@/components/recipe-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import type { Recipe } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const filteredRecipes = recipes?.filter(
    (recipe) =>
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-medium tracking-tight">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-muted-foreground mt-1">
                Your culinary collection awaits
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild data-testid="link-recipe-book">
                <Link href="/book">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Create Book
                </Link>
              </Button>
              <Button asChild data-testid="link-new-recipe">
                <Link href="/new">
                  <Plus className="w-4 h-4 mr-2" />
                  New Recipe
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search your recipes..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3]" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRecipes && filteredRecipes.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          ) : recipes && recipes.length === 0 ? (
            <Card className="max-w-lg mx-auto">
              <CardContent className="p-12 text-center">
                <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <UtensilsCrossed className="w-10 h-10 text-primary" />
                  <div className="absolute inset-0 rounded-full glow-warm opacity-50" />
                </div>
                <h2 className="font-serif text-2xl font-medium mb-3">
                  Your kitchen is ready
                </h2>
                <p className="text-muted-foreground mb-6">
                  Begin your culinary journey by creating your first recipe
                </p>
                <Button asChild data-testid="button-create-first">
                  <Link href="/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Recipe
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-lg mx-auto">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h2 className="font-serif text-2xl font-semibold mb-3">
                  No recipes found
                </h2>
                <p className="text-muted-foreground">
                  Try a different search term
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
