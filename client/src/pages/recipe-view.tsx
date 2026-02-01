import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import {
  ArrowLeft,
  Clock,
  Users,
  Printer,
  Trash2,
  Edit,
  ChefHat,
  Loader2,
  Heart,
  Globe,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import type { FullRecipe } from "@shared/schema";

export default function RecipeView() {
  const [match, params] = useRoute("/recipe/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const recipeId = params?.id;

  const { data: recipe, isLoading } = useQuery<FullRecipe>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId,
  });

  const { data: likeStatus } = useQuery<{ isLiked: boolean; likeCount: number }>({
    queryKey: [`/api/recipes/${recipeId}/like-status`],
    enabled: !!recipeId,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/recipes/${recipeId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/recipes/${recipeId}/like-status`] });
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
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/recipes/${recipeId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/recipes/${recipeId}/like-status`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unlike recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLikeToggle = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like recipes.",
      });
      return;
    }
    if (likeStatus?.isLiked) {
      unlikeMutation.mutate();
    } else {
      likeMutation.mutate();
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/recipes/${recipeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recipe deleted",
        description: "The recipe has been removed from your collection.",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePrint = () => {
    window.open(`/api/recipes/${recipeId}/print`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="aspect-video rounded-xl mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-4">
              <Skeleton className="h-6 w-32" />
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-6 w-32" />
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-serif text-2xl font-semibold mb-3">
              Recipe not found
            </h2>
            <p className="text-muted-foreground mb-6">
              This recipe may have been deleted or doesn't exist.
            </p>
            <Button asChild>
              <Link href="/">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild data-testid="link-back">
              <Link href="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="font-serif text-3xl font-bold" data-testid="text-recipe-title">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="text-muted-foreground mt-1">{recipe.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLikeToggle}
              disabled={likeMutation.isPending || unlikeMutation.isPending}
              data-testid="button-like"
            >
              <Heart className={`w-4 h-4 mr-2 ${likeStatus?.isLiked ? "fill-primary text-primary" : ""}`} />
              {likeStatus?.likeCount ?? 0}
            </Button>
            {user && user.id === recipe.userId && (
              <>
                <Button variant="outline" size="icon" asChild data-testid="button-edit">
                  <Link href={`/recipe/${recipeId}/edit`}>
                    <Edit className="w-4 h-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" onClick={handlePrint} data-testid="button-print">
                  <Printer className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" data-testid="button-delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Recipe</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{recipe.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            {user && user.id !== recipe.userId && (
              <Button variant="outline" size="icon" onClick={handlePrint} data-testid="button-print">
                <Printer className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {recipe.coverImage && (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-8">
            <img
              src={recipe.coverImage}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-4 mb-8">
          {user && user.id === recipe.userId && (
            <Badge 
              variant={recipe.isPublic ? "default" : "secondary"} 
              className={`text-base px-4 py-2 gap-2 ${recipe.isPublic ? "bg-primary/10 text-primary" : ""}`}
            >
              {recipe.isPublic ? (
                <>
                  <Globe className="w-4 h-4" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Private
                </>
              )}
            </Badge>
          )}
          {totalTime > 0 && (
            <Badge variant="secondary" className="text-base px-4 py-2 gap-2">
              <Clock className="w-4 h-4" />
              {totalTime} minutes total
            </Badge>
          )}
          {recipe.prepTime && recipe.prepTime > 0 && (
            <Badge variant="outline" className="text-base px-4 py-2">
              Prep: {recipe.prepTime} min
            </Badge>
          )}
          {recipe.cookTime && recipe.cookTime > 0 && (
            <Badge variant="outline" className="text-base px-4 py-2">
              Cook: {recipe.cookTime} min
            </Badge>
          )}
          {recipe.servings && (
            <Badge variant="secondary" className="text-base px-4 py-2 gap-2">
              <Users className="w-4 h-4" />
              {recipe.servings} servings
            </Badge>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ingredients</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li
                      key={ingredient.id}
                      className="flex items-start gap-2"
                      data-testid={`ingredient-${index}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>
                        <span className="font-medium">
                          {ingredient.quantity} {ingredient.unit}
                        </span>{" "}
                        {ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}
                        {ingredient.notes && (
                          <span className="text-muted-foreground text-sm">
                            {" "}
                            ({ingredient.notes})
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-6">
                  {recipe.steps.map((recipeStep, index) => {
                    const stepImage = recipe.images.find(
                      (img) => img.stepId === recipeStep.id
                    );
                    return (
                      <li key={recipeStep.id} className="flex gap-4" data-testid={`step-${index}`}>
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium flex-shrink-0">
                          {recipeStep.stepNumber}
                        </div>
                        <div className="flex-1 space-y-3">
                          <p className="leading-relaxed">{recipeStep.instruction}</p>
                          {recipeStep.duration && (
                            <Badge variant="outline" className="gap-1">
                              <Clock className="w-3 h-3" />
                              {recipeStep.duration} min
                            </Badge>
                          )}
                          {stepImage && (
                            <div className="mt-3 rounded-lg overflow-hidden bg-muted max-w-sm">
                              <img
                                src={stepImage.imageUrl || `data:image/jpeg;base64,${stepImage.imageData}`}
                                alt={stepImage.stageDescription || `Step ${recipeStep.stepNumber}`}
                                className="w-full h-auto"
                              />
                              {stepImage.stageDescription && (
                                <p className="text-sm text-muted-foreground p-2">
                                  {stepImage.stageDescription}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>

        {recipe.images.filter((img) => !img.stepId).length > 0 && (
          <>
            <Separator className="my-8" />
            <div>
              <h2 className="font-serif text-xl font-semibold mb-4">
                Additional Photos
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recipe.images
                  .filter((img) => !img.stepId)
                  .map((image, index) => (
                    <div
                      key={image.id}
                      className="aspect-square rounded-lg overflow-hidden bg-muted"
                      data-testid={`additional-image-${index}`}
                    >
                      <img
                        src={image.imageUrl || `data:image/jpeg;base64,${image.imageData}`}
                        alt={image.stageDescription || `Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
