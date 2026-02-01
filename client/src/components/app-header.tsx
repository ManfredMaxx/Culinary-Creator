import { Link, useLocation } from "wouter";
import { LogOut, User, Compass, ChefHat, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export function AppHeader() {
  const { user, logout, isLoggingOut } = useAuth();
  const [location] = useLocation();

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer" data-testid="link-logo">
              <span className="text-2xl text-primary" style={{ fontFamily: "'Times New Roman', Times, serif" }}>bwr</span>
              <span className="font-serif text-xl tracking-wide hidden sm:inline">BakedWithRowan</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1">
            <Link href="/">
              <Button
                variant={isActive("/") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
                data-testid="link-my-recipes"
              >
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">My Recipes</span>
              </Button>
            </Link>
            <Link href="/explore">
              <Button
                variant={isActive("/explore") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
                data-testid="link-explore"
              >
                <Compass className="w-4 h-4" />
                <span className="hidden md:inline">Explore</span>
              </Button>
            </Link>
            <Link href="/chefs">
              <Button
                variant={isActive("/chefs") ? "secondary" : "ghost"}
                size="sm"
                className="gap-2"
                data-testid="link-chefs"
              >
                <ChefHat className="w-4 h-4" />
                <span className="hidden md:inline">My Chefs</span>
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </p>
                  {user?.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer" data-testid="link-profile">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="cursor-pointer"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Log out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
