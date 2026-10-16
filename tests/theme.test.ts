// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Window } from "happy-dom";
import { afterEach, expect, test, vi } from "vite-plus/test";
import config from "../sync.exports.mjs";

const source = readFileSync(join(import.meta.dirname, "../DS1/0-face/theme-bootstrap.js"), "utf8");
const opened: Window[] = [];

type PageOptions = {
  dark?: boolean;
  reduced?: boolean;
  storage?: Record<string, string>;
  preferences?: Record<string, unknown>;
  i18n?: Record<string, unknown>;
  head?: string;
  blocked?: boolean;
  transition?: (callback: () => void) => unknown;
};

/** A fresh page that runs the head script, as a browser would before the first paint. */
function page({ dark = false, reduced = false, storage = {}, preferences, i18n, head = "", blocked = false, transition }: PageOptions = {}) {
  const window = new Window({ url: "https://example.test/" });
  opened.push(window);
  const scheme = Object.assign(new window.EventTarget(), { matches: dark });
  Object.assign(window, { matchMedia: (query: string) => query.includes("color-scheme") ? scheme : { matches: reduced } });
  for (const [key, value] of Object.entries(storage)) window.localStorage.setItem(key, value);
  if (blocked) {
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => { throw new Error("Blocked"); });
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => { throw new Error("Blocked"); });
  }
  if (preferences) Object.assign(window, { DS_ONE_PREFERENCES: preferences });
  if (i18n) Object.assign(window, { DS_ONE_I18N: i18n });
  if (transition) Object.assign(window.document, { startViewTransition: transition });
  window.document.head.innerHTML = head;
  window.eval(source);
  const root = window.document.documentElement;
  const runtime = (window as unknown as { DS_ONE_THEME: { mode(): string; theme(): string; set(mode: string): void; apply(): void } }).DS_ONE_THEME;
  const changes: Array<{ theme: string; mode: string }> = [];
  window.addEventListener("theme-changed", event => changes.push((event as unknown as CustomEvent).detail));
  const system = (matches: boolean) => { scheme.matches = matches; scheme.dispatchEvent(new window.Event("change")); };
  return { window, root, runtime, changes, system, meta: () => window.document.querySelector('meta[name="theme-color"]')?.getAttribute("content") };
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(opened.splice(0).map(window => window.happyDOM.close()));
});

test("with nothing stored the first paint follows the system, marked every way pages key on it", () => {
  const { root, runtime, meta } = page({ dark: true });
  expect(runtime.mode()).toBe("system");
  expect(runtime.theme()).toBe("dark");
  expect(root.classList.contains("dark-theme")).toBe(true);
  expect(root.classList.contains("light-theme")).toBe(false);
  expect(root.getAttribute("data-theme")).toBe("dark");
  expect(root.style.colorScheme).toBe("dark");
  expect(root.style.getPropertyValue("--lightningcss-dark")).toBe("initial");
  // The other branch gets an empty value (one space), which happy-dom does not keep; browsers do.
  expect(root.style.getPropertyValue("--lightningcss-light")).not.toBe("initial");
  expect(root.style.backgroundColor).toMatch(/#2a2a2a|rgb\(42, 42, 42\)/);
  expect(meta()).toBe("#2a2a2a");
});

test("system mode follows the system live and announces each change", () => {
  const { root, runtime, changes, system } = page({ dark: false });
  expect(root.classList.contains("light-theme")).toBe(true);
  expect(root.style.getPropertyValue("--lightningcss-light")).toBe("initial");
  expect(root.style.getPropertyValue("--lightningcss-dark")).not.toBe("initial");
  system(true);
  expect(runtime.theme()).toBe("dark");
  expect(root.classList.contains("dark-theme")).toBe(true);
  expect(root.classList.contains("light-theme")).toBe(false);
  system(false);
  expect(root.getAttribute("data-theme")).toBe("light");
  expect(changes).toEqual([{ theme: "dark", mode: "system" }, { theme: "light", mode: "system" }]);
});

test("a stored choice wins over the system until system is chosen, which is stored too", () => {
  const { window, root, runtime, changes, system } = page({ dark: true, storage: { "ds-one:theme": "light" } });
  expect(runtime.mode()).toBe("light");
  expect(root.classList.contains("light-theme")).toBe(true);
  system(false); system(true);
  expect(root.classList.contains("light-theme")).toBe(true);
  expect(changes).toEqual([]);
  runtime.set("system");
  expect(window.localStorage.getItem("ds-one:theme")).toBe("system");
  expect(runtime.theme()).toBe("dark");
  runtime.set("dark");
  expect(window.localStorage.getItem("ds-one:theme")).toBe("dark");
  runtime.set("sepia");
  expect(window.localStorage.getItem("ds-one:theme")).toBe("dark");
  expect(changes).toEqual([{ theme: "dark", mode: "system" }, { theme: "dark", mode: "dark" }]);
});

test("a product's storage key and paper are kept, and other tabs and restored pages agree", () => {
  const { window, root, runtime, meta } = page({
    storage: { "product:theme": "dark", "ds-one:theme": "light" },
    preferences: { themeStorageKey: "product:theme", themePaper: { light: "#fafafa", dark: "#000000" } },
    head: '<meta name="theme-color" content="#123456">',
  });
  expect(runtime.theme()).toBe("dark");
  expect(meta()).toBe("#000000");
  expect(window.document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
  window.localStorage.setItem("product:theme", "light");
  window.dispatchEvent(new window.StorageEvent("storage", { key: "ds-one:theme" }));
  expect(root.classList.contains("dark-theme")).toBe(true);
  window.dispatchEvent(new window.StorageEvent("storage", { key: "product:theme" }));
  expect(root.classList.contains("light-theme")).toBe(true);
  expect(meta()).toBe("#fafafa");
  window.localStorage.setItem("product:theme", "dark");
  window.dispatchEvent(new window.Event("pageshow"));
  expect(runtime.theme()).toBe("dark");
  expect(window.localStorage.getItem("ds-one:theme")).toBe("light");
});

test("an automatic surface neither reads nor writes the stored choice, but a choice lasts for the page", () => {
  const { window, runtime, system } = page({ storage: { "ds-one:theme": "dark" }, preferences: { themeMode: "system" } });
  expect(runtime.mode()).toBe("system");
  expect(runtime.theme()).toBe("light");
  runtime.set("dark");
  expect(runtime.theme()).toBe("dark");
  system(false);
  expect(runtime.theme()).toBe("dark");
  runtime.set("system");
  expect(runtime.theme()).toBe("light");
  expect(window.localStorage.getItem("ds-one:theme")).toBe("dark");
});

test("blocked storage still themes the page and keeps a choice for the visit", () => {
  const { root, runtime } = page({ dark: true, blocked: true });
  expect(root.classList.contains("dark-theme")).toBe(true);
  runtime.set("light");
  expect(root.classList.contains("light-theme")).toBe(true);
});

test("paper false leaves the canvas and theme-color to the page", () => {
  const { root, meta } = page({ preferences: { themePaper: false } });
  expect(root.style.backgroundColor).toBe("");
  expect(meta()).toBeUndefined();
});

test("the stored language goes on the root before the first paint, within the product's languages", () => {
  expect(page({ storage: { language: "ja" } }).root.lang).toBe("ja");
  expect(page({ storage: { "product:language": "pt-BR" }, i18n: { storageKey: "product:language" } }).root.lang).toBe("pt-BR");
  expect(page({ storage: { language: "ja" }, i18n: { persist: false } }).root.lang).toBe("");
  expect(page({ storage: { language: "de" }, i18n: { languages: ["en", "ja"] } }).root.lang).toBe("");
  expect(page({ storage: { language: "<script>" } }).root.lang).toBe("");
});

test("a change after the first paint crosses over, a skipped crossing still lands, and reduced motion jumps", async () => {
  const crossings: Array<() => void> = [];
  const transition = (callback: () => void) => {
    crossings.push(callback);
    return { ready: Promise.reject(new Error("Skipped")), updateCallbackDone: Promise.reject(new Error("Skipped")), finished: Promise.reject(new Error("Skipped")), skipTransition() {} };
  };
  const crossing = page({ transition });
  expect(crossings).toHaveLength(0);
  crossing.runtime.set("dark");
  expect(crossings).toHaveLength(1);
  await new Promise(resolve => setTimeout(resolve));
  expect(crossing.root.classList.contains("dark-theme")).toBe(true);

  const still = page({ reduced: true, transition });
  still.runtime.set("dark");
  expect(crossings).toHaveLength(1);
  expect(still.root.classList.contains("dark-theme")).toBe(true);
});

test("the script installs once, so inlining it and importing the module share one runtime", () => {
  const { window, runtime } = page();
  window.eval(source);
  expect((window as unknown as { DS_ONE_THEME: unknown }).DS_ONE_THEME).toBe(runtime);
});

test("the module mirrors the runtime in signals and the theme cycle offers system", async () => {
  vi.resetModules();
  localStorage.clear();
  const { currentTheme, currentThemeMode, setThemeMode, getThemeMode } = await import("../DS1/0-face/theme");
  const { Cycle } = await import("../DS1/2-core/ds-cycle");
  expect(window.DS_ONE_THEME).toBeDefined();
  expect(currentThemeMode.get()).toBe("system");
  setThemeMode("dark");
  expect(currentTheme.get()).toBe("dark");
  expect(getThemeMode()).toBe("dark");
  expect(localStorage.getItem("ds-one:theme")).toBe("dark");

  const cycle = new Cycle(); cycle.type = "theme";
  document.body.append(cycle); await cycle.updateComplete;
  const label = () => cycle.shadowRoot!.querySelector("ds-text")!.getAttribute("text");
  expect(cycle.values).toEqual(["light", "dark", "system"]);
  expect(label()).toBe("Dark");
  const button = () => cycle.shadowRoot!.querySelector("ds-button")!.shadowRoot!.querySelector("button")!;
  await cycle.shadowRoot!.querySelector("ds-button")!.updateComplete;
  button().click(); await cycle.updateComplete;
  expect(label()).toBe("System");
  expect(currentThemeMode.get()).toBe("system");
  expect(localStorage.getItem("ds-one:theme")).toBe("system");
  button().click(); await cycle.updateComplete;
  expect(label()).toBe("Light");
  expect(document.documentElement.classList.contains("light-theme")).toBe(true);
  cycle.remove();
});

test("the root export copies the head script on its own, as a classic script", () => {
  const exports = config.exports as unknown as Record<string, { files(context: object): Record<string, string> }>;
  const read = (path: string) => readFileSync(join(import.meta.dirname, "..", path), "utf8");
  const copy = exports.root.files({ read, options: { styles: [], fonts: false, modules: ["theme-bootstrap"] } });
  expect(Object.keys(copy)).toEqual(["0-face/theme-bootstrap.js"]);
  expect(copy["0-face/theme-bootstrap.js"]).not.toMatch(/^\s*(import|export)\b/m);
});
