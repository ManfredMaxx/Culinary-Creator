import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

type Mode = "dark" | "light" | "system";
type ColorTheme = "michelin-star" | "forest-bistro" | "vaporwave" | "high-end-bar";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultMode?: Mode;
  defaultColorTheme?: ColorTheme;
  modeStorageKey?: string;
  colorThemeStorageKey?: string;
};

type ThemeProviderState = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
};

const initialState: ThemeProviderState = {
  mode: "system",
  setMode: () => null,
  colorTheme: "michelin-star",
  setColorTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultMode = "system",
  defaultColorTheme = "michelin-star",
  modeStorageKey = "baked-with-rowan-mode",
  colorThemeStorageKey = "baked-with-rowan-color-theme",
  ...props
}: ThemeProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem(modeStorageKey) as Mode) || defaultMode
  );
  
  const [colorTheme, setColorThemeState] = useState<ColorTheme>(
    () => (localStorage.getItem(colorThemeStorageKey) as ColorTheme) || defaultColorTheme
  );

  // Sync color theme from user data when logged in
  useEffect(() => {
    if (user?.colorTheme) {
      const userTheme = user.colorTheme as ColorTheme;
      if (userTheme !== colorTheme) {
        setColorThemeState(userTheme);
        localStorage.setItem(colorThemeStorageKey, userTheme);
      }
    }
  }, [user?.colorTheme, colorThemeStorageKey]);

  // Mutation to save color theme to database
  const updateThemeMutation = useMutation({
    mutationFn: async (theme: ColorTheme) => {
      const response = await apiRequest("PATCH", "/api/auth/user", { colorTheme: theme });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  // Apply mode (light/dark) to document
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (mode === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(mode);
  }, [mode]);

  // Apply color theme to document
  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    root.classList.remove(
      "theme-michelin-star",
      "theme-forest-bistro",
      "theme-vaporwave",
      "theme-high-end-bar"
    );

    // Add the current theme class
    root.classList.add(`theme-${colorTheme}`);
  }, [colorTheme]);

  const setColorTheme = (theme: ColorTheme) => {
    localStorage.setItem(colorThemeStorageKey, theme);
    setColorThemeState(theme);
    
    // Save to database if user is logged in
    if (user) {
      updateThemeMutation.mutate(theme);
    }
  };

  const value = {
    mode,
    setMode: (mode: Mode) => {
      localStorage.setItem(modeStorageKey, mode);
      setMode(mode);
    },
    colorTheme,
    setColorTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

// Theme display names for UI
export const colorThemeNames: Record<ColorTheme, string> = {
  "michelin-star": "Michelin Star",
  "forest-bistro": "Forest Bistro",
  "vaporwave": "Vaporwave",
  "high-end-bar": "High End Bar",
};
