/**
 * The options a page sets on `window.DS_ONE_PREFERENCES` before the theme
 * and preference modules load: product storage names and the theme's
 * defaults. Product storage names are configuration; the implementation stays
 * shared. It imports nothing, so the theme module travels with it alone.
 */
export interface PreferenceOptions {
  storageKey?: string;
  themeStorageKey?: string;
  /** Follow system appearance without reading or writing a saved theme. */
  themeMode?: "system";
  /**
   * The theme a visitor who has chosen nothing sees: `"system"` (the
   * default) follows the system, `"light"` or `"dark"` keeps that theme until
   * they choose. A stored choice always wins; `themeMode: "system"` wins over
   * both.
   */
  themeDefault?: "light" | "dark" | "system";
  /**
   * The canvas behind the page and the browser's theme-color, per theme, set
   * by the theme runtime before the first paint: Design system 1's paper
   * (`--background`) by default. `false` leaves both to the page.
   */
  themePaper?: { light: string; dark: string } | false;
  /** Where the shape is stored: `"ds-one:shape"` by default. */
  shapeStorageKey?: string;
  /** The shape for a visitor who has chosen none; without it the components keep their own corners. */
  shapeDefault?: "square" | "rounded" | "circular";
}

declare global {
  interface Window { DS_ONE_PREFERENCES?: PreferenceOptions; }
}
