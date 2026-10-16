// @vitest-environment node
// Real layout and colour: the components are drawn in Chromium, light and dark, beside the
// native classes of controls.css that they must match.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

const UNIT = 20;
const SCHEMES = ["light", "dark"] as const;
type Scheme = (typeof SCHEMES)[number];
let server: ViteDevServer;
let browser: Browser;
const pages = {} as Record<Scheme, Page>;

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  const url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/control-measure.html`;
  for (const scheme of SCHEMES) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, colorScheme: scheme });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    pages[scheme] = page;
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** Puts markup on the stage and waits for its components to render, measure and paint. */
async function stage(page: Page, markup: string) {
  await page.evaluate(async (markup) => {
    const stage = document.getElementById("stage")!;
    stage.innerHTML = markup;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
  }, markup);
}

const WORDS = ["Done", "Draft", "Live", "Open", "Sent", "To do", "Failed", "Password on", "Access restored"];

test("a badge never cuts short words that fit, rounding its width up to whole squares as the native class does", async () => {
  const page = pages.light;
  for (const words of WORDS) {
    await stage(page, `<ds-badge>${words}</ds-badge><span class="ds-badge">${words}</span><ds-badge icon="check">${words}</ds-badge>`);
    const [plain, native, withIcon] = await page.evaluate(() => [...document.getElementById("stage")!.children].map((element) => {
      const frame = element.shadowRoot?.querySelector<HTMLElement>(".frame") ?? (element as HTMLElement);
      const label = element.shadowRoot?.querySelector<HTMLElement>(".label") ?? (element as HTMLElement);
      const words = document.createRange();
      words.selectNodeContents(element);
      return { width: frame.getBoundingClientRect().width, label: label.getBoundingClientRect().width, words: words.getBoundingClientRect().width, cut: label.scrollWidth > label.clientWidth };
    }));
    for (const badge of [plain!, withIcon!]) {
      expect(badge.width % UNIT, `${words} on whole squares`).toBe(0);
      expect(badge.words, `${words} fits its label`).toBeLessThanOrEqual(badge.label);
      expect(badge.cut, `${words} is not cut short`).toBe(false);
    }
    expect(plain!.width, `${words} as wide as the native badge`).toBe(native!.width);
    expect(native!.cut).toBe(false);
  }
  // 32.3px of words and 8px of padding: three squares. Rounding the words down to 32px gave two, and "Do…".
  await stage(page, "<ds-badge>Done</ds-badge>");
  expect(await page.evaluate(() => document.querySelector("ds-badge")!.shadowRoot!.querySelector(".frame")!.getBoundingClientRect().width)).toBe(3 * UNIT);
});

test("a badge with more words than room stays inside it and cuts them short", async () => {
  await stage(pages.light, '<div style="width: 50px"><ds-badge>Access restored</ds-badge></div>');
  const badge = await pages.light.evaluate(() => {
    const element = document.querySelector("ds-badge")!;
    const label = element.shadowRoot!.querySelector<HTMLElement>(".label")!;
    return { width: element.shadowRoot!.querySelector(".frame")!.getBoundingClientRect().width, cut: label.scrollWidth > label.clientWidth };
  });
  expect(badge.width).toBeLessThanOrEqual(50);
  expect(badge.cut).toBe(true);
});
