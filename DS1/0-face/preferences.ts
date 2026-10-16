import type { LanguageCode } from "./i18n";
import type { ThemeType } from "./theme";

export type Preferences = {
  language?: LanguageCode;
  theme?: ThemeType;
  [key: string]: unknown;
};

/** Product storage names are configuration; the implementation stays shared. */
export interface PreferenceOptions {
  storageKey?: string;
  themeStorageKey?: string;
  /** Follow system appearance without reading or writing a saved theme. */
  themeMode?: "system";
}

declare global {
  interface Window { DS_ONE_PREFERENCES?: PreferenceOptions; }
}

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
