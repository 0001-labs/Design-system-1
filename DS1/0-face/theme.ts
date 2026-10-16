/**
 * Light, dark or system, remembered in one stored choice.
 *
 * The runtime is `theme-bootstrap.js`, the classic script a page inlines in
 * its <head> so the first paint is already in the chosen theme. Imported here
 * as well, it installs itself when the page did not inline it, so the
 * components and a page without them share one implementation. This module
 * mirrors it in signals for the components.
 *
 * The theme is marked on the root element by the class `light-theme` or
 * `dark-theme` (canonical), `data-theme="light|dark"` (for pages that key on
 * the attribute) and `color-scheme`. In system mode it follows
 * prefers-color-scheme as it changes.
 */
import { signal } from "@lit-labs/signals";
import "./theme-bootstrap.js";

/** The theme on the page. */
export type ThemeType = "light" | "dark";
/** The stored choice: a theme, or the system's. */
export type ThemeMode = ThemeType | "system";
export const THEME_MODES: readonly ThemeMode[] = ["light", "dark", "system"];

/** `window.DS_ONE_THEME`, installed by `theme-bootstrap.js`. */
export interface ThemeRuntime {
  /** The choice in effect: light, dark or system. */
  mode(): ThemeMode;
  /** The theme on the page. */
  theme(): ThemeType;
  /** Choose and remember light, dark or system, and put it on the page. */
  set(mode: ThemeMode): void;
  /** Read the stored choice, the options and the system again, and put them on the page. */
  apply(): void;
}

declare global {
  interface Window { DS_ONE_THEME?: ThemeRuntime; }
}

function runtime(): ThemeRuntime | undefined {
  return typeof window === "undefined" ? undefined : window.DS_ONE_THEME;
}

// Options set since the head script ran (a product's storage key, system mode) take effect now.
runtime()?.apply();

export const currentTheme = signal<ThemeType>(runtime()?.theme() ?? "light");
export const currentThemeMode = signal<ThemeMode>(runtime()?.mode() ?? "system");

function sync(): void {
  const theme = runtime();
  if (!theme) return;
  currentTheme.set(theme.theme());
  currentThemeMode.set(theme.mode());
}

if (typeof window !== "undefined") window.addEventListener("theme-changed", sync);

export function getThemeMode(): ThemeMode {
  return runtime()?.mode() ?? currentThemeMode.get();
}

/** Choose light, dark or system, store it and put it on the page; `theme-changed` follows a change. */
export function setThemeMode(mode: ThemeMode): void {
  runtime()?.set(mode);
  sync();
}

/** Choose light or dark. `setThemeMode("system")` hands the choice back to the system. */
export function setTheme(theme: ThemeType): void {
  setThemeMode(theme);
}

/**
 * Bind an automatic surface to system appearance, leaving stored choices
 * intact: nothing is read from or written to storage until the returned
 * function hands the page back to its stored choice.
 */
export function followSystemTheme(): () => void {
  if (typeof window === "undefined") return () => {};
  const previous = window.DS_ONE_PREFERENCES?.themeMode;
  window.DS_ONE_PREFERENCES = { ...window.DS_ONE_PREFERENCES, themeMode: "system" };
  setThemeMode("system");
  return () => {
    const options = { ...window.DS_ONE_PREFERENCES };
    if (previous) options.themeMode = previous;
    else delete options.themeMode;
    window.DS_ONE_PREFERENCES = options;
    runtime()?.apply();
    sync();
  };
}
