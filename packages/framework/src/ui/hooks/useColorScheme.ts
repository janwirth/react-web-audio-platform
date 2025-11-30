import { useEffect } from "react";
import { atom, useAtom, useAtomValue } from "jotai";

export type ColorScheme = "light" | "dark" | "auto";

const STORAGE_KEY = "themeMode";

// Helper to get initial value from localStorage
const getInitialColorScheme = (): ColorScheme => {
  if (typeof window === "undefined") return "auto";

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") {
    return stored;
  }
  return "auto";
};

// Atom for color scheme mode
const colorSchemeModeAtom = atom<ColorScheme>(getInitialColorScheme());

// Derived atom to determine if dark mode is active
const isDarkAtom = atom((get) => {
  const mode = get(colorSchemeModeAtom);
  if (mode === "dark") return true;
  if (mode === "light") return false;
  // auto mode: follow system preference
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
});

/**
 * Hook to manage color scheme (light/dark/auto) with system preference detection
 * Uses Jotai for global state management
 * @returns Object with current mode, isDark state, and setter function
 */
export function useColorScheme() {
  const [mode, setMode] = useAtom(colorSchemeModeAtom);
  const isDark = useAtomValue(isDarkAtom);

  // Sync mode changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [mode]);

  // Apply dark mode class based on current mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Listen for system preference changes when in auto mode
  useEffect(() => {
    if (mode !== "auto") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Update dark class based on system preference
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Set initial state based on current system preference
    if (mediaQuery.matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  return {
    mode,
    isDark,
    setColorScheme: setMode,
  };
}

// Export atoms for direct use if needed
export { colorSchemeModeAtom, isDarkAtom };
