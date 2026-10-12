import { describe, expect, test } from "vite-plus/test";
import {
  englishText,
  fillPlaceholders,
  isTranslationsFile,
  placeholdersIn,
  readLanguageFile,
  resolveText,
  validateTranslations,
} from "../DS1/0-face/translations-format";

// Ezo, the 0001 site and Peer: keyed by the English sentence, {name}
const sentenceKeyed = {
  da: { Send: "Send", "Hello {name}": "Hej {name}" },
  ja: { Send: "送信" },
};

// Link and Consistency: keyed by a dotted id, an English table, {{name}}
const idKeyed = {
  en: { "settings.language": "Language", "auth.magicLinkSentTo": "We sent a link to {{email}}." },
  da: { "settings.language": "Sprog", "auth.magicLinkSentTo": "Vi sendte et link til {{email}}." },
  "pt-BR": { "settings.language": "Idioma" },
};

describe("placeholders", () => {
  test("fills {name} and {{name}} alike", () => {
    expect(fillPlaceholders("Hej {name}", { name: "Ada" })).toBe("Hej Ada");
    expect(fillPlaceholders("{{count}} items", { count: 3 })).toBe("3 items");
    expect(fillPlaceholders("{{ count }} of {total}", { count: 1, total: 2 })).toBe("1 of 2");
  });

  test("leaves a placeholder with no value as written", () => {
    expect(fillPlaceholders("Hi {name}, {{missing}}", { name: "Bo" })).toBe("Hi Bo, {{missing}}");
    expect(fillPlaceholders("Hi {name}")).toBe("Hi {name}");
  });

  test("lists a text's placeholders once each", () => {
    expect(placeholdersIn("{a} {{b}} {a} {user.name}")).toEqual(["a", "b", "user.name"]);
  });
});

describe("resolveText", () => {
  test("serves sentence keys, the key being the English text", () => {
    expect(resolveText("Send", "ja", [sentenceKeyed]).text).toBe("送信");
    expect(resolveText("Hello {name}", "da", [sentenceKeyed], { name: "Ada" }).text).toBe("Hej Ada");
    expect(resolveText("Hello {name}", "sv", [sentenceKeyed], { name: "Ada" })).toEqual({
      text: "Hello Ada",
      language: null,
    });
  });

  test("serves id keys from the English table", () => {
    expect(resolveText("settings.language", "da", [idKeyed]).text).toBe("Sprog");
    expect(resolveText("settings.language", "sv", [idKeyed])).toEqual({ text: "Language", language: "en" });
    expect(resolveText("auth.magicLinkSentTo", "da", [idKeyed], { email: "a@b.c" }).text).toBe(
      "Vi sendte et link til a@b.c."
    );
  });

  test("falls back from the language to its subtag, its relatives, English, the key", () => {
    const words = {
      en: { a: "A", b: "B", c: "C", d: "D" },
      nb: { a: "nb A" },
      pt: { b: "pt B" },
      ja: { c: "ja C" },
    };
    expect(resolveText("a", "nn", [words])).toEqual({ text: "nb A", language: "nb" });
    expect(resolveText("b", "pt-BR", [words])).toEqual({ text: "pt B", language: "pt" });
    expect(resolveText("c", "ja-JP", [words])).toEqual({ text: "ja C", language: "ja" });
    expect(resolveText("d", "ja-JP", [words])).toEqual({ text: "D", language: "en" });
    expect(resolveText("e", "ja-JP", [words])).toEqual({ text: "e", language: null });
  });

  test("looks in each source per language, the first source winning", () => {
    const product = { en: { Save: "Keep" }, da: { Close: "Luk ned" } };
    const shared = { da: { Save: "Gem", Close: "Luk" } };
    expect(resolveText("Close", "da", [product, shared]).text).toBe("Luk ned");
    // A word in the reader's language beats the product's English
    expect(resolveText("Save", "da", [product, shared]).text).toBe("Gem");
    expect(resolveText("Save", "sv", [product, shared]).text).toBe("Keep");
  });

  test("englishText reads the English table, else the key", () => {
    expect(englishText(idKeyed, "settings.language")).toBe("Language");
    expect(englishText(sentenceKeyed, "Send")).toBe("Send");
  });
});

describe("readLanguageFile", () => {
  test("takes a wrapped or a bare table", () => {
    expect(readLanguageFile("da", { da: { Save: "Gem" } })).toEqual({ da: { Save: "Gem" } });
    expect(readLanguageFile("da", { Save: "Gem" })).toEqual({ da: { Save: "Gem" } });
    expect(readLanguageFile("da", { en: { Save: "Save" } })).toEqual({ en: { Save: "Save" } });
    expect(readLanguageFile("da", [])).toBeNull();
    expect(readLanguageFile("da", "Gem")).toBeNull();
  });
});

describe("validateTranslations", () => {
  test("accepts both key shapes", () => {
    expect(validateTranslations(sentenceKeyed)).toEqual({ valid: true, errors: [], warnings: [] });
    expect(validateTranslations(idKeyed)).toEqual({ valid: true, errors: [], warnings: [] });
    expect(isTranslationsFile(idKeyed)).toBe(true);
  });

  test("refuses what cannot load", () => {
    expect(validateTranslations(null).valid).toBe(false);
    expect(validateTranslations(["da"]).valid).toBe(false);
    expect(validateTranslations({ da: "Gem" }).errors).toHaveLength(1);
    expect(validateTranslations({ da: { Save: 1 } }).errors[0]).toMatch(/Save/);
    expect(isTranslationsFile({ da: { Save: 1 } })).toBe(false);
  });

  test("warns about likely mistakes", () => {
    const { valid, warnings } = validateTranslations({
      en: { "a.b": "Hi {{name}}" },
      da: { "a.b": "Hej", "c.d": "Ingen engelsk", "Hello {name}": "Hej {navn}" },
      xx: {},
    });
    expect(valid).toBe(true);
    expect(warnings).toEqual([
      '"da" → "a.b" has placeholders [] where English has [name].',
      '"c.d" has no English text, so English readers see the key.',
      '"da" → "Hello {name}" has placeholders [navn] where English has [name].',
      '"xx" is not in the language list.',
    ]);
  });

  test("takes undefined values, as a Partial table in a module has", () => {
    expect(validateTranslations({ en: { a: "A" }, da: { a: undefined } }).valid).toBe(true);
  });
});
