import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  UserPlus, 
  UserMinus, 
  Users, 
  ChefHat, 
  Clock, 
  Heart,
  ArrowLeft
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  followerCount: number;
  followingCount: number;
  recipeCount: number;
}

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
    profileImageUrl: string | null;
  };
  likeCount: number;
}

export default function UserProfilePage() {
  const [, params] = useRoute("/user/:userId");
  const userId = params?.userId;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isOwnProfile = currentUser?.id === userId;

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}/profile`],
    enabled: !!userId,
  });

  const { data: recipes, isLoading: recipesLoading } = useQuery<SocialRecipe[]>({
    queryKey: [`/api/users/${userId}/recipes`],
    enabled: !!userId,
  });

  const { data: followStatus } = useQuery<{ isFollowing: boolean }>({
    queryKey: [`/api/users/${userId}/following-status`],
    enabled: !!userId && !!currentUser && !isOwnProfile,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following-status`] });
      toast({
        title: "Followed",
        description: `You are now following ${profile?.firstName || profile?.username || "this user"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to follow user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/users/${userId}/follow`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/profile`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/following-status`] });
      toast({
        title: "Unfollowed",
        description: `You have unfollowed ${profile?.firstName || profile?.username || "this user"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to unfollow user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getDisplayName = (user: UserProfile | SocialRecipe["author"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username || "Chef";
  };

  const getInitials = (user: UserProfile | SocialRecipe["author"]) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    return "CH";
  };

  if (profileLoading) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex items-center gap-6 mb-8">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The user you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/explore">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Explore
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <Button variant="ghost" asChild className="mb-6">
        <Link href="/explore">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Explore
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <Avatar className="w-24 h-24 border-2 border-primary/20">
          <AvatarImage src={profile.profileImageUrl || undefined} alt={getDisplayName(profile)} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {getInitials(profile)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold font-playfair mb-1" data-testid="text-profile-name">
            {getDisplayName(profile)}
          </h1>
          {profile.username && (
            <p className="text-muted-foreground mb-4">@{profile.username}</p>
          )}

          <div className="flex flex-wrap justify-center sm:justify-start gap-6 mb-4">
            <div className="text-center" data-testid="stat-recipes">
              <div className="text-xl font-bold">{profile.recipeCount}</div>
              <div className="text-sm text-muted-foreground">Recipes</div>
            </div>
            <div className="text-center" data-testid="stat-followers">
              <div className="text-xl font-bold">{profile.followerCount}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div className="text-center" data-testid="stat-following">
              <div className="text-xl font-bold">{profile.followingCount}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
          </div>

          {currentUser && !isOwnProfile && (
            <div>
              {followStatus?.isFollowing ? (
                <Button
                  variant="outline"
                  onClick={() => unfollowMutation.mutate()}
                  disabled={unfollowMutation.isPending}
                  data-testid="button-unfollow"
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  {unfollowMutation.isPending ? "Unfollowing..." : "Unfollow"}
                </Button>
              ) : (
                <Button
                  onClick={() => followMutation.mutate()}
                  disabled={followMutation.isPending}
                  data-testid="button-follow"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {followMutation.isPending ? "Following..." : "Follow"}
                </Button>
              )}
            </div>
          )}

          {isOwnProfile && (
            <Button variant="outline" asChild>
              <Link href="/profile">Edit Profile</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold font-playfair flex items-center gap-2 mb-4">
          <ChefHat className="w-5 h-5" />
          Public Recipes
        </h2>

        {recipesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        ) : recipes && recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {recipes.map((recipe) => (
              <Link key={recipe.id} href={`/recipe/${recipe.id}`}>
                <Card className="overflow-hidden hover-elevate cursor-pointer h-full" data-testid={`card-recipe-${recipe.id}`}>
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
                  <CardContent className="p-4">
                    <h3 className="font-semibold line-clamp-1 mb-1" data-testid={`text-recipe-title-${recipe.id}`}>
                      {recipe.title}
                    </h3>
                    {recipe.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {recipe.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {(recipe.prepTime || recipe.cookTime) && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {recipe.likeCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{isOwnProfile ? "You haven't shared any public recipes yet." : "This chef hasn't shared any public recipes yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
