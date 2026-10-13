import { signal } from "@lit-labs/signals";
import { preferenceStorageKey } from "./preferences";

export type ThemeType = "light" | "dark";

function getInitialTheme(): ThemeType {
  if (typeof window === "undefined") {
    return "light";
  }

  let storedTheme: string | null = null;
  try { storedTheme = window.localStorage?.getItem(preferenceStorageKey("theme")); } catch { /* Storage can be unavailable. */ }
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  // Check system preference
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export const currentTheme = signal<ThemeType>(getInitialTheme());

export function setTheme(theme: ThemeType): void {
  if (theme === currentTheme.get()) {
    return;
  }

  currentTheme.set(theme);

  if (typeof window !== "undefined") {
    try {
      window.localStorage?.setItem(preferenceStorageKey("theme"), theme);
    } catch (error) {
      console.warn("ds-one: unable to persist theme preference", error);
    }

    const root = window.document?.documentElement;
    if (root) {
      root.classList.remove("light-theme", "dark-theme");
      root.classList.add(`${theme}-theme`);
    }

    window.dispatchEvent(
      new CustomEvent("theme-changed", { detail: { theme } })
    );
  }
}

// Initialize theme on load
if (typeof window !== "undefined") {
  const theme = currentTheme.get();
  const root = window.document?.documentElement;
  if (root) {
    root.classList.remove("light-theme", "dark-theme");
    root.classList.add(`${theme}-theme`);
  }
}
