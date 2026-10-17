import type { LanguageCode } from "./i18n";
import type { ThemeMode } from "./theme";

export type Preferences = {
  language?: LanguageCode;
  theme?: ThemeMode;
  [key: string]: unknown;
};

export type { PreferenceOptions } from "./preference-options";

export function preferenceStorageKey(kind: "preferences" | "theme"): string {
  const options = typeof window === "undefined" ? undefined : window.DS_ONE_PREFERENCES;
  return (kind === "theme" ? options?.themeStorageKey : options?.storageKey) || `ds-one:${kind}`;
}

export function savePreferences(preferences: Preferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const key = preferenceStorageKey("preferences");
    const raw = window.localStorage?.getItem(key);
    const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const next = { ...existing, ...preferences };
    window.localStorage?.setItem(key, JSON.stringify(next));
  } catch (error) {
    console.warn("ds-one: unable to persist preferences", error);
  }
}
