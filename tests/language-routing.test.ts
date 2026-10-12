import { afterEach, describe, expect, test, vi } from "vite-plus/test";

type Routing = typeof import("../DS1/0-face/language-routing");

// A fresh module per test, since the routing options are module state
async function load(): Promise<Routing> {
  vi.resetModules();
  return import("../DS1/0-face/language-routing");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isLanguageSlug", () => {
  test("knows the list's languages in any case", async () => {
    const routing = await load();
    expect(routing.isLanguageSlug("ja")).toBe(true);
    expect(routing.isLanguageSlug("JA")).toBe(true);
    expect(routing.isLanguageSlug("pt-br")).toBe(true);
    expect(routing.isLanguageSlug("Ab12Xy")).toBe(false);
    expect(routing.isLanguageSlug("")).toBe(false);
  });

  test("follows the languages given, or configured", async () => {
    const routing = await load();
    expect(routing.isLanguageSlug("fi", ["en", "ja"])).toBe(false);
    routing.configureLanguageRouting({ languages: ["en", "ja"] });
    expect(routing.isLanguageSlug("fi")).toBe(false);
    expect(routing.isLanguageSlug("ja")).toBe(true);
  });
});

describe("parseLanguagePath", () => {
  test("splits off the language and keeps the rest", async () => {
    const routing = await load();
    expect(routing.parseLanguagePath("/ja/pricing")).toEqual({ language: "ja", restPath: "/pricing" });
    expect(routing.parseLanguagePath("/ja")).toEqual({ language: "ja", restPath: "/" });
    expect(routing.parseLanguagePath("/ja/")).toEqual({ language: "ja", restPath: "/" });
    expect(routing.parseLanguagePath("/pt-br/a/b/")).toEqual({ language: "pt-BR", restPath: "/a/b/" });
    expect(routing.parseLanguagePath("/ja/list?view=week#today")).toEqual({
      language: "ja",
      restPath: "/list?view=week#today",
    });
  });

  test("leaves an address without a language as it is", async () => {
    const routing = await load();
    expect(routing.parseLanguagePath("/pricing")).toEqual({ language: null, restPath: "/pricing" });
    expect(routing.parseLanguagePath("/japan")).toEqual({ language: null, restPath: "/japan" });
    expect(routing.parseLanguagePath("")).toEqual({ language: null, restPath: "/" });
    expect(routing.parseLanguagePath("pricing")).toEqual({ language: null, restPath: "/pricing" });
  });

  test("reads only the configured languages as a prefix", async () => {
    const routing = await load();
    routing.configureLanguageRouting({ languages: ["en", "da"] });
    expect(routing.parseLanguagePath("/is/news").language).toBeNull();
    expect(routing.parseLanguagePath("/is/news", { languages: ["is"] }).language).toBe("is");
  });
});

describe("withLanguagePrefix and stripLanguagePrefix", () => {
  test("adds, replaces and never doubles a prefix", async () => {
    const routing = await load();
    expect(routing.withLanguagePrefix("/pricing", "ja")).toBe("/ja/pricing");
    expect(routing.withLanguagePrefix("pricing", "ja")).toBe("/ja/pricing");
    expect(routing.withLanguagePrefix("/ja/pricing", "ja")).toBe("/ja/pricing");
    expect(routing.withLanguagePrefix("/da/pricing", "ja")).toBe("/ja/pricing");
    expect(routing.withLanguagePrefix("/", "ja")).toBe("/ja");
    expect(routing.withLanguagePrefix("/list?x=1", "pt-BR")).toBe("/pt-br/list?x=1");
  });

  test("gives the default language and unconfigured languages the bare address", async () => {
    const routing = await load();
    expect(routing.withLanguagePrefix("/ja/pricing", "en")).toBe("/pricing");
    expect(routing.withLanguagePrefix("/pricing", "xx")).toBe("/pricing");
    routing.configureLanguageRouting({ languages: ["en", "da"] });
    expect(routing.withLanguagePrefix("/pricing", "ja")).toBe("/pricing");
  });

  test("prefixes the default language when asked", async () => {
    const routing = await load();
    routing.configureLanguageRouting({ prefixDefaultLanguage: true });
    expect(routing.withLanguagePrefix("/pricing", "en")).toBe("/en/pricing");
    expect(routing.withLanguagePrefix("/pricing", "da", { defaultLanguage: "da", prefixDefaultLanguage: false })).toBe(
      "/pricing"
    );
    expect(routing.getLanguageRoutingOptions().prefixDefaultLanguage).toBe(true);
  });

  test("stripLanguagePrefix removes only a language", async () => {
    const routing = await load();
    expect(routing.stripLanguagePrefix("/ja/pricing")).toBe("/pricing");
    expect(routing.stripLanguagePrefix("/pricing")).toBe("/pricing");
    expect(routing.stripLanguagePrefix("/ja")).toBe("/");
  });

  test("imports without a window", async () => {
    vi.stubGlobal("window", undefined);
    const routing = await load();
    expect(routing.withLanguagePrefix("/a", "da")).toBe("/da/a");
  });
});
