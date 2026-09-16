// Define the supported languages using ISO codes (extensible)
export type LanguageCode = string;

// Define the structure of our translation data
type TranslationData = {
  [key: string]: string;
};

type TranslationMap = Record<string, TranslationData>;

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
  }
}

// CDN Loader: Automatically detects and loads translation JSON files
// for CDN users who want to use external translations

const DEFAULT_TRANSLATION_FILE = "./translations.json";
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
  if (typeof document === "undefined") {
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

function resolveTranslationSources(): string[] {
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

  // Only try default if no explicit path was configured
  if (candidates.length === 0) {
    candidates.push(DEFAULT_TRANSLATION_FILE);
  }

  return candidates;
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

async function fetchTranslationFile(
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

    window.DS_ONE_TRANSLATIONS = translations;

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

// Get translation data - prioritize external, fall back to bundled
function getTranslationData(): TranslationMap {
  // Check for externally loaded translations first (CDN usage)
  if (typeof window !== "undefined" && window.DS_ONE_TRANSLATIONS) {
    return window.DS_ONE_TRANSLATIONS;
  }

  // Fall back to bundled translations
  return translationKeys as TranslationMap;
}

// Cached translation data - use getter to always get fresh data
let translationData = getTranslationData();

const defaultLanguage: LanguageCode = "en";

function extractPrimarySubtag(code: LanguageCode): string {
  if (!code) {
    return "";
  }
  return code.toLowerCase().split(/[-_]/)[0] ?? "";
}

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
  } catch (error) {
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

// Get stored language from localStorage
const storedLanguage =
  typeof window !== "undefined"
    ? ((window.localStorage?.getItem(
        "ds-one:language"
      ) as LanguageCode | null) ?? undefined)
    : undefined;

// Create a reactive signal for the current language (Portfolio pattern)
export const currentLanguage = {
  value:
    (localStorage.getItem("language") as LanguageCode) || getBrowserLanguage(),
  set: function (lang: LanguageCode) {
    this.value = lang;
    localStorage.setItem("language", lang);
    window.dispatchEvent(
      new CustomEvent("language-changed", {
        detail: { language: lang },
        bubbles: true,
        composed: true,
      })
    );
  },
};

// Auto-load translations when this module is imported (for CDN bundle)
if (typeof window !== "undefined") {
  // Wait a bit to ensure the DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadExternalTranslations();
    });
  } else {
    // DOM is already ready
    loadExternalTranslations();
  }
}

// Listen for external translations being loaded
if (typeof window !== "undefined") {
  window.addEventListener("translations-ready", () => {
    // Refresh translation data from external source
    translationData = getTranslationData();

    // Dispatch that translations are loaded
    window.dispatchEvent(new CustomEvent("translations-loaded"));

    // Dispatch language-changed to update all components
    const currentLang = currentLanguage.value;
    window.dispatchEvent(
      new CustomEvent("language-changed", {
        detail: { language: currentLang },
        bubbles: true,
        composed: true,
      })
    );
  });
}

// Initialize translations on module load
// Use setTimeout to give other parts of the app time to set up event listeners first
setTimeout(() => {
  // Since we directly imported the data, just dispatch the events
  window.dispatchEvent(new CustomEvent("translations-loaded"));

  // Also dispatch language-changed with the current language
  const currentLang = currentLanguage.value;

  window.dispatchEvent(
    new CustomEvent("language-changed", {
      detail: { language: currentLang },
      bubbles: true,
      composed: true,
    })
  );
}, 100);

// Get translation by key
export function translate(key: string): string {
  const lang = currentLanguage.value;

  // Check if key exists in current language
  if (translationData?.[lang]?.[key]) {
    return translationData[lang][key];
  }

  // Try fallback to English
  if (lang !== defaultLanguage && translationData?.[defaultLanguage]?.[key]) {
    return translationData[defaultLanguage][key];
  }

  console.warn(
    `[Design system 1 (Internationalization)] No translation found for key "${key}"`
  );
  return key;
}

export function hasTranslation(
  key: string,
  language: LanguageCode = currentLanguage.value
): boolean {
  if (!key) {
    return false;
  }

  const langData = translationData?.[language];
  if (langData && Object.prototype.hasOwnProperty.call(langData, key)) {
    return true;
  }

  if (
    language !== defaultLanguage &&
    translationData?.[defaultLanguage] &&
    Object.prototype.hasOwnProperty.call(translationData[defaultLanguage], key)
  ) {
    return true;
  }

  return false;
}

// Get text - synchronous version for components
export function getText(key: string): string {
  return translate(key);
}

// Get available languages - dynamically detect from loaded data
export function getAvailableLanguages(): Promise<LanguageCode[]> {
  // Always get fresh translation data
  const currentData = getTranslationData();

  if (currentData && Object.keys(currentData).length > 0) {
    const languages = Object.keys(currentData) as LanguageCode[];
    return Promise.resolve(sortLanguageCodes(languages));
  }
  return Promise.resolve([defaultLanguage]);
}

// Synchronous version for immediate use
export function getAvailableLanguagesSync(): LanguageCode[] {
  const currentData = getTranslationData();

  if (currentData && Object.keys(currentData).length > 0) {
    return sortLanguageCodes(Object.keys(currentData) as LanguageCode[]);
  }
  return [defaultLanguage];
}

// Load translations programmatically (for compatibility)
export function loadTranslations(
  language: LanguageCode,
  translations: TranslationData
): void {
  // Since we have static data, this is mainly for compatibility
  console.log(
    `Loading additional translations for ${language}:`,
    Object.keys(translations).length,
    "keys"
  );
}

// Set language (Portfolio pattern)
export function setLanguage(language: LanguageCode): void {
  // Update the language in localStorage first
  localStorage.setItem("language", language);

  // Then update the signal - this should trigger effects in components
  // that are subscribed to the signal
  currentLanguage.set(language);

  // Dispatch a custom event so non-signal-based components can update
  window.dispatchEvent(
    new CustomEvent("language-changed", {
      detail: { language },
      bubbles: true,
      composed: true,
    })
  );
}
