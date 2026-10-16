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

const FIELDS = [
  '<ds-input label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input error="Enter a valid email address"></ds-input>',
  '<ds-input variant="field" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="field" error-text="Enter a valid email address"></ds-input>',
  '<ds-input variant="row" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="plain" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="outlined" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="filled" label="Email" error="Enter a valid email address"></ds-input>',
  '<ds-input type="password" revealable label="Password" error="Wrong password"></ds-input>',
  '<ds-input variant="field" label="Email" style="width: 120px" error-text="Enter a valid email address"></ds-input>',
  '<ds-input label="Email" style="--ds-sf: 1.5" error="Enter a valid email address"></ds-input>',
  '<ds-input variant="row" style="--ds-sf: 1.5" error="Enter a valid email address"></ds-input>',
  '<ds-textarea label="Notes" error="Check this description"></ds-textarea>',
  '<ds-textarea variant="default" error="Check this description"></ds-textarea>',
];

test("an input's error starts on the square below its control, on one-square lines in the native field's danger colour", async () => {
  for (const scheme of SCHEMES) {
    const page = pages[scheme];
    await stage(page, '<label class="ds-field"><span class="ds-field__label">Email</span><input class="ds-input"><span class="ds-field__error">Enter a valid email address</span></label>');
    const native = await page.evaluate(() => {
      const field = document.querySelector(".ds-field")!.getBoundingClientRect();
      const error = document.querySelector(".ds-field__error")!;
      return { top: error.getBoundingClientRect().top - field.top, color: getComputedStyle(error).color };
    });
    expect(native.top).toBe(2 * UNIT);
    expect(native.color).toBe(scheme === "light" ? "rgb(222, 3, 49)" : "rgb(255, 95, 95)");
    for (const markup of FIELDS) {
      await stage(page, markup);
      const field = await page.evaluate(() => {
        const element = document.getElementById("stage")!.firstElementChild as HTMLElement;
        const square = 20 * (parseFloat(getComputedStyle(element).getPropertyValue("--ds-sf")) || 1);
        const host = element.getBoundingClientRect();
        const control = element.shadowRoot!.querySelector("input, textarea")!.getBoundingClientRect();
        const error = element.shadowRoot!.querySelector<HTMLElement>(".error-message")!;
        const box = error.getBoundingClientRect();
        const label = element.shadowRoot!.querySelector("label");
        return { square, host: host.height, controlEnd: control.bottom - host.top, top: box.top - host.top, height: box.height, color: getComputedStyle(error).color,
          lineHeight: parseFloat(getComputedStyle(error).lineHeight), label: label ? label.getBoundingClientRect().height : 0 };
      });
      const where = `${markup} (${scheme})`;
      expect(field.top % field.square, `${where}: error on a square`).toBe(0);
      expect(field.top, `${where}: error on the square below the control`).toBe(Math.ceil(field.controlEnd / field.square) * field.square);
      expect(field.lineHeight, `${where}: one-square lines`).toBe(field.square);
      expect(field.height % field.square, `${where}: whole lines`).toBe(0);
      expect(field.host % field.square, `${where}: the field on whole squares`).toBe(0);
      expect(field.color, `${where}: danger colour`).toBe(native.color);
    }
  }
});

test("a required field's mark is the danger colour", async () => {
  for (const scheme of SCHEMES) {
    await stage(pages[scheme], '<ds-input variant="field" label="Email" required></ds-input><span class="ds-field__error">x</span>');
    const [mark, danger] = await pages[scheme].evaluate(() => [
      getComputedStyle(document.querySelector("ds-input")!.shadowRoot!.querySelector("label")!, "::after").color,
      getComputedStyle(document.querySelector(".ds-field__error")!).color,
    ]);
    expect(mark, scheme).toBe(danger);
  }
});

test("a secondary ds-button's words are the native secondary button's ink, light and dark", async () => {
  for (const scheme of SCHEMES) {
    const page = pages[scheme];
    await stage(page, '<button class="ds-button ds-button--secondary">Cancel</button><ds-button secondary>Cancel</ds-button><ds-button secondary href="#cancel">Cancel</ds-button><ds-button secondary control="host">Cancel</ds-button><p class="ds-text">Cancel</p>');
    const [native, element, link, host, text] = await page.evaluate(() => [...document.getElementById("stage")!.children].map((element) => {
      const face = element.localName === "ds-button" && element.getAttribute("control") !== "host" ? element.shadowRoot!.querySelector('[part="control"]')! : element;
      const style = getComputedStyle(face);
      return { color: style.color, background: style.backgroundColor };
    }));
    expect(native!.color, scheme).toBe(text!.color);
    expect(native!.color, scheme).toBe(scheme === "light" ? "rgb(42, 42, 42)" : "rgb(255, 255, 255)");
    for (const face of [element!, link!, host!]) {
      expect(face.color, scheme).toBe(native!.color);
      expect(face.background, scheme).toBe(native!.background);
    }
  }
});
