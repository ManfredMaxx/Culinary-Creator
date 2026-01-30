import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mic, Camera, BookOpen, ChefHat, Sparkles, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary" />
            <span className="font-serif text-xl font-bold">RecipeVault</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="link-login">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                  Turn Your{" "}
                  <span className="text-primary">Cooking Stories</span> Into
                  Beautiful Recipes
                </h1>
                <p className="text-lg text-muted-foreground max-w-lg">
                  Describe your recipe verbally, capture cooking stages with photos,
                  and create stunning printable recipe books to share with family and friends.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild data-testid="button-hero-cta">
                    <a href="/api/login">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Creating Recipes
                    </a>
                  </Button>
                </div>
                <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    Free to use
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    AI-powered
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    Printable books
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 p-1">
                  <div className="w-full h-full rounded-xl bg-card flex items-center justify-center overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 p-6 w-full">
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Mic className="w-12 h-12 text-primary" />
                      </div>
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
                        <Camera className="w-12 h-12 text-accent" />
                      </div>
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-secondary/60 to-secondary/30 flex items-center justify-center">
                        <FileText className="w-12 h-12 text-secondary-foreground/70" />
                      </div>
                      <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Creating and preserving your recipes has never been easier
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none bg-card/50">
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <Mic className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3">
                    1. Record Your Recipe
                  </h3>
                  <p className="text-muted-foreground">
                    Simply talk about your recipe - describe ingredients, quantities, 
                    and steps naturally. Our AI transforms it into a structured recipe.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none bg-card/50">
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                    <Camera className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3">
                    2. Add Cooking Photos
                  </h3>
                  <p className="text-muted-foreground">
                    Upload photos from different cooking stages. AI identifies what's 
                    happening and integrates them into your recipe steps.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none bg-card/50">
                <CardContent className="pt-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3">
                    3. Create Recipe Books
                  </h3>
                  <p className="text-muted-foreground">
                    Generate beautiful one-page recipe cards or compile multiple 
                    recipes into a stunning printable cookbook.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="font-serif text-3xl font-bold mb-4">
              Ready to Preserve Your Recipes?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join home cooks who are turning their kitchen wisdom into beautiful, 
              shareable recipe collections.
            </p>
            <Button size="lg" asChild data-testid="button-footer-cta">
              <a href="/api/login">
                <ChefHat className="w-5 h-5 mr-2" />
                Start Free
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            <span className="font-serif font-semibold">RecipeVault</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Made with love for home cooks everywhere
          </p>
        </div>
      </footer>
    </div>
  );
}
