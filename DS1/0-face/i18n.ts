// Define the supported languages using ISO codes (extensible)
export type LanguageCode = string;

// One language's words, key to text
export type TranslationData = {
  [key: string]: string;
};

// Every language's words, keyed by language code
export type TranslationMap = Record<string, TranslationData>;

/**
 * How a product sets up the language module. Every field is optional: without
 * any, the module behaves as it always has (the whole table from
 * `./translations.json`, the languages offered are the ones in the words).
 *
 * Pass it to `configureI18n()` straight after importing the module, or put it
 * on `window.DS_ONE_I18N` before the module loads.
 */
export type I18nOptions = {
  /**
   * Every language the product speaks. When set, the picker offers these
   * whether or not their words have arrived yet, which matters when a page
   * loads only its own language (`languageFile`). Without it, the languages
   * offered are the ones found in the loaded words.
   */
  languages?: readonly LanguageCode[];
  /**
   * Where one language's words are published, so a page loads its own
   * language rather than the whole table: a pattern with `{language}` in it
   * (`"/translations/{language}.json"`) or a function. Each file holds
   * `{ "<language>": { …words } }`. When a language's file is missing, the
   * whole table is the fallback. Without it, only the whole table is loaded.
   */
  languageFile?: string | ((language: LanguageCode) => string) | null;
  /**
   * Where the whole table is published. Defaults to `./translations.json`.
   * `window.DS_ONE_TRANSLATIONS_FILE` and the `data-ds-one-translations`,
   * `ds-one:translations` and `ds-one-translations` markers in the page win
   * over it.
   */
  translationsFile?: string;
  /** The localStorage key that keeps the chosen language. Defaults to `language`. */
  storageKey?: string;
  /**
   * Report keys with no translation on the console, each once. Off by
   * default, since components also show what people write themselves, and
   * that is not a key anyone forgot. `window.DS_ONE_I18N_DEBUG = true` or
   * localStorage `ds-one:i18n-debug` set to `on` turn it on as well.
   */
  reportMissingKeys?: boolean | (() => boolean);
};

// Bundled translations (keys.json may not exist - will use external translations if not available)
// This is a fallback for when external translations aren't loaded
let translationKeys: TranslationMap = {};

// Primary language list – prioritise the 10 requested languages when cycling
const LANGUAGE_PRIORITY_ORDER = [
  "da",
  "de",
  "en",
  "es",
  "fr",
  "it",
  "ja",
  "ko",
  "pt",
  "sv",
  "zh",
] as const;

/**
 * The languages Design system 1 orders, names and maps browser languages to.
 * A product that speaks all of them can pass it as `languages`.
 */
export const SUPPORTED_LANGUAGES: readonly LanguageCode[] =
  LANGUAGE_PRIORITY_ORDER;

const LANGUAGE_PRIORITY_LOOKUP = new Map<string, number>(
  LANGUAGE_PRIORITY_ORDER.map((code, index) => [code, index])
);

// Fallback language names if Intl.DisplayNames is not available
const FALLBACK_LANGUAGE_NAMES: Record<string, string> = {
  da: "Danish",
  "da-dk": "Danish",
  de: "German",
  "de-de": "German",
  en: "English",
  "en-us": "English",
  es: "Spanish",
  "es-es": "Spanish",
  fr: "French",
  "fr-fr": "French",
  it: "Italian",
  "it-it": "Italian",
  ja: "Japanese",
  "ja-jp": "Japanese",
  ko: "Korean",
  "ko-kr": "Korean",
  pt: "Portuguese",
  "pt-pt": "Portuguese",
  sv: "Swedish",
  "sv-se": "Swedish",
  zh: "Chinese",
  "zh-cn": "Chinese",
  "zh-tw": "Chinese",
  "zh-hans": "Chinese",
  "zh-hant": "Chinese",
};

const DISPLAY_NAME_CACHE = new Map<string, Intl.DisplayNames>();
let displayNameFallbackWarningShown = false;

// Declare window property for external translations
declare global {
  interface Window {
    DS_ONE_TRANSLATIONS?: Record<string, TranslationData>;
    DS_ONE_TRANSLATIONS_FILE?: string;
    DS_ONE_I18N?: I18nOptions;
    DS_ONE_I18N_DEBUG?: boolean;
  }
}

const DEFAULT_TRANSLATION_FILE = "./translations.json";
const DEFAULT_STORAGE_KEY = "language";
const DEBUG_STORAGE_KEY = "ds-one:i18n-debug";

const defaultLanguage: LanguageCode = "en";

let i18nOptions: I18nOptions =
  typeof window !== "undefined" && window.DS_ONE_I18N
    ? { ...window.DS_ONE_I18N }
    : {};

// ============================================================================
// Storage
// ============================================================================

function storage(): Storage | undefined {
  try {
    return typeof window !== "undefined"
      ? (window.localStorage ?? undefined)
      : undefined;
  } catch {
    // Storage can be blocked (private windows, cleared site data)
    return undefined;
  }
}

function storageKey(): string {
  return i18nOptions.storageKey || DEFAULT_STORAGE_KEY;
}

function readStoredLanguage(): LanguageCode | null {
  try {
    return (storage()?.getItem(storageKey()) as LanguageCode | null) || null;
  } catch {
    return null;
  }
}

function storeLanguage(language: LanguageCode): void {
  try {
    storage()?.setItem(storageKey(), language);
  } catch {
    // The choice still holds for this page
  }
}

// ============================================================================
// Language codes
// ============================================================================

function extractPrimarySubtag(code: LanguageCode): string {
  if (!code) {
    return "";
  }
  return code.toLowerCase().split(/[-_]/)[0] ?? "";
}

/** The codes to look a language's words up under: as given, then its primary subtag. */
function lookupCodes(language: LanguageCode): LanguageCode[] {
  const codes: LanguageCode[] = [];
  if (language) {
    codes.push(language);
  }
  const primary = extractPrimarySubtag(language);
  if (primary && !codes.includes(primary)) {
    codes.push(primary);
  }
  return codes;
}

/**
 * The language whose file a page loads for `language`: one of the configured
 * languages when a list is set (null when it speaks none of them), otherwise
 * the primary subtag.
 */
function fileLanguage(language: LanguageCode): LanguageCode | null {
  const configured = i18nOptions.languages;
  if (!configured || configured.length === 0) {
    return extractPrimarySubtag(language) || null;
  }

  const normalized = (language || "").toLowerCase().replace("_", "-");
  const exact = configured.find((code) => code.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }

  const primary = extractPrimarySubtag(language);
  return configured.find((code) => code.toLowerCase() === primary) ?? null;
}

function languageFileFor(language: LanguageCode): string | null {
  const pattern = i18nOptions.languageFile;
  if (!pattern) {
    return null;
  }
  const path =
    typeof pattern === "function"
      ? pattern(language)
      : pattern.split("{language}").join(language);
  return normalizeCandidate(path);
}

// ============================================================================
// Loading translations
// ============================================================================

// CDN Loader: Automatically detects and loads translation JSON files
// for CDN users who want to use external translations

let loadAttempted = false;

function normalizeCandidate(path: string): string | null {
  if (!path) {
    return null;
  }
  const trimmed = path.trim();
  if (!trimmed) {
    return null;
  }

  if (
    trimmed.startsWith("./") ||
    trimmed.startsWith("../") ||
    trimmed.startsWith("/") ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }

  return `./${trimmed}`;
}

function findAttributeCandidate(): string | null {
  if (typeof document === "undefined" || !document.querySelector) {
    return null;
  }

  const scriptWithAttribute = document.querySelector(
    "script[data-ds-one-translations]"
  );
  const scriptCandidate = scriptWithAttribute?.getAttribute(
    "data-ds-one-translations"
  );
  if (scriptCandidate) {
    return scriptCandidate;
  }

  const metaCandidate = document
    .querySelector('meta[name="ds-one:translations"]')
    ?.getAttribute("content");
  if (metaCandidate) {
    return metaCandidate;
  }

  const linkCandidate = document
    .querySelector('link[rel="ds-one-translations"]')
    ?.getAttribute("href");
  if (linkCandidate) {
    return linkCandidate;
  }

  return null;
}

/** Where the whole table is: what the page names, else the option, else the default. */
function resolveTableSources(): string[] {
  const candidates: string[] = [];

  const windowCandidate =
    typeof window !== "undefined" ? window.DS_ONE_TRANSLATIONS_FILE : null;
  const attributeCandidate = findAttributeCandidate();

  // Only use explicitly configured paths, or the single default
  const windowNormalized = normalizeCandidate(windowCandidate ?? "");
  if (windowNormalized) {
    candidates.push(windowNormalized);
  }

  const attrNormalized = normalizeCandidate(attributeCandidate ?? "");
  if (attrNormalized && !candidates.includes(attrNormalized)) {
    candidates.push(attrNormalized);
  }

  // Only try the default if no explicit path was configured
  if (candidates.length === 0) {
    candidates.push(
      normalizeCandidate(i18nOptions.translationsFile ?? "") ??
        DEFAULT_TRANSLATION_FILE
    );
  }

  return candidates;
}

function resolveTranslationSources(): string[] {
  const tables = resolveTableSources();
  // With one file per language, the page's own language first, then the
  // whole table.
  const startLanguage =
    fileLanguage(currentLanguage.value) ?? defaultLanguage;
  const own = languageFileFor(startLanguage);
  return own ? [own, ...tables.filter((source) => source !== own)] : tables;
}

function validateTranslationMap(
  candidate: unknown
): candidate is TranslationMap {
  if (!candidate || typeof candidate !== "object") {
    return false;
  }

  return Object.values(candidate).every(
    (entry) => entry && typeof entry === "object"
  );
}

// One request per file, shared by startup and a language switch alike. A file
// that failed is forgotten, so a later attempt asks again.
const translationFiles = new Map<string, Promise<TranslationMap | null>>();

function fetchTranslationFile(source: string): Promise<TranslationMap | null> {
  let pending = translationFiles.get(source);
  if (!pending) {
    pending = readTranslationFile(source).then((translations) => {
      if (!translations) {
        translationFiles.delete(source);
      }
      return translations;
    });
    translationFiles.set(source, pending);
  }
  return pending;
}

async function readTranslationFile(
  source: string
): Promise<TranslationMap | null> {
  try {
    const response = await fetch(source);

    if (!response.ok) {
      // 404 is expected if no translations file exists - don't log as error
      return null;
    }

    const translations = await response.json();

    if (!validateTranslationMap(translations)) {
      console.warn(
        `[Design system 1] Invalid translation format in ${source}. Expected object with language codes as keys.`
      );
      return null;
    }

    const languages = Object.keys(translations);
    if (languages.length === 0) {
      console.warn(`[Design system 1] No languages found in ${source}`);
      return null;
    }

    return translations;
  } catch {
    // Silently fail - file likely doesn't exist or isn't valid JSON
    return null;
  }
}

/** Add words to what is loaded, keeping the languages already there. */
function mergeTranslations(translations: TranslationMap): void {
  if (typeof window === "undefined") {
    translationKeys = { ...translationKeys, ...translations };
    return;
  }
  window.DS_ONE_TRANSLATIONS = {
    ...window.DS_ONE_TRANSLATIONS,
    ...translations,
  };
}

/**
 * Attempts to load translations from a JSON file in the same directory
 */
async function loadExternalTranslations(): Promise<boolean> {
  // Only attempt once
  if (loadAttempted) {
    return false;
  }
  loadAttempted = true;

  if (typeof window === "undefined") {
    return false;
  }

  // Check if translations are already loaded (e.g., by the application)
  if (
    window.DS_ONE_TRANSLATIONS &&
    Object.keys(window.DS_ONE_TRANSLATIONS).length > 0
  ) {
    console.log(
      `[Design system 1] Translations already loaded (${Object.keys(window.DS_ONE_TRANSLATIONS).length} languages), skipping auto-load`
    );
    return true;
  }

  const sources = resolveTranslationSources();

  for (const source of sources) {
    const translations = await fetchTranslationFile(source);
    if (!translations) {
      continue;
    }

    mergeTranslations(translations);

    const languages = Object.keys(translations);
    console.log(
      `[Design system 1] External translations loaded from ${source}: ${languages.length} language(s) – ${languages.join(", ")}`
    );

    window.dispatchEvent(new CustomEvent("translations-ready"));
    return true;
  }

  console.info(
    `[Design system 1] No external translations found at ${sources[0] ?? DEFAULT_TRANSLATION_FILE}. Using bundled translations.`
  );

  return false;
}

const languageLoads = new Map<string, Promise<void>>();

/**
 * Fetch a language's words when the page needs one it has not got: its own
 * file, or the whole table when that file is missing. Does nothing unless
 * `languageFile` is configured, since otherwise the whole table, with every
 * language in it, is what the page loads at startup.
 */
export function loadLanguage(language: LanguageCode): Promise<void> {
  if (typeof window === "undefined" || !i18nOptions.languageFile) {
    return Promise.resolve();
  }

  const code = fileLanguage(language) ?? defaultLanguage;
  if (getTranslationData()[code]) {
    return Promise.resolve();
  }

  let pending = languageLoads.get(code);
  if (!pending) {
    pending = (async () => {
      const own = languageFileFor(code);
      let translations = own ? await fetchTranslationFile(own) : null;
      for (const source of resolveTableSources()) {
        if (translations) {
          break;
        }
        translations = await fetchTranslationFile(source);
      }
      if (!translations) {
        return;
      }
      mergeTranslations(translations);
      window.dispatchEvent(new CustomEvent("translations-ready"));
    })();
    languageLoads.set(code, pending);
  }
  return pending;
}

// Get translation data - prioritize external, fall back to bundled
function getTranslationData(): TranslationMap {
  // Check for externally loaded translations first (CDN usage)
  if (typeof window !== "undefined" && window.DS_ONE_TRANSLATIONS) {
    return window.DS_ONE_TRANSLATIONS;
  }

  // Fall back to bundled translations
  return translationKeys;
}

// ============================================================================
// Language names and ordering
// ============================================================================

function getLanguagePriority(code: LanguageCode): number {
  const primary = extractPrimarySubtag(code);
  const priority = LANGUAGE_PRIORITY_LOOKUP.get(primary);

  if (typeof priority === "number") {
    return priority;
  }

  return LANGUAGE_PRIORITY_ORDER.length;
}

function sortLanguageCodes(codes: LanguageCode[]): LanguageCode[] {
  return [...codes].sort((a, b) => {
    const priorityA = getLanguagePriority(a);
    const priorityB = getLanguagePriority(b);

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.localeCompare(b);
  });
}

function getDisplayNameForLocale(
  locale: string,
  code: LanguageCode
): string | undefined {
  const normalizedLocale = locale?.replace("_", "-");
  if (!normalizedLocale) {
    return undefined;
  }

  try {
    let displayNames = DISPLAY_NAME_CACHE.get(normalizedLocale);

    if (!displayNames) {
      displayNames = new Intl.DisplayNames([normalizedLocale], {
        type: "language",
      });
      DISPLAY_NAME_CACHE.set(normalizedLocale, displayNames);
    }

    const cleanedCode = code.replace("_", "-");

    // Try full tag first
    const fullMatch = displayNames.of(cleanedCode);
    if (fullMatch && fullMatch !== cleanedCode) {
      return fullMatch;
    }

    // Then the primary subtag
    const baseMatch = displayNames.of(extractPrimarySubtag(cleanedCode));
    if (baseMatch) {
      return baseMatch;
    }
  } catch {
    // Intl.DisplayNames may not be supported; fall back gracefully
    if (!displayNameFallbackWarningShown) {
      console.info(
        "[Design system 1] Intl.DisplayNames is not available, using fallback language names."
      );
      displayNameFallbackWarningShown = true;
    }
  }

  return undefined;
}

function getFallbackDisplayName(code: LanguageCode): string | undefined {
  const normalized = code.toLowerCase().replace("_", "-");
  const direct = FALLBACK_LANGUAGE_NAMES[normalized];

  if (direct) {
    return direct;
  }

  const primary = extractPrimarySubtag(normalized);
  return FALLBACK_LANGUAGE_NAMES[primary];
}

export function getLanguageDisplayName(
  code: LanguageCode,
  options: { locale?: string } = {}
): string {
  if (!code) {
    return "";
  }

  const localesToTry: string[] = [];

  if (options.locale) {
    localesToTry.push(options.locale);
  }

  if (typeof navigator !== "undefined") {
    if (Array.isArray(navigator.languages)) {
      localesToTry.push(...navigator.languages);
    }
    if (navigator.language) {
      localesToTry.push(navigator.language);
    }
  }

  localesToTry.push(defaultLanguage);
  localesToTry.push("en");

  const tried = new Set<string>();

  for (const locale of localesToTry) {
    if (!locale || tried.has(locale)) {
      continue;
    }
    tried.add(locale);

    const displayName = getDisplayNameForLocale(locale, code);
    if (displayName) {
      return displayName;
    }
  }

  const fallback = getFallbackDisplayName(code);
  if (fallback) {
    return fallback;
  }

  // Fall back to the primary subtag in uppercase
  const primary = extractPrimarySubtag(code);
  return primary ? primary.toUpperCase() : code;
}

// ============================================================================
// Browser language
// ============================================================================

const BROWSER_LANGUAGE_PREFERENCES: Record<string, LanguageCode> = {
  da: "da",
  "da-dk": "da",
  de: "de",
  "de-de": "de",
  en: "en",
  "en-us": "en",
  "en-gb": "en",
  es: "es",
  "es-es": "es",
  "es-mx": "es",
  fr: "fr",
  "fr-fr": "fr",
  it: "it",
  "it-it": "it",
  ja: "ja",
  "ja-jp": "ja",
  ko: "ko",
  "ko-kr": "ko",
  pt: "pt",
  "pt-pt": "pt",
  "pt-br": "pt",
  sv: "sv",
  "sv-se": "sv",
  zh: "zh",
  "zh-cn": "zh",
  "zh-hans": "zh",
  "zh-tw": "zh",
  "zh-hant": "zh",
};

function resolvePreferredLanguage(languageTag: string): LanguageCode | null {
  if (!languageTag) {
    return null;
  }

  const normalized = languageTag.toLowerCase().replace("_", "-");

  const directMatch = BROWSER_LANGUAGE_PREFERENCES[normalized];
  if (directMatch) {
    return directMatch;
  }

  const primary = extractPrimarySubtag(normalized);
  const primaryMatch = BROWSER_LANGUAGE_PREFERENCES[primary];
  if (primaryMatch) {
    return primaryMatch;
  }

  return languageTag as LanguageCode;
}

// Helper function to get browser language
export function getBrowserLanguage(): LanguageCode {
  if (typeof navigator === "undefined") {
    return defaultLanguage;
  }

  const browserLang = navigator.language;

  if (browserLang) {
    const resolved = resolvePreferredLanguage(browserLang);
    if (resolved) {
      return resolved;
    }
  }

  if (Array.isArray(navigator.languages)) {
    for (const candidate of navigator.languages) {
      const resolved = resolvePreferredLanguage(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  return defaultLanguage;
}

// ============================================================================
// Current language
// ============================================================================

function dispatchLanguageChanged(language: LanguageCode): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(
    new CustomEvent("language-changed", {
      detail: { language },
      bubbles: true,
      composed: true,
    })
  );
}

// Create a reactive signal for the current language (Portfolio pattern)
export const currentLanguage = {
  value: readStoredLanguage() || getBrowserLanguage(),
  set: function (lang: LanguageCode) {
    this.value = lang;
    storeLanguage(lang);
    void loadLanguage(lang);
    // What reads the document's language (dates, screen readers, hyphenation)
    // follows too, rather than keeping the language the page was opened in.
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = lang;
    }
    dispatchLanguageChanged(lang);
  },
};

/**
 * Set the language module up for a product (see `I18nOptions`). Call it
 * straight after importing the module: the first translations are fetched
 * once the code that imported it has run. Called later, it fetches the current
 * language's file if one is now configured.
 */
export function configureI18n(next: I18nOptions): void {
  const previousKey = storageKey();
  i18nOptions = { ...i18nOptions, ...next };

  if (storageKey() !== previousKey) {
    const stored = readStoredLanguage();
    if (stored && stored !== currentLanguage.value) {
      currentLanguage.value = stored;
      dispatchLanguageChanged(stored);
    }
  }

  if (loadAttempted && i18nOptions.languageFile) {
    void loadLanguage(currentLanguage.value);
  }
}

// Auto-load translations when this module is imported (for CDN bundle).
// Waits a task, so a product can configure the module first, even after a
// dynamic import.
if (typeof window !== "undefined" && typeof document !== "undefined") {
  const start = () => {
    void loadExternalTranslations();
  };
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    // DOM is already ready
    setTimeout(start, 0);
  }
}

// Listen for external translations being loaded
if (typeof window !== "undefined") {
  window.addEventListener("translations-ready", () => {
    // Dispatch that translations are loaded
    window.dispatchEvent(new CustomEvent("translations-loaded"));

    // Dispatch language-changed to update all components
    dispatchLanguageChanged(currentLanguage.value);
  });

  // Initialize translations on module load
  // Use setTimeout to give other parts of the app time to set up event listeners first
  setTimeout(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(new CustomEvent("translations-loaded"));

    // Also dispatch language-changed with the current language
    dispatchLanguageChanged(currentLanguage.value);
  }, 100);
}

// ============================================================================
// Looking words up
// ============================================================================

// Missing keys are ordinary: the same components carry what people write
// themselves, and a list called "Iroco.com" is not a key anyone forgot. So the
// console stays quiet unless someone is hunting for a missing key, and then
// each key is only reported once.
const REPORTED_MISSING_KEYS = new Set<string>();

function missingKeyReportingOn(): boolean {
  const option = i18nOptions.reportMissingKeys;
  try {
    if (typeof option === "function" ? option() : option) {
      return true;
    }
  } catch {
    // A failing check reports nothing
  }

  if (typeof window === "undefined") {
    return false;
  }
  if (window.DS_ONE_I18N_DEBUG === true) {
    return true;
  }
  try {
    return storage()?.getItem(DEBUG_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

function reportMissingKey(key: string, language: LanguageCode): void {
  if (!missingKeyReportingOn()) {
    return;
  }
  const seen = `${language}:${key}`;
  if (REPORTED_MISSING_KEYS.has(seen)) {
    return;
  }
  REPORTED_MISSING_KEYS.add(seen);
  console.warn(
    `[Design system 1 (Internationalization)] No translation found for key "${key}" in "${language}"`
  );
}

// Get translation by key
export function translate(key: string): string {
  return textInLanguage(key, currentLanguage.value);
}

/**
 * A key's text in a given language, whatever the page's own language is (a
 * drawing made for one language, say). Region subtags fall back to the
 * primary language (`ja-JP` reads `ja`), and every language falls back to
 * English, then to the key itself.
 */
export function textInLanguage(key: string, language: LanguageCode): string {
  const data = getTranslationData();
  const codes = lookupCodes(language);

  for (const code of codes) {
    const text = data?.[code]?.[key];
    if (text) {
      return text;
    }
  }

  // Try fallback to English
  if (!codes.includes(defaultLanguage)) {
    const text = data?.[defaultLanguage]?.[key];
    if (text) {
      return text;
    }

    // Loaded a language at a time, English may not have arrived yet
    if (!data?.[defaultLanguage] && codes.some((code) => data?.[code])) {
      void loadLanguage(defaultLanguage);
    }
  }

  reportMissingKey(key, codes[codes.length - 1] ?? language);
  return key;
}

export function hasTranslation(
  key: string,
  language: LanguageCode = currentLanguage.value
): boolean {
  if (!key) {
    return false;
  }

  const data = getTranslationData();
  const codes = lookupCodes(language);
  if (!codes.includes(defaultLanguage)) {
    codes.push(defaultLanguage);
  }

  return codes.some((code) => {
    const langData = data?.[code];
    return Boolean(
      langData && Object.prototype.hasOwnProperty.call(langData, key)
    );
  });
}

// Get text - synchronous version for components
export function getText(key: string): string {
  return translate(key);
}

// Get available languages: the configured ones, else the ones in the loaded words
export function getAvailableLanguages(): Promise<LanguageCode[]> {
  return Promise.resolve(getAvailableLanguagesSync());
}

// Synchronous version for immediate use
export function getAvailableLanguagesSync(): LanguageCode[] {
  if (i18nOptions.languages && i18nOptions.languages.length > 0) {
    return sortLanguageCodes([...i18nOptions.languages]);
  }

  const currentData = getTranslationData();

  if (currentData && Object.keys(currentData).length > 0) {
    return sortLanguageCodes(Object.keys(currentData));
  }
  return [defaultLanguage];
}

/**
 * Add words to what is loaded: one language's (`loadTranslations("da", {…})`)
 * or several at once (`loadTranslations({ en: {…}, da: {…} })`). Components
 * update as they do when a translation file arrives.
 */
export function loadTranslations(
  language: LanguageCode,
  translations: TranslationData
): void;
export function loadTranslations(translations: TranslationMap): void;
export function loadTranslations(
  languageOrMap: LanguageCode | TranslationMap,
  translations?: TranslationData
): void {
  const map: TranslationMap =
    typeof languageOrMap === "string"
      ? { [languageOrMap]: translations ?? {} }
      : languageOrMap;

  if (!validateTranslationMap(map)) {
    console.warn(
      "[Design system 1] loadTranslations expects words keyed by language code."
    );
    return;
  }

  const data = getTranslationData();
  const merged: TranslationMap = {};
  for (const [code, words] of Object.entries(map)) {
    merged[code] = { ...data[code], ...words };
  }
  mergeTranslations(merged);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("translations-ready"));
  }
}

// Set language (Portfolio pattern)
export function setLanguage(language: LanguageCode): void {
  // Update the language in localStorage first
  storeLanguage(language);

  // Then update the signal - this should trigger effects in components
  // that are subscribed to the signal
  currentLanguage.set(language);

  // Dispatch a custom event so non-signal-based components can update
  dispatchLanguageChanged(language);
}
