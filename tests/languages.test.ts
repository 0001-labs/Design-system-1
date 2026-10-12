import { describe, expect, test } from "vite-plus/test";
import {
  LANGUAGES,
  LANGUAGE_METADATA,
  fallbackLanguages,
  isLanguage,
  languageOrder,
  normalizeLanguage,
  pickLanguages,
} from "../DS1/0-face/languages";
import type { Language } from "../DS1/0-face/languages";

// The languages Link and Consistency speak today
const LINK: Language[] = ["en", "da", "sv", "nb", "fi", "is", "ja", "de", "fr", "es", "ko", "pt-BR"];
const CONSISTENCY: Language[] = [...LINK, "it", "zh"];

describe("the list", () => {
  test("is the union of every product's languages, in one order", () => {
    expect(LANGUAGES).toEqual([
      "da", "de", "en", "es", "fi", "fr", "is", "it", "ja", "ko", "nb", "nn", "no", "pt", "pt-BR", "sv", "zh",
    ]);
  });

  test("names every language in English and in itself", () => {
    for (const code of LANGUAGES) {
      expect(LANGUAGE_METADATA[code].code).toBe(code);
      expect(LANGUAGE_METADATA[code].label).toBeTruthy();
      expect(LANGUAGE_METADATA[code].nativeLabel).toBeTruthy();
    }
    expect(LANGUAGE_METADATA.nb.nativeLabel).toBe("Norsk bokmål");
    expect(LANGUAGE_METADATA.nn.nativeLabel).toBe("Norsk nynorsk");
    expect(LANGUAGE_METADATA.no.nativeLabel).toBe("Norsk");
    expect(LANGUAGE_METADATA.is.nativeLabel).toBe("Íslenska");
    expect(LANGUAGE_METADATA["pt-BR"].nativeLabel).toBe("Português (Brasil)");
  });

  test("isLanguage knows the codes exactly as written", () => {
    expect(isLanguage("pt-BR")).toBe(true);
    expect(isLanguage("no")).toBe(true);
    expect(isLanguage("pt-br")).toBe(false);
    expect(isLanguage("xx")).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });
});

describe("normalizeLanguage", () => {
  test("reads regions, underscores and case", () => {
    expect(normalizeLanguage("da-DK")).toBe("da");
    expect(normalizeLanguage("en_GB")).toBe("en");
    expect(normalizeLanguage("de-LI")).toBe("de");
    expect(normalizeLanguage("ZH-tw")).toBe("zh");
    expect(normalizeLanguage("zh-Hant-TW")).toBe("zh");
    expect(normalizeLanguage("ja-JP")).toBe("ja");
  });

  test("keeps every Norwegian and both Portugueses apart when all are offered", () => {
    expect(normalizeLanguage("no")).toBe("no");
    expect(normalizeLanguage("no-NO")).toBe("no");
    expect(normalizeLanguage("nb")).toBe("nb");
    expect(normalizeLanguage("nb-NO")).toBe("nb");
    expect(normalizeLanguage("nn")).toBe("nn");
    expect(normalizeLanguage("nn-NO")).toBe("nn");
    expect(normalizeLanguage("pt")).toBe("pt");
    expect(normalizeLanguage("pt-PT")).toBe("pt");
    expect(normalizeLanguage("pt-br")).toBe("pt-BR");
    expect(normalizeLanguage("pt-BR")).toBe("pt-BR");
    expect(normalizeLanguage("pt-AO")).toBe("pt");
  });

  test("gives Link's outcomes with Link's languages", () => {
    const cases: Record<string, Language> = {
      no: "nb", "no-no": "nb", nb: "nb", "nb-NO": "nb", nn: "nb", "nn-NO": "nb",
      pt: "pt-BR", "pt-pt": "pt-BR", "pt-br": "pt-BR", "pt-AO": "pt-BR",
      "": "en", xx: "en", "da-DK": "da", "en-GB": "en", "is-IS": "is", it: "en", zh: "en",
    };
    for (const [input, expected] of Object.entries(cases)) {
      expect(normalizeLanguage(input, "en", LINK), input).toBe(expected);
    }
  });

  test("gives Consistency's outcomes with Consistency's languages", () => {
    expect(normalizeLanguage("zh-HK", "en", CONSISTENCY)).toBe("zh");
    expect(normalizeLanguage("it-IT", "en", CONSISTENCY)).toBe("it");
    expect(normalizeLanguage("no", "en", CONSISTENCY)).toBe("nb");
    expect(normalizeLanguage("pt", "en", CONSISTENCY)).toBe("pt-BR");
  });

  test("reads a browser's list, the first language it knows winning", () => {
    expect(normalizeLanguage("da,en;q=0.8")).toBe("da");
    expect(normalizeLanguage("nl-NL,sv;q=0.9,en;q=0.8")).toBe("sv");
    expect(normalizeLanguage(" ja-JP ; q=1 ")).toBe("ja");
  });

  test("falls back to English, another fallback, or null", () => {
    expect(normalizeLanguage(undefined)).toBe("en");
    expect(normalizeLanguage(null)).toBe("en");
    expect(normalizeLanguage("nl", "da")).toBe("da");
    expect(normalizeLanguage("nl", null)).toBeNull();
    expect(normalizeLanguage("fr", null, ["en", "da"])).toBeNull();
  });
});

describe("pickLanguages", () => {
  test("keeps the list's order and drops what it does not know", () => {
    expect(pickLanguages(["zh", "en", "pt-br", "da", "xx", "en"])).toEqual(["da", "en", "pt-BR", "zh"]);
  });

  test("does not turn a region into its language", () => {
    expect(pickLanguages(["da-DK", "da"])).toEqual(["da"]);
  });
});

describe("ordering and fallbacks", () => {
  test("languageOrder sorts by the list, unknown codes last", () => {
    expect(["xx", "zh", "pt-BR", "da"].sort((a, b) => languageOrder(a) - languageOrder(b))).toEqual([
      "da", "pt-BR", "zh", "xx",
    ]);
    expect(languageOrder("ja-JP")).toBe(languageOrder("ja"));
  });

  test("fallbackLanguages goes from the language to its relatives", () => {
    expect(fallbackLanguages("ja-JP")).toEqual(["ja-JP", "ja"]);
    expect(fallbackLanguages("nn")).toEqual(["nn", "nb", "no"]);
    expect(fallbackLanguages("no")).toEqual(["no", "nb", "nn"]);
    expect(fallbackLanguages("pt-BR")).toEqual(["pt-BR", "pt"]);
    expect(fallbackLanguages("pt")).toEqual(["pt", "pt-BR"]);
    expect(fallbackLanguages("en")).toEqual(["en"]);
  });
});
