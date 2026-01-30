import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Mic, Camera, BookOpen, Flame, Sparkles, FileText, ChefHat, UtensilsCrossed } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <UtensilsCrossed className="w-7 h-7 text-primary" />
              <div className="absolute inset-0 blur-sm bg-primary/30 -z-10" />
            </div>
            <span className="font-serif text-xl tracking-wide">RecipeVault</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild data-testid="link-login">
              <a href="/api/login">Enter</a>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-screen flex items-center justify-center pt-16">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-accent/5 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/3 blur-[100px] animate-flicker" />
          </div>
          
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-80 door-glow opacity-60" />
          
          <div className="relative container mx-auto px-4 max-w-5xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground mb-4">
              <Flame className="w-4 h-4 text-primary animate-flicker" />
              <span>Where culinary stories come to life</span>
            </div>
            
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-medium leading-tight tracking-tight">
              Your Personal
              <br />
              <span className="text-primary">Kitchen Archive</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Step through the velvet curtain into your private culinary sanctuary. 
              Speak your recipes aloud, capture the artistry of each cooking stage, 
              and craft timeless recipe collections worthy of the finest tables.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="min-w-48 text-base" asChild data-testid="button-hero-cta">
                <a href="/api/login">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Enter the Kitchen
                </a>
              </Button>
              <Button size="lg" variant="outline" className="min-w-48 text-base backdrop-blur-sm" asChild>
                <a href="#features">
                  Discover More
                </a>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground pt-8">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary glow-amber" />
                Voice-to-Recipe
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary glow-amber" />
                AI Photography
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary glow-amber" />
                Artisan Books
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/50 animate-bounce">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/50 to-transparent" />
          </div>
        </section>

        <section id="features" className="py-32 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
          
          <div className="container mx-auto max-w-6xl relative">
            <div className="text-center mb-20">
              <span className="text-primary text-sm uppercase tracking-[0.2em] font-medium">The Experience</span>
              <h2 className="font-serif text-4xl sm:text-5xl font-medium mt-4 mb-6">
                A Symphony of Flavors
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                Like a well-orchestrated kitchen, every element works in harmony
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 group hover-elevate">
                <CardContent className="pt-10 pb-8 text-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-8 group-hover:glow-warm transition-all duration-500">
                    <Mic className="w-9 h-9 text-primary" />
                    <div className="absolute inset-0 rounded-full chrome-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">
                    Speak Your Art
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Narrate your culinary creations naturally. Our AI captures every nuance, 
                    from precise measurements to those special family touches.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 group hover-elevate">
                <CardContent className="pt-10 pb-8 text-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mx-auto mb-8 group-hover:glow-warm transition-all duration-500">
                    <Camera className="w-9 h-9 text-accent" />
                    <div className="absolute inset-0 rounded-full chrome-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">
                    Capture the Moment
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Document each stage of preparation. AI recognizes cooking phases 
                    and weaves your photos seamlessly into the recipe narrative.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 group hover-elevate">
                <CardContent className="pt-10 pb-8 text-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mx-auto mb-8 group-hover:glow-warm transition-all duration-500">
                    <BookOpen className="w-9 h-9 text-primary" />
                    <div className="absolute inset-0 rounded-full chrome-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <h3 className="font-serif text-2xl font-medium mb-4">
                    Craft Your Legacy
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Transform your collection into elegant recipe cards or bound volumes.
                    Share your culinary heritage with those who matter most.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-32 px-4 relative overflow-hidden">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-48 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-48 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
          
          <div className="container mx-auto max-w-4xl text-center relative">
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-[400px] h-[400px] rounded-full bg-primary/5 blur-[80px] animate-flicker" />
            </div>
            
            <span className="text-primary text-sm uppercase tracking-[0.2em] font-medium">Begin Your Journey</span>
            <h2 className="font-serif text-4xl sm:text-5xl font-medium mt-4 mb-6">
              The Kitchen Awaits
            </h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
              Push through the swinging doors and step into a world where every recipe 
              tells a story, every dish becomes a memory, and your culinary passion 
              finds its permanent home.
            </p>
            
            <Button size="lg" className="min-w-56 text-base" asChild data-testid="button-footer-cta">
              <a href="/api/login">
                <ChefHat className="w-5 h-5 mr-2" />
                Step Inside
              </a>
            </Button>
            
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
              <div className="text-center">
                <div className="font-serif text-3xl font-medium text-primary">AI</div>
                <div className="text-sm text-muted-foreground mt-1">Powered</div>
              </div>
              <div className="text-center border-x border-border/50">
                <div className="font-serif text-3xl font-medium text-primary">Free</div>
                <div className="text-sm text-muted-foreground mt-1">To Start</div>
              </div>
              <div className="text-center">
                <div className="font-serif text-3xl font-medium text-primary">Print</div>
                <div className="text-sm text-muted-foreground mt-1">Ready</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-10 px-4 bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            <span className="font-serif tracking-wide">RecipeVault</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Crafted for those who cook with passion
          </p>
        </div>
      </footer>
    </div>
  );
}
