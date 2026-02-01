import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ChefHat, 
  Clock, 
  Heart,
  Users,
  Compass
} from "lucide-react";

interface SocialRecipe {
  id: number;
  title: string;
  description: string | null;
  coverImage: string | null;
  servings: number | null;
  prepTime: number | null;
  cookTime: number | null;
  createdAt: Date;
  author: {
    id: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    profileName: string | null;
    profileImageUrl: string | null;
  };
  likeCount: number;
  isLiked?: boolean;
}

export default function ExplorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const limit = 12;

  const { data: recipes, isLoading } = useQuery<SocialRecipe[]>({
    queryKey: [`/api/explore?limit=${limit}&offset=${page * limit}`],
  });

  const likeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      await apiRequest("POST", `/api/recipes/${recipeId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        (query.queryKey[0]?.toString().startsWith('/api/explore')) ?? false
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to like recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async (recipeId: number) => {
      await apiRequest("DELETE", `/api/recipes/${recipeId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        (query.queryKey[0]?.toString().startsWith('/api/explore')) ?? false
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unlike recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDisplayName = (author: SocialRecipe["author"]) => {
    if (author.profileName) {
      return author.profileName;
    }
    if (author.firstName) {
      return author.firstName;
    }
    return author.username || "Chef";
  };

  const getInitials = (author: SocialRecipe["author"]) => {
    if (author.firstName && author.lastName) {
      return `${author.firstName[0]}${author.lastName[0]}`.toUpperCase();
    }
    if (author.username) {
      return author.username.slice(0, 2).toUpperCase();
    }
    return "CH";
  };

  const handleLikeToggle = (recipe: SocialRecipe, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like recipes.",
      });
      return;
    }

    if (recipe.isLiked) {
      unlikeMutation.mutate(recipe.id);
    } else {
      likeMutation.mutate(recipe.id);
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Compass className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold font-playfair">Explore</h1>
          <p className="text-muted-foreground">Discover recipes from chefs around the world</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : recipes && recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <Card className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col" data-testid={`card-recipe-${recipe.id}`}>
                  <div className="aspect-video relative bg-muted">
                    {recipe.coverImage ? (
                      <img
                        src={recipe.coverImage}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold line-clamp-1 mb-1" data-testid={`text-recipe-title-${recipe.id}`}>
                      {recipe.title}
                    </h3>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {recipe.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
                      <Link href={`/user/${recipe.author.id}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2 hover:opacity-80">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={recipe.author.profileImageUrl || undefined} alt={getDisplayName(recipe.author)} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {getInitials(recipe.author)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                            {getDisplayName(recipe.author)}
                          </span>
                        </div>
                      </Link>

                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {(recipe.prepTime || recipe.cookTime) && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {(recipe.prepTime || 0) + (recipe.cookTime || 0)}m
                          </span>
                        )}
                        <button
                          onClick={(e) => handleLikeToggle(recipe, e)}
                          className={`flex items-center gap-1 transition-colors ${
                            recipe.isLiked ? "text-red-500" : "hover:text-red-500"
                          }`}
                          data-testid={`button-like-${recipe.id}`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${recipe.isLiked ? "fill-current" : ""}`} />
                          {recipe.likeCount}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {recipes.length >= limit && (
            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold mb-2">No Public Recipes Yet</h2>
          <p className="text-muted-foreground mb-6">
            Be the first to share a recipe with the community!
          </p>
          {user && (
            <Button asChild>
              <Link href="/new-recipe">Create a Recipe</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
