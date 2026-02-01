import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { AppHeader } from "@/components/app-header";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import NewRecipe from "@/pages/new-recipe";
import RecipeView from "@/pages/recipe-view";
import EditRecipe from "@/pages/edit-recipe";
import RecipeBook from "@/pages/recipe-book";
import Profile from "@/pages/profile";
import Explore from "@/pages/explore";
import Chefs from "@/pages/chefs";
import UserProfile from "@/pages/user-profile";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedRoutes() {
  return (
    <>
      <AppHeader />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/new" component={NewRecipe} />
        <Route path="/recipe/:id" component={RecipeView} />
        <Route path="/recipe/:id/edit" component={EditRecipe} />
        <Route path="/book" component={RecipeBook} />
        <Route path="/profile" component={Profile} />
        <Route path="/explore" component={Explore} />
        <Route path="/chefs" component={Chefs} />
        <Route path="/user/:userId" component={UserProfile} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function PublicRoutes() {
  return (
    <>
      <AppHeader />
      <Switch>
        <Route path="/explore" component={Explore} />
        <Route path="/recipe/:id" component={RecipeView} />
        <Route path="/user/:userId" component={UserProfile} />
        <Route component={Landing} />
      </Switch>
    </>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedRoutes />;
  }

  return <PublicRoutes />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="recipe-vault-theme">
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
