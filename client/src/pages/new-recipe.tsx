import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Sparkles, Loader2, Check, Edit, Mic, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceRecorder } from "@/components/voice-recorder";
import { RecipeScanner } from "@/components/recipe-scanner";
import { ImageUploader } from "@/components/image-uploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { FullRecipe, Ingredient, RecipeStep } from "@shared/schema";
import { Link } from "wouter";

type RecipePreview = {
  title: string;
  description: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  ingredients: { name: string; quantity: string; unit: string; notes?: string }[];
  steps: { stepNumber: number; instruction: string; duration?: number }[];
};

export default function NewRecipe() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<"record" | "preview" | "photos">("record");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recipePreview, setRecipePreview] = useState<RecipePreview | null>(null);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isScanning, setIsScanning] = useState(false);

  const transcribeMutation = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      const base64Audio = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.readAsDataURL(audioBlob);
      });

      const response = await apiRequest("POST", "/api/transcribe-recipe", { audio: base64Audio });
      return await response.json() as RecipePreview;
    },
    onSuccess: (data) => {
      setRecipePreview(data);
      setStep("preview");
      setIsProcessing(false);
    },
    onError: (error) => {
      console.error("Transcription error:", error);
      toast({
        title: "Error",
        description: "Failed to process your recording. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const scanMutation = useMutation({
    mutationFn: async (images: string[]) => {
      const response = await apiRequest("POST", "/api/scan-recipe", { images });
      return await response.json() as RecipePreview;
    },
    onSuccess: (data) => {
      setRecipePreview(data);
      setStep("preview");
      setIsScanning(false);
    },
    onError: (error: Error) => {
      console.error("Scan error:", error);
      // Extract error message from server response if available
      let errorMessage = "Failed to extract recipe from images. Please try again with clearer images.";
      if (error.message) {
        try {
          const parsed = JSON.parse(error.message.replace(/^\d+:\s*/, ""));
          if (parsed.error) {
            errorMessage = parsed.error;
          }
        } catch {
          // If not JSON, check for common patterns
          if (error.message.includes("missing required fields")) {
            errorMessage = error.message.replace(/^\d+:\s*/, "");
          }
        }
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsScanning(false);
    },
  });

  const handleScanComplete = (images: string[]) => {
    setIsScanning(true);
    scanMutation.mutate(images);
  };

  const analyzeImagesMutation = useMutation({
    mutationFn: async (imageFiles: { file: File; preview: string }[]) => {
      const imageData = imageFiles.map((img) => img.preview);
      const response = await apiRequest("POST", "/api/analyze-images", { images: imageData });
      return await response.json() as { analyses: { description: string; suggestedStep: number }[] };
    },
  });

  const saveRecipeMutation = useMutation({
    mutationFn: async (data: {
      recipe: RecipePreview;
      images: { file: File; preview: string }[];
    }) => {
      const imageData = data.images.map((img) => img.preview);

      const transformedRecipe = {
        ...data.recipe,
        ingredients: data.recipe.ingredients.map(ing => ({
          ...ing,
          quantity: ing.quantity != null ? String(ing.quantity) : "",
          unit: ing.unit ?? "",
        })),
      };
      
      const response = await apiRequest("POST", "/api/recipes", {
        ...transformedRecipe,
        images: imageData,
      });
      return await response.json() as FullRecipe;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recipe saved!",
        description: `"${data.title}" has been added to your collection.`,
      });
      setLocation(`/recipe/${data.id}`);
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "Failed to save your recipe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRecordingComplete = (audioBlob: Blob) => {
    setIsProcessing(true);
    transcribeMutation.mutate(audioBlob);
  };

  const handleImagesUploaded = async (newImages: { file: File; preview: string }[]) => {
    setImages(newImages);
    if (newImages.length > 0) {
      setIsAnalyzing(true);
      try {
        await analyzeImagesMutation.mutateAsync(newImages);
      } catch (error) {
        console.error("Image analysis error:", error);
      }
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!recipePreview) return;
    saveRecipeMutation.mutate({ recipe: recipePreview, images });
  };

  const updateRecipeField = (field: keyof RecipePreview, value: any) => {
    if (!recipePreview) return;
    setRecipePreview({ ...recipePreview, [field]: value });
  };

  const updateIngredient = (index: number, field: string, value: string) => {
    if (!recipePreview) return;
    const newIngredients = [...recipePreview.ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setRecipePreview({ ...recipePreview, ingredients: newIngredients });
  };

  const updateStep = (index: number, instruction: string) => {
    if (!recipePreview) return;
    const newSteps = [...recipePreview.steps];
    newSteps[index] = { ...newSteps[index], instruction };
    setRecipePreview({ ...recipePreview, steps: newSteps });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild data-testid="link-back">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold">Create New Recipe</h1>
            <p className="text-muted-foreground">
              {step === "record" && "Record your recipe verbally"}
              {step === "preview" && "Review and edit your recipe"}
              {step === "photos" && "Add cooking stage photos"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step === "record"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground"
              }`}
            >
              {step !== "record" ? <Check className="w-5 h-5" /> : "1"}
            </div>
            <span className="text-sm font-medium">Input</span>
            <div className="w-12 h-0.5 bg-border mx-2" />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step === "preview"
                  ? "bg-primary text-primary-foreground"
                  : step === "photos"
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step === "photos" ? <Check className="w-5 h-5" /> : "2"}
            </div>
            <span className="text-sm font-medium">Review</span>
            <div className="w-12 h-0.5 bg-border mx-2" />
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                step === "photos"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <span className="text-sm font-medium">Photos</span>
          </div>
        </div>

        {step === "record" && (
          <Tabs defaultValue="voice" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="voice" data-testid="tab-voice">
                <Mic className="w-4 h-4 mr-2" />
                Voice Recording
              </TabsTrigger>
              <TabsTrigger value="scan" data-testid="tab-scan">
                <Scan className="w-4 h-4 mr-2" />
                Scan Recipe
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="voice" className="space-y-6">
              <VoiceRecorder
                onRecordingComplete={handleRecordingComplete}
                isProcessing={isProcessing}
              />
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-3">Tips for a great recording:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      Start with the recipe name and a brief description
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      List all ingredients with quantities (e.g., "2 cups flour, 1 teaspoon salt")
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      Describe each step in order, mentioning timing when relevant
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      Mention serving size, prep time, and cook time if you know them
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="scan" className="space-y-6">
              <RecipeScanner
                onScanComplete={handleScanComplete}
                isProcessing={isScanning}
              />
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-3">Tips for scanning recipes:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      Take clear, well-lit photos of recipe pages
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      Upload multiple images if the recipe spans several pages
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      Works with printed recipes, cookbooks, or handwritten notes
                    </li>
                    <li className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                      Make sure the text is readable and not blurry
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {step === "preview" && recipePreview && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Recipe Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="title">Recipe Title</Label>
                    <Input
                      id="title"
                      value={recipePreview.title ?? ""}
                      onChange={(e) => updateRecipeField("title", e.target.value)}
                      data-testid="input-recipe-title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={recipePreview.description ?? ""}
                      onChange={(e) => updateRecipeField("description", e.target.value)}
                      rows={3}
                      data-testid="input-recipe-description"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="servings">Servings</Label>
                      <Input
                        id="servings"
                        type="number"
                        value={recipePreview.servings ?? ""}
                        onChange={(e) => updateRecipeField("servings", parseInt(e.target.value) || 0)}
                        data-testid="input-servings"
                      />
                    </div>
                    <div>
                      <Label htmlFor="prepTime">Prep Time (min)</Label>
                      <Input
                        id="prepTime"
                        type="number"
                        value={recipePreview.prepTime ?? ""}
                        onChange={(e) => updateRecipeField("prepTime", parseInt(e.target.value) || 0)}
                        data-testid="input-prep-time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cookTime">Cook Time (min)</Label>
                      <Input
                        id="cookTime"
                        type="number"
                        value={recipePreview.cookTime ?? ""}
                        onChange={(e) => updateRecipeField("cookTime", parseInt(e.target.value) || 0)}
                        data-testid="input-cook-time"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ingredients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(recipePreview.ingredients || []).map((ingredient, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <Input
                      className="col-span-2"
                      placeholder="Qty"
                      value={ingredient.quantity ?? ""}
                      onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                      data-testid={`input-ingredient-qty-${index}`}
                    />
                    <Input
                      className="col-span-2"
                      placeholder="Unit"
                      value={ingredient.unit ?? ""}
                      onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                      data-testid={`input-ingredient-unit-${index}`}
                    />
                    <Input
                      className="col-span-8"
                      placeholder="Ingredient"
                      value={ingredient.name ?? ""}
                      onChange={(e) => updateIngredient(index, "name", e.target.value)}
                      data-testid={`input-ingredient-name-${index}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(recipePreview.steps || []).map((recipeStep, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium flex-shrink-0">
                      {recipeStep.stepNumber}
                    </div>
                    <Textarea
                      value={recipeStep.instruction ?? ""}
                      onChange={(e) => updateStep(index, e.target.value)}
                      rows={2}
                      className="flex-1"
                      data-testid={`input-step-${index}`}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setStep("record")} data-testid="button-re-record">
                Re-record
              </Button>
              <Button onClick={() => setStep("photos")} data-testid="button-add-photos">
                Add Photos
              </Button>
            </div>
          </div>
        )}

        {step === "photos" && recipePreview && (
          <div className="space-y-6">
            <ImageUploader
              onImagesUploaded={handleImagesUploaded}
              isAnalyzing={isAnalyzing}
            />

            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Photo tips:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    Add photos of key cooking stages - prep, cooking, and finished dish
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    Our AI will recognize what's happening in each photo
                  </li>
                  <li className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                    Photos will be matched to the relevant recipe steps
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("preview")} data-testid="button-back-to-preview">
                Back to Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveRecipeMutation.isPending}
                data-testid="button-save-recipe"
              >
                {saveRecipeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Recipe
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
