import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ImagePlus,
  X,
  Loader2,
  Save,
  GripVertical,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { convertToJpeg } from "@/lib/image-utils";
import type { FullRecipe, RecipeImage, RecipeStep } from "@shared/schema";

interface EditableIngredient {
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface EditableStep {
  stepNumber: number;
  instruction: string;
  duration: number | null;
}

export default function EditRecipe() {
  const [match, params] = useRoute("/recipe/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedStepForImage, setSelectedStepForImage] = useState<number | null>(null);

  const recipeId = params?.id;

  const { data: recipe, isLoading } = useQuery<FullRecipe>({
    queryKey: ["/api/recipes", recipeId],
    enabled: !!recipeId,
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState<number | null>(null);
  const [prepTime, setPrepTime] = useState<number | null>(null);
  const [cookTime, setCookTime] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<EditableIngredient[]>([]);
  const [steps, setSteps] = useState<EditableStep[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageChanged, setCoverImageChanged] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [photoFilter, setPhotoFilter] = useState<"all" | "unassigned">("all");
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (recipe && !initialized) {
      setTitle(recipe.title);
      setDescription(recipe.description || "");
      setServings(recipe.servings);
      setPrepTime(recipe.prepTime);
      setCookTime(recipe.cookTime);
      setCoverImage(recipe.coverImage || null);
      setIngredients(
        recipe.ingredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity || "",
          unit: ing.unit || "",
          notes: ing.notes || "",
        }))
      );
      setSteps(
        recipe.steps.map((s) => ({
          stepNumber: s.stepNumber,
          instruction: s.instruction,
          duration: s.duration,
        }))
      );
      setInitialized(true);
    }
  }, [recipe, initialized]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title,
        description,
        servings,
        prepTime,
        cookTime,
        ingredients: ingredients.filter((ing) => ing.name.trim()),
        steps: steps.map((s, i) => ({ ...s, stepNumber: i + 1 })),
      };
      
      // Only include coverImage if it was explicitly changed
      if (coverImageChanged) {
        payload.coverImage = coverImage;
      }
      
      const response = await apiRequest("PUT", `/api/recipes/${recipeId}`, payload);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId] });
      toast({
        title: "Recipe updated",
        description: "Your changes have been saved.",
      });
      setLocation(`/recipe/${recipeId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addImageMutation = useMutation({
    mutationFn: async ({ imageData, stepId }: { imageData: string; stepId?: number }) => {
      const response = await apiRequest("POST", `/api/recipes/${recipeId}/images`, {
        imageData,
        stepId,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId] });
      toast({ title: "Image added" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add image.",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      await apiRequest("DELETE", `/api/recipes/${recipeId}/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId] });
      toast({ title: "Image removed" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove image.",
        variant: "destructive",
      });
    },
  });

  const updateImageStepMutation = useMutation({
    mutationFn: async ({ imageId, stepId }: { imageId: number; stepId: number | null }) => {
      const response = await apiRequest("PATCH", `/api/recipes/${recipeId}/images/${imageId}`, {
        stepId,
      });
      return await response.json();
    },
    onMutate: async ({ imageId, stepId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/recipes", recipeId] });
      
      // Snapshot the previous value
      const previousRecipe = queryClient.getQueryData(["/api/recipes", recipeId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(["/api/recipes", recipeId], (old: FullRecipe | undefined) => {
        if (!old) return old;
        return {
          ...old,
          images: old.images.map((img: RecipeImage) => 
            img.id === imageId ? { ...img, stepId } : img
          ),
        };
      });
      
      return { previousRecipe };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousRecipe) {
        queryClient.setQueryData(["/api/recipes", recipeId], context.previousRecipe);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId] });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, stepId?: number) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (const file of Array.from(files)) {
      try {
        const imageData = await convertToJpeg(file);
        await addImageMutation.mutateAsync({ imageData, stepId });
      } catch (error) {
        toast({
          title: "Image error",
          description: error instanceof Error ? error.message : "Failed to process image",
          variant: "destructive",
        });
      }
    }
    e.target.value = "";
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "", notes: "" }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof EditableIngredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, { stepNumber: steps.length + 1, instruction: "", duration: null }]);
  };

  const handleCoverImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const convertedDataUrl = await convertToJpeg(file);
      setCoverImage(convertedDataUrl);
      setCoverImageChanged(true);
    } catch (error) {
      console.error("Error processing cover image:", error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImageChanged(true);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof EditableStep, value: string | number | null) => {
    const updated = [...steps];
    (updated[index] as any)[field] = value;
    setSteps(updated);
  };

  if (isLoading || !initialized) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Recipe not found.</p>
      </div>
    );
  }

  const getStepImages = (stepId: number) => {
    return recipe.images.filter((img) => img.stepId === stepId);
  };

  const unassignedImages = recipe.images.filter((img) => !img.stepId);

  // Check if an image matches the cover image
  const isCoverImage = (img: RecipeImage): boolean => {
    if (!coverImage) return false;
    const imgUrl = img.imageUrl || `data:image/jpeg;base64,${img.imageData}`;
    return imgUrl === coverImage;
  };

  // Get indicator for where an image is used
  const getImageIndicator = (img: RecipeImage): { type: "step" | "cover"; label: string } | null => {
    if (isCoverImage(img)) {
      return { type: "cover", label: "C" };
    }
    if (img.stepId) {
      const step = recipe.steps.find(s => s.id === img.stepId);
      return step ? { type: "step", label: String(step.stepNumber) } : null;
    }
    return null;
  };

  // Build cover image item for display (if exists and from recipe images)
  type CoverOnlyImage = { id: "cover"; isCoverOnly: true; imageUrl: string };
  type DisplayImage = RecipeImage | CoverOnlyImage;
  
  // All images for "All Photos" view - include cover if it exists but isn't in recipe.images
  const coverExistsInImages = coverImage && recipe.images.some(img => {
    const imgUrl = img.imageUrl || `data:image/jpeg;base64,${img.imageData}`;
    return imgUrl === coverImage;
  });
  
  const coverOnlyItem: CoverOnlyImage | null = coverImage && !coverExistsInImages 
    ? { id: "cover", isCoverOnly: true as const, imageUrl: coverImage } 
    : null;
  
  const allImages: DisplayImage[] = [
    // Add cover as standalone item if it exists but isn't from recipe.images
    ...(coverOnlyItem ? [coverOnlyItem] : []),
    ...recipe.images,
  ];

  // Images to display based on current filter
  const displayedImages: DisplayImage[] = photoFilter === "all" ? allImages : unassignedImages;

  // Handler to set an image as cover
  const setImageAsCover = async (img: RecipeImage) => {
    const imageUrl = img.imageUrl || `data:image/jpeg;base64,${img.imageData}`;
    setCoverImage(imageUrl);
    setCoverImageChanged(true);
    toast({ title: "Cover image updated", description: "Save changes to apply." });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild data-testid="link-back">
              <Link href={`/recipe/${recipeId}`}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-serif text-2xl font-bold">Edit Recipe</h1>
          </div>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            data-testid="button-save"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Title Image</Label>
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleCoverImageSelect}
                  className="hidden"
                  data-testid="input-cover-image"
                />
                {coverImage ? (
                  <div className="relative mt-2">
                    <img
                      src={coverImage}
                      alt="Cover"
                      className="w-full h-48 object-cover rounded-lg border border-border"
                      data-testid="img-cover-preview"
                    />
                    <div className="absolute top-2 right-2 flex gap-2">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => coverImageInputRef.current?.click()}
                        data-testid="button-change-cover"
                      >
                        <ImagePlus className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={removeCoverImage}
                        data-testid="button-remove-cover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverImageInputRef.current?.click()}
                    className="mt-2 border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover-elevate transition-colors"
                    data-testid="button-add-cover"
                  >
                    <ImagePlus className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to add a title image</p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Recipe title"
                  data-testid="input-title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of the recipe"
                  data-testid="input-description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="servings">Servings</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={servings ?? ""}
                    onChange={(e) => setServings(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="4"
                    data-testid="input-servings"
                  />
                </div>
                <div>
                  <Label htmlFor="prepTime">Prep Time (min)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    value={prepTime ?? ""}
                    onChange={(e) => setPrepTime(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="15"
                    data-testid="input-prep-time"
                  />
                </div>
                <div>
                  <Label htmlFor="cookTime">Cook Time (min)</Label>
                  <Input
                    id="cookTime"
                    type="number"
                    value={cookTime ?? ""}
                    onChange={(e) => setCookTime(e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="30"
                    data-testid="input-cook-time"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Ingredients</CardTitle>
              <Button variant="outline" size="sm" onClick={addIngredient} data-testid="button-add-ingredient">
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {ingredients.map((ing, index) => (
                <div key={index} className="flex gap-2 items-start" data-testid={`ingredient-row-${index}`}>
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <Input
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                      placeholder="Qty"
                      className="text-sm"
                    />
                    <Input
                      value={ing.unit}
                      onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                      placeholder="Unit"
                      className="text-sm"
                    />
                    <Input
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      placeholder="Ingredient name"
                      className="col-span-2 text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {ingredients.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No ingredients yet. Click "Add" to add one.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Instructions</CardTitle>
              <Button variant="outline" size="sm" onClick={addStep} data-testid="button-add-step">
                <Plus className="w-4 h-4 mr-1" /> Add Step
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {steps.map((step, index) => {
                const stepFromRecipe = recipe.steps.find((s) => s.stepNumber === step.stepNumber);
                const stepImages = stepFromRecipe ? getStepImages(stepFromRecipe.id) : [];

                return (
                  <div key={index} className="border rounded-lg p-4" data-testid={`step-row-${index}`}>
                    <div className="flex gap-3 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium flex-shrink-0 text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <Textarea
                          value={step.instruction}
                          onChange={(e) => updateStep(index, "instruction", e.target.value)}
                          placeholder="Describe this step..."
                          className="min-h-20"
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Duration:</Label>
                            <Input
                              type="number"
                              value={step.duration ?? ""}
                              onChange={(e) =>
                                updateStep(index, "duration", e.target.value ? parseInt(e.target.value) : null)
                              }
                              placeholder="min"
                              className="w-20 text-sm"
                            />
                          </div>
                          {stepFromRecipe && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStepForImage(stepFromRecipe.id);
                                stepFileInputRef.current?.click();
                              }}
                            >
                              <ImagePlus className="w-4 h-4 mr-1" /> Add Photo
                            </Button>
                          )}
                        </div>
                        {stepImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {stepImages.map((img) => {
                              const otherSteps = recipe.steps.filter(s => s.id !== stepFromRecipe?.id);
                              return (
                                <div key={img.id} className="relative group w-24 h-24">
                                  <img
                                    src={img.imageUrl || `data:image/jpeg;base64,${img.imageData}`}
                                    alt={img.stageDescription || "Step photo"}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute -top-2 -right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        data-testid={`button-step-image-menu-${img.id}`}
                                      >
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {otherSteps.map((otherStep) => (
                                        <DropdownMenuItem
                                          key={otherStep.id}
                                          onClick={() => updateImageStepMutation.mutate({ imageId: img.id, stepId: otherStep.id })}
                                          data-testid={`menu-move-to-step-${otherStep.stepNumber}`}
                                        >
                                          Move to Step {otherStep.stepNumber}
                                        </DropdownMenuItem>
                                      ))}
                                      {otherSteps.length > 0 && <DropdownMenuSeparator />}
                                      <DropdownMenuItem
                                        onClick={() => updateImageStepMutation.mutate({ imageId: img.id, stepId: null })}
                                        data-testid="menu-remove-from-step"
                                      >
                                        Remove from step
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStep(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {steps.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No instructions yet. Click "Add Step" to add one.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg">Photos</CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex rounded-md border border-border overflow-hidden">
                  <Button
                    variant={photoFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setPhotoFilter("all")}
                    data-testid="button-filter-all"
                  >
                    All Photos
                  </Button>
                  <Button
                    variant={photoFilter === "unassigned" ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none"
                    onClick={() => setPhotoFilter("unassigned")}
                    data-testid="button-filter-unassigned"
                  >
                    Additional photos
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} data-testid="button-add-photo">
                  <ImagePlus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                multiple
                onChange={(e) => handleFileSelect(e)}
                className="hidden"
              />
              <input
                ref={stepFileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                onChange={(e) => handleFileSelect(e, selectedStepForImage ?? undefined)}
                className="hidden"
              />
              {displayedImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {displayedImages.map((img) => {
                    const isCoverOnly = "isCoverOnly" in img && img.isCoverOnly;
                    const imgUrl = isCoverOnly ? img.imageUrl : (img.imageUrl || `data:image/jpeg;base64,${(img as RecipeImage).imageData}`);
                    const indicator = isCoverOnly ? { type: "cover" as const, label: "C" } : getImageIndicator(img as RecipeImage);
                    
                    return (
                      <div key={img.id} className="relative group aspect-square">
                        <img
                          src={imgUrl}
                          alt={isCoverOnly ? "Cover photo" : ((img as RecipeImage).stageDescription || "Recipe photo")}
                          className="w-full h-full object-cover rounded-md"
                        />
                        {indicator && (
                          <div 
                            className={`absolute top-1 left-1 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              indicator.type === "cover" 
                                ? "bg-amber-500 text-white" 
                                : "bg-primary text-primary-foreground"
                            }`}
                            title={indicator.type === "cover" ? "Cover" : `Step ${indicator.label}`}
                            data-testid={indicator.type === "cover" ? "indicator-cover" : `indicator-step-${indicator.label}`}
                          >
                            {indicator.label}
                          </div>
                        )}
                        {isCoverOnly ? (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setCoverImage(null);
                                setCoverImageChanged(true);
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Remove Cover
                            </Button>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-col items-center justify-center gap-2">
                            <Select
                              value=""
                              onValueChange={(value) => {
                                if (value === "cover") {
                                  setImageAsCover(img as RecipeImage);
                                } else if (value === "none") {
                                  updateImageStepMutation.mutate({
                                    imageId: (img as RecipeImage).id,
                                    stepId: null,
                                  });
                                } else if (value) {
                                  updateImageStepMutation.mutate({
                                    imageId: (img as RecipeImage).id,
                                    stepId: parseInt(value),
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="w-32 bg-white/90 text-xs h-8">
                                <SelectValue placeholder="Assign to..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cover">Cover</SelectItem>
                                <SelectItem value="none">Unassign</SelectItem>
                                {recipe.steps.map((s) => (
                                  <SelectItem key={s.id} value={s.id.toString()}>
                                    Step {s.stepNumber}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteImageMutation.mutate((img as RecipeImage).id)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" /> Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">
                  {photoFilter === "all" 
                    ? "No photos yet. Click \"Add Photo\" to upload images."
                    : "No unassigned photos. All photos are assigned to steps or the cover."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
