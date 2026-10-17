// @vitest-environment happy-dom
import { build } from "esbuild";
import { join } from "node:path";
import { expect, test, vi } from "vite-plus/test";

/*
 * What a page pays for the feedback module: copyText alone does not load the
 * page toaster until it shows a toast, and the module carries no language
 * runtime unless the page loads one.
 */

const root = join(import.meta.dirname, "..");
const TRANSLATOR = Symbol.for("design-system-1.translate");
const translator = () => (globalThis as unknown as Record<symbol, unknown>)[TRANSLATOR];

/** The code a bundler puts in the page for `entry`, split at dynamic imports. */
async function bundle(entry: string) {
  const result = await build({
    entryPoints: [join(root, entry)],
    bundle: true,
    splitting: true,
    format: "esm",
    write: false,
    outdir: join(root, ".bundle-test"),
    logLevel: "silent",
  });
  const [first, ...rest] = result.outputFiles.filter(file => file.path.endsWith(".js"));
  const main = result.outputFiles.find(file => /copy-text|feedback/.test(file.path)) ?? first!;
  return { main: main.text, chunks: [first!, ...rest].filter(file => file !== main).map(file => file.text) };
}

test("copyText alone leaves the page toaster in a chunk of its own", async () => {
  const { main, chunks } = await bundle("DS1/0-face/copy-text.ts");
  expect(main).not.toContain("data-ds-toaster");
  expect(main).not.toContain("--ds-toast");
  expect(main).toMatch(/import\(["']\.\/load-toaster-[^"']+\.js["']\)/);
  expect(chunks.some(chunk => chunk.includes("data-ds-toaster"))).toBe(true);
});

test("the feedback module carries no language runtime", async () => {
  const { main, chunks } = await bundle("DS1/0-face/feedback.ts");
  for (const code of [main, ...chunks]) {
    expect(code).not.toContain("translations.json");
    expect(code).not.toContain("configureI18n");
    expect(code).not.toContain("Kopieret");
  }
});

test("copyText with no toast never loads the page toaster, and with one loads it then", async () => {
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => undefined) } });
  const { copyText } = await import("../DS1/0-face/copy-text");
  const { toasterListening } = await import("../DS1/0-face/toast-queue");
  expect(await copyText("abc", { toast: false })).toBe(true);
  expect(toasterListening()).toBe(false);
  expect(document.querySelector("[data-ds-toaster]")).toBeNull();

  expect(await copyText("abc")).toBe(true);
  expect(toasterListening()).toBe(true);
  const host = document.querySelector<HTMLElement>("[data-ds-toaster]")!;
  await new Promise(resolve => setTimeout(resolve, 20));
  // English, with no language module in the page.
  expect(translator()).toBeUndefined();
  expect([...host.shadowRoot!.querySelectorAll(".title")].map(title => title.textContent)).toEqual(["Copied"]);
  vi.unstubAllGlobals();
});

test("default words are English without the language module, and a product can give its own", async () => {
  const { confirm, setFeedbackWords } = await import("../DS1/0-face/feedback");
  const buttons = () => [...document.querySelectorAll<HTMLButtonElement>("dialog button")].map(button => button.textContent);
  const answer = (value: "confirm" | "cancel") => document.querySelector<HTMLButtonElement>(`dialog button[value="${value}"]`)!.click();

  const first = confirm("Leave?");
  expect(buttons()).toEqual(["Cancel", "OK"]);
  answer("cancel");
  await first;

  setFeedbackWords({ OK: "Leave" });
  const second = confirm("Leave?");
  expect(buttons()).toEqual(["Cancel", "Leave"]);
  answer("cancel");
  await second;

  setFeedbackWords(word => word.toUpperCase());
  const third = confirm("Leave?");
  expect(buttons()).toEqual(["CANCEL", "OK"]);
  answer("cancel");
  await third;
  setFeedbackWords(null);
  expect(translator()).toBeUndefined();

  // Once the page loads the language module, its words take over.
  const { configureI18n, loadSharedWords, setLanguage } = await import("../DS1/0-face/i18n");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
  configureI18n({ languages: ["en", "da"], sharedWords: true, autoLoad: false });
  await loadSharedWords();
  setLanguage("da");
  expect(typeof translator()).toBe("function");
  const fourth = confirm("Gå?");
  expect(buttons()).toEqual(["Annuller", "OK"]);
  answer("cancel");
  await fourth;
  setLanguage("en");
  vi.unstubAllGlobals();
});
