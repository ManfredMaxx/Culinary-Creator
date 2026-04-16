import { useAuth as useClerkAuth, useClerk } from "@clerk/clerk-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useAuth() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const { signOut } = useClerk();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    enabled: isLoaded && !!isSignedIn,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logout = () => {
    signOut().then(() => {
      queryClient.setQueryData(["/api/auth/user"], null);
    });
  };

  return {
    user,
    isLoading: !isLoaded || (!!isSignedIn && isUserLoading),
    isAuthenticated: isLoaded && !!isSignedIn,
    logout,
    isLoggingOut: false,
  };
}
