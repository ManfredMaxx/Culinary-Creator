import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Check,
  Download,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Recipe } from "@shared/schema";

export default function RecipeBook() {
  const { toast } = useToast();
  const [selectedRecipes, setSelectedRecipes] = useState<number[]>([]);
  const [bookTitle, setBookTitle] = useState("My Recipe Collection");

  const { data: recipes, isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const generateBookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/recipes/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: bookTitle,
          recipeIds: selectedRecipes,
        }),
      });
      if (!response.ok) throw new Error("Failed to generate book");
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookTitle.replace(/\s+/g, "_")}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Recipe book generated!",
        description: "Open the file in a browser and print to PDF for best results.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recipe book. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleRecipe = (id: number) => {
    setSelectedRecipes((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (recipes) {
      setSelectedRecipes(recipes.map((r) => r.id));
    }
  };

  const deselectAll = () => {
    setSelectedRecipes([]);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild data-testid="link-back">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold">Create Recipe Book</h1>
            <p className="text-muted-foreground">
              Select recipes to include in your printable book
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-lg">Select Recipes</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll} data-testid="button-select-all">
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll} data-testid="button-deselect-all">
                    Clear
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <Skeleton className="w-5 h-5" />
                        <Skeleton className="w-16 h-16 rounded" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recipes && recipes.length > 0 ? (
                  <div className="space-y-4">
                    {recipes.map((recipe) => (
                      <label
                        key={recipe.id}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover-elevate border overflow-hidden"
                        data-testid={`recipe-select-${recipe.id}`}
                      >
                        <Checkbox
                          checked={selectedRecipes.includes(recipe.id)}
                          onCheckedChange={() => toggleRecipe(recipe.id)}
                          className="flex-shrink-0"
                        />
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                          {recipe.coverImage ? (
                            <img
                              src={recipe.coverImage}
                              alt={recipe.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <h3 className="font-medium truncate">{recipe.title}</h3>
                          {recipe.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {recipe.description}
                            </p>
                          )}
                        </div>
                        {selectedRecipes.includes(recipe.id) && (
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No recipes yet. Create some recipes first!
                    </p>
                    <Button variant="outline" asChild className="mt-4">
                      <Link href="/new">Create Recipe</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Book Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bookTitle">Book Title</Label>
                  <Input
                    id="bookTitle"
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="My Recipe Collection"
                    data-testid="input-book-title"
                  />
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    {selectedRecipes.length} recipe{selectedRecipes.length !== 1 ? "s" : ""}{" "}
                    selected
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Estimated: {selectedRecipes.length + 2} pages
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    size="lg"
                    onClick={() => generateBookMutation.mutate()}
                    disabled={selectedRecipes.length === 0 || generateBookMutation.isPending}
                    data-testid="button-generate-book"
                  >
                    {generateBookMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Generate Book
                      </>
                    )}
                  </Button>
                  {selectedRecipes.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Select at least one recipe to generate a book
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-3">What's included:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5" />
                    Beautiful cover page with your title
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5" />
                    Table of contents
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5" />
                    Full recipe pages with photos
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-accent mt-0.5" />
                    Print-friendly formatting
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
