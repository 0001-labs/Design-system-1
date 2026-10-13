import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";

type I18n = typeof import("../DS1/0-face/i18n");

type FakeWindow = EventTarget & {
  localStorage: Storage;
  DS_ONE_TRANSLATIONS?: Record<string, Record<string, string>>;
  DS_ONE_TRANSLATIONS_FILE?: string;
  DS_ONE_I18N?: unknown;
  DS_ONE_I18N_DEBUG?: boolean;
};

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, String(value));
    },
  };
}

/**
 * A page for the module to load into: a window that carries events, storage
 * and the translations, a document that is ready, and a browser language.
 */
function stubPage({
  stored = {},
  translations,
  browser = ["en-US"],
  config,
}: {
  stored?: Record<string, string>;
  translations?: Record<string, Record<string, string>>;
  browser?: string[];
  config?: unknown;
} = {}): FakeWindow {
  const localStorage = memoryStorage(stored);
  const win = Object.assign(new EventTarget(), {
    localStorage,
    DS_ONE_TRANSLATIONS: translations,
    DS_ONE_I18N: config,
  }) as FakeWindow;
  vi.stubGlobal("window", win);
  vi.stubGlobal("localStorage", localStorage);
  vi.stubGlobal("document", {
    readyState: "complete",
    documentElement: { lang: "en" },
    querySelector: () => null,
    addEventListener: () => {},
  });
  vi.stubGlobal("navigator", { language: browser[0], languages: browser });
  return win;
}

async function loadModule(): Promise<I18n> {
  vi.resetModules();
  return import("../DS1/0-face/i18n");
}

const words = {
  en: { Hello: "Hello", Save: "Save", Only: "Only in English" },
  da: { Hello: "Hej", Save: "Gem" },
  ja: { Hello: "こんにちは" },
};

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  // No translation files unless a test publishes some
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 404 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("translate", () => {
  test("gives the current language's words", async () => {
    stubPage({ stored: { language: "da" }, translations: words });
    const i18n = await loadModule();
    expect(i18n.translate("Hello")).toBe("Hej");
    expect(i18n.getText("Save")).toBe("Gem");
  });

  test("falls back to English, then to the key itself", async () => {
    stubPage({ stored: { language: "da" }, translations: words });
    const i18n = await loadModule();
    expect(i18n.translate("Only")).toBe("Only in English");
    expect(i18n.translate("Iroco.com")).toBe("Iroco.com");
  });

  test("reads a region's language as its primary language", async () => {
    stubPage({ stored: { language: "ja-JP" }, translations: words });
    const i18n = await loadModule();
    expect(i18n.translate("Hello")).toBe("こんにちは");
  });

  test("textInLanguage reads any language, whatever the page speaks", async () => {
    stubPage({ stored: { language: "en" }, translations: words });
    const i18n = await loadModule();
    expect(i18n.textInLanguage("Hello", "da")).toBe("Hej");
    expect(i18n.textInLanguage("Hello", "ja-JP")).toBe("こんにちは");
    expect(i18n.textInLanguage("Save", "ja")).toBe("Save");
  });

  test("stays quiet over missing keys unless asked, then reports each once", async () => {
    const win = stubPage({ translations: words });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const i18n = await loadModule();
    i18n.translate("A list someone named");
    expect(warn).not.toHaveBeenCalled();

    win.DS_ONE_I18N_DEBUG = true;
    i18n.translate("A key nobody wrote");
    i18n.translate("A key nobody wrote");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test("reports missing keys when the product configures it", async () => {
    stubPage({ translations: words });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const i18n = await loadModule();
    i18n.configureI18n({ reportMissingKeys: () => true });
    i18n.translate("Missing");
    expect(warn).toHaveBeenCalledTimes(1);
  });
});

describe("setLanguage and currentLanguage", () => {
  test("starts in the stored language", async () => {
    stubPage({ stored: { language: "ja" }, translations: words, browser: ["da-DK"] });
    const i18n = await loadModule();
    expect(i18n.currentLanguage.value).toBe("ja");
  });

  test("switches, stores the choice, tells the page and the document", async () => {
    const win = stubPage({ translations: words });
    const i18n = await loadModule();
    const heard: string[] = [];
    win.addEventListener("language-changed", (event) => {
      heard.push((event as CustomEvent<{ language: string }>).detail.language);
    });

    i18n.setLanguage("da");

    expect(i18n.currentLanguage.value).toBe("da");
    expect(win.localStorage.getItem("language")).toBe("da");
    expect(document.documentElement.lang).toBe("da");
    expect(heard).toEqual(["da"]);
    expect(i18n.translate("Hello")).toBe("Hej");
  });

  test("keeps the choice under the product's own storage key", async () => {
    const win = stubPage({ stored: { "app:language": "ja" }, translations: words });
    const i18n = await loadModule();
    i18n.configureI18n({ storageKey: "app:language" });
    expect(i18n.currentLanguage.value).toBe("ja");
    i18n.setLanguage("da");
    expect(win.localStorage.getItem("app:language")).toBe("da");
  });
});

describe("hasTranslation", () => {
  test("knows a key in the language or in English", async () => {
    stubPage({ stored: { language: "da" }, translations: words });
    const i18n = await loadModule();
    expect(i18n.hasTranslation("Hello")).toBe(true);
    expect(i18n.hasTranslation("Only")).toBe(true);
    expect(i18n.hasTranslation("Hello", "ja-JP")).toBe(true);
    expect(i18n.hasTranslation("Nothing")).toBe(false);
    expect(i18n.hasTranslation("")).toBe(false);
  });
});

describe("getAvailableLanguages", () => {
  test("offers the loaded languages in Design system 1's order", async () => {
    stubPage({ translations: { zh: {}, en: {}, da: {}, xx: {} } });
    const i18n = await loadModule();
    expect(i18n.getAvailableLanguagesSync()).toEqual(["da", "en", "zh", "xx"]);
    await expect(i18n.getAvailableLanguages()).resolves.toEqual(["da", "en", "zh", "xx"]);
  });

  test("offers the configured languages whether or not their words have arrived", async () => {
    stubPage({ translations: { en: {} } });
    const i18n = await loadModule();
    i18n.configureI18n({ languages: ["ja", "en", "ko"] });
    expect(i18n.getAvailableLanguagesSync()).toEqual(["en", "ja", "ko"]);
  });

  test("falls back to English with no words at all", async () => {
    stubPage();
    const i18n = await loadModule();
    expect(i18n.getAvailableLanguagesSync()).toEqual(["en"]);
  });
});

describe("browser language", () => {
  test("maps a browser's language to one the system speaks", async () => {
    stubPage({ browser: ["da-DK", "en-US"] });
    const i18n = await loadModule();
    expect(i18n.getBrowserLanguage()).toBe("da");
    expect(i18n.currentLanguage.value).toBe("da");
  });

  test("knows Korean and Chinese variants", async () => {
    stubPage({ browser: ["ko-KR"] });
    let i18n = await loadModule();
    expect(i18n.getBrowserLanguage()).toBe("ko");

    vi.stubGlobal("navigator", { language: "zh-TW", languages: ["zh-TW"] });
    i18n = await loadModule();
    expect(i18n.getBrowserLanguage()).toBe("zh");
  });

  test("keeps a language it has no mapping for, and says English without a navigator", async () => {
    stubPage({ browser: ["nl-NL"] });
    const i18n = await loadModule();
    expect(i18n.getBrowserLanguage()).toBe("nl-NL");

    vi.stubGlobal("navigator", undefined);
    expect(i18n.getBrowserLanguage()).toBe("en");
  });
});

describe("loading words", () => {
  function respond(files: Record<string, unknown>) {
    return vi.fn(async (source: string) =>
      source in files
        ? new Response(JSON.stringify(files[source]))
        : new Response("", { status: 404 })
    );
  }

  test("loads the whole table by default", async () => {
    stubPage({ stored: { language: "da" } });
    const fetcher = respond({ "./translations.json": words });
    vi.stubGlobal("fetch", fetcher);
    const i18n = await loadModule();
    await vi.waitFor(() => expect(i18n.translate("Hello")).toBe("Hej"));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("with one file per language, loads the page's own and fetches another on a switch", async () => {
    const win = stubPage({ stored: { language: "da" } });
    const fetcher = respond({
      "/translations/da.json": { da: words.da },
      "/translations/ja.json": { ja: words.ja },
    });
    vi.stubGlobal("fetch", fetcher);
    const i18n = await loadModule();
    i18n.configureI18n({
      languages: ["en", "da", "ja"],
      languageFile: "/translations/{language}.json",
      translationsFile: "/translations.json",
    });

    await vi.waitFor(() => expect(win.DS_ONE_TRANSLATIONS?.da).toEqual(words.da));
    expect(fetcher.mock.calls.map(([source]) => source)).toEqual(["/translations/da.json"]);

    i18n.setLanguage("ja");
    i18n.setLanguage("ja");
    await vi.waitFor(() => expect(i18n.translate("Hello")).toBe("こんにちは"));
    expect(win.DS_ONE_TRANSLATIONS?.da).toEqual(words.da);
    expect(fetcher.mock.calls.filter(([source]) => source === "/translations/ja.json")).toHaveLength(1);
  });

  test("falls back to the whole table when a language's file is missing", async () => {
    const win = stubPage({
      stored: { language: "en" },
      // Configured on the page before the module loads
      config: {
        languageFile: (language: string) => `/translations/${language}.json`,
        translationsFile: "/translations.json",
      },
    });
    const fetcher = respond({
      "/translations/en.json": { en: words.en },
      "/translations.json": words,
    });
    vi.stubGlobal("fetch", fetcher);
    const i18n = await loadModule();
    await vi.waitFor(() => expect(win.DS_ONE_TRANSLATIONS?.en).toBeDefined());

    await i18n.loadLanguage("da");
    expect(i18n.textInLanguage("Hello", "da")).toBe("Hej");
    expect(fetcher.mock.calls.map(([source]) => source)).toEqual([
      "/translations/en.json",
      "/translations/da.json",
      "/translations.json",
    ]);
  });

  test("loadTranslations adds words, one language or several", async () => {
    stubPage({ stored: { language: "da" }, translations: { en: { Hello: "Hello" } } });
    const i18n = await loadModule();
    i18n.loadTranslations("da", { Hello: "Hej" });
    expect(i18n.translate("Hello")).toBe("Hej");
    i18n.loadTranslations({ da: { Save: "Gem" }, sv: { Hello: "Hej hej" } });
    expect(i18n.translate("Save")).toBe("Gem");
    expect(i18n.translate("Hello")).toBe("Hej");
    expect(i18n.textInLanguage("Hello", "sv")).toBe("Hej hej");
  });
});

describe("display names", () => {
  test("names a language in the given locale", async () => {
    stubPage();
    const i18n = await loadModule();
    expect(i18n.getLanguageDisplayName("da", { locale: "en" })).toBe("Danish");
    expect(i18n.getLanguageDisplayName("")).toBe("");
  });
});

describe("without a browser", () => {
  test("imports and translates with no window, document or storage", async () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    vi.stubGlobal("localStorage", undefined);
    vi.stubGlobal("navigator", undefined);
    const i18n = await loadModule();
    expect(i18n.currentLanguage.value).toBe("en");
    i18n.loadTranslations("en", { Hello: "Hello" });
    expect(i18n.translate("Hello")).toBe("Hello");
    expect(i18n.translate("Missing")).toBe("Missing");
  });
});

describe("the language list", () => {
  test("SUPPORTED_LANGUAGES is the whole list", async () => {
    stubPage();
    const i18n = await loadModule();
    const { LANGUAGES } = await import("../DS1/0-face/languages");
    expect(i18n.SUPPORTED_LANGUAGES).toEqual(LANGUAGES);
  });

  test("names languages from the list when Intl cannot", async () => {
    stubPage();
    vi.stubGlobal("Intl", {
      DisplayNames: function () {
        throw new Error("No Intl");
      },
    });
    const i18n = await loadModule();
    expect(i18n.getLanguageDisplayName("nb")).toBe("Norwegian Bokmål");
    expect(i18n.getLanguageDisplayName("pt-BR")).toBe("Brazilian Portuguese");
    expect(i18n.getLanguageDisplayName("xx")).toBe("XX");
  });

  test("maps the browser's Portuguese and Norwegian onto the list", async () => {
    stubPage({ browser: ["pt-BR"] });
    let i18n = await loadModule();
    expect(i18n.getBrowserLanguage()).toBe("pt-BR");

    vi.stubGlobal("navigator", { language: "nn-NO", languages: ["nn-NO"] });
    i18n = await loadModule();
    expect(i18n.getBrowserLanguage()).toBe("nn");
  });

  test("lands on a language the product speaks, a relative standing in", async () => {
    stubPage({ browser: ["no-NO", "en"] });
    const i18n = await loadModule();
    i18n.configureI18n({ languages: ["en", "nb", "pt-BR"] });
    expect(i18n.getBrowserLanguage()).toBe("nb");
    expect(i18n.currentLanguage.value).toBe("nb");

    vi.stubGlobal("navigator", { language: "nl-NL", languages: ["nl-NL", "fr"] });
    expect(i18n.getBrowserLanguage()).toBe("en");
  });

  test("tries every browser language before keeping one it has no mapping for", async () => {
    stubPage({ browser: ["nl-NL", "sv-SE"] });
    const i18n = await loadModule();
    expect(i18n.getBrowserLanguage()).toBe("sv");
  });

  test("reads a stored language as one the product speaks", async () => {
    stubPage({ stored: { language: "pt" } });
    const i18n = await loadModule();
    expect(i18n.currentLanguage.value).toBe("pt");
    i18n.configureI18n({ languages: ["en", "pt-BR"] });
    expect(i18n.currentLanguage.value).toBe("pt-BR");
  });

  test("gives the product's languages an address prefix", async () => {
    stubPage();
    const i18n = await loadModule();
    const routing = await import("../DS1/0-face/language-routing");
    i18n.configureI18n({ languages: ["en", "da"], routing: { prefixDefaultLanguage: true } });
    expect(routing.withLanguagePrefix("/a", "da")).toBe("/da/a");
    expect(routing.withLanguagePrefix("/a", "ja")).toBe("/a");
    expect(routing.withLanguagePrefix("/a", "en")).toBe("/en/a");
  });
});

describe("placeholders and key shapes", () => {
  test("fills {name} and {{name}} in translate, getText and textInLanguage", async () => {
    stubPage({
      stored: { language: "da" },
      translations: {
        en: { "auth.sentTo": "We sent a link to {{email}}." },
        da: { "Hello {name}": "Hej {name}", "auth.sentTo": "Vi sendte et link til {{email}}." },
      },
    });
    const i18n = await loadModule();
    expect(i18n.translate("Hello {name}", { name: "Ada" })).toBe("Hej Ada");
    expect(i18n.getText("auth.sentTo", { email: "a@b.c" })).toBe("Vi sendte et link til a@b.c.");
    expect(i18n.textInLanguage("auth.sentTo", "sv", { email: "a@b.c" })).toBe("We sent a link to a@b.c.");
    expect(i18n.translate("Bye {name}", { name: "Bo" })).toBe("Bye Bo");
  });

  test("reads a relative before English", async () => {
    stubPage({ stored: { language: "nn" }, translations: { en: { Save: "Save" }, nb: { Save: "Lagre" } } });
    const i18n = await loadModule();
    expect(i18n.translate("Save")).toBe("Lagre");
    expect(i18n.hasTranslation("Save", "no")).toBe(true);
  });

  test("loads a TypeScript module of words, a Partial table included", async () => {
    stubPage({ stored: { language: "da" } });
    const i18n = await loadModule();
    const en = { "settings.language": "Language", "settings.theme": "Theme" };
    const translations: Record<string, Partial<Record<keyof typeof en, string>>> = {
      en,
      da: { "settings.language": "Sprog", "settings.theme": undefined },
    };
    i18n.loadTranslations(translations);
    expect(i18n.translate("settings.language")).toBe("Sprog");
    expect(i18n.translate("settings.theme")).toBe("Theme");
  });
});

describe("shared words", () => {
  test("load beneath the product's words when the product opts in", async () => {
    const win = stubPage({ stored: { language: "da" }, translations: { da: { Close: "Luk ned" } } });
    const i18n = await loadModule();
    expect(i18n.translate("Save")).toBe("Save");

    let ready = 0;
    win.addEventListener("translations-ready", () => ready++);
    i18n.configureI18n({ sharedWords: true });
    await i18n.loadSharedWords();

    expect(ready).toBeGreaterThan(0);
    expect(i18n.translate("Save")).toBe("Gem");
    expect(i18n.translate("Close")).toBe("Luk ned");
    expect(i18n.textInLanguage("Nothing here yet", "ja")).toBe("まだ何もありません");
    expect(i18n.textInLanguage("Cancel", "nn")).toBe("Avbryt");
    expect(i18n.textInLanguage("Japanese", "ja")).toBe("日本語");
    expect(i18n.hasTranslation("Sign in")).toBe(true);
    // The languages offered stay the product's
    expect(i18n.getAvailableLanguagesSync()).toEqual(["da"]);
  });

  test("survive a product file arriving", async () => {
    const win = stubPage({ stored: { language: "sv" } });
    const fetcher = vi.fn(async (source: string) =>
      source === "/translations/sv.json"
        ? new Response(JSON.stringify({ Hello: "Hej" }))
        : new Response("", { status: 404 })
    );
    vi.stubGlobal("fetch", fetcher);
    const i18n = await loadModule();
    i18n.configureI18n({
      languages: ["en", "sv"],
      languageFile: "/translations/{language}.json",
      sharedWords: true,
    });
    await i18n.loadSharedWords();
    // A bare per-language file is read as that language's table
    await vi.waitFor(() => expect(win.DS_ONE_TRANSLATIONS?.sv).toEqual({ Hello: "Hej" }));
    expect(i18n.translate("Hello")).toBe("Hej");
    expect(i18n.translate("Search")).toBe("Sök");
  });

  test("every shared language file is in the format, in sentence case", async () => {
    const { SHARED_WORDS } = await import("../DS1/0-face/shared-words");
    const { validateTranslations } = await import("../DS1/0-face/translations-format");
    const { isLanguage } = await import("../DS1/0-face/languages");
    expect(validateTranslations(SHARED_WORDS)).toEqual({ valid: true, errors: [], warnings: [] });
    const english = Object.keys(SHARED_WORDS.en ?? {});
    for (const [language, table] of Object.entries(SHARED_WORDS)) {
      expect(isLanguage(language), language).toBe(true);
      for (const [key, text] of Object.entries(table ?? {})) {
        expect(english, `${language}: ${key}`).toContain(key);
        expect(text, `${language}: ${key}`).not.toMatch(/^[A-ZÆØÅÄÖÜ]{2,}( [A-ZÆØÅÄÖÜ]+)+$/);
      }
    }
  });
});
