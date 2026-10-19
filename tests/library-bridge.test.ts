// @vitest-environment node
// A published library reaches DS1's components through the tokens publishing adds, drawn in
// Chromium, light and dark, at a scale of 1 and 1.5, beside the component tokens alone and one.css.
// Without a library nothing changes.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import { prepareLibrary } from "../packages/css-validate/src/index";

const UNIT = 20;
const SCHEMES = ["light", "dark"] as const;
const SHEETS = ["tokens", "one"] as const;
type Scheme = (typeof SCHEMES)[number];
type Sheets = (typeof SHEETS)[number];
let server: ViteDevServer;
let browser: Browser;
const pages = {} as Record<`${Sheets}-${Scheme}`, Page>;

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  const base = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/library-bridge.html`;
  for (const sheets of SHEETS) for (const scheme of SCHEMES) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, colorScheme: scheme });
    await page.goto(sheets === "one" ? `${base}?sheets=one` : base);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    pages[`${sheets}-${scheme}`] = page;
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const MARKUP = '<ds-button primary id="primary">Save</ds-button><ds-button secondary id="secondary">Cancel</ds-button><ds-input id="field" placeholder="Name"></ds-input><ds-menu id="menu"><ds-button menu-item>Copy</ds-button><ds-button menu-item>Share</ds-button></ds-menu>';

/** Loads a library (or none) at a scale, and reads what the components draw. */
async function draw(page: Page, library: string, scale = 1) {
  return page.evaluate(async ({ library, scale, markup }) => {
    document.getElementById("library")!.textContent = library;
    document.documentElement.style.setProperty("--ds-sf", String(scale));
    document.documentElement.style.setProperty("--sf", String(scale));
    const stage = document.getElementById("stage")!;
    stage.innerHTML = markup;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    const read = (element: Element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color, radius: style.borderTopLeftRadius, border: style.borderTopColor, font: style.fontFamily, size: style.fontSize, height: element.getBoundingClientRect().height };
    };
    const face = (id: string) => document.getElementById(id)!.shadowRoot!.querySelector('[part="control"], input')!;
    const menu = document.getElementById("menu")!;
    return {
      primary: read(face("primary")),
      secondary: read(face("secondary")),
      field: read(face("field")),
      menu: read(menu.shadowRoot!.querySelector("*")!),
      entries: [...menu.querySelectorAll("ds-button")].map(entry => entry.getBoundingClientRect().height),
    };
  }, { library, scale, markup: MARKUP });
}

const legacyPage = ":root { --one-accent-color: #ff0000; --one-radius: 12px; } body { color: #2a2a2a; }";
const library = prepareLibrary([
  ":root {",
  "  --one-accent-color: #d357fe;",
  "  --one-button-primary-background: #d357fe;",
  "  --one-button-primary-text: #ffffff;",
  "  --one-button-neutral-background: #123456;",
  "  --one-radius: 8px;",
  "  --one-font: Georgia, serif;",
  "  --one-font-size: 16px;",
  "  --one-input-background: #abcdef;",
  "  --one-background: #f0f0e0;",
  "  --one-text: #301010;",
  "  --one-border: #00aa00;",
  "}",
  "@media (prefers-color-scheme: dark) { :root { --one-accent-color: #8a2be2; --one-background: #101010; --one-text: #f0f0f0; } }",
].join("\n")).css;

describe("without a library", () => {
  for (const sheets of SHEETS) for (const scheme of SCHEMES) {
    test(`DS1's components draw as they always have (${sheets}, ${scheme})`, async () => {
      const page = pages[`${sheets}-${scheme}`];
      for (const scale of [1, 1.5]) {
        const defaults = await draw(page, "", scale);
        // A prepared library that sets no library token changes nothing.
        expect(await draw(page, prepareLibrary(":root { --brand: pink; }\n.brand { color: var(--brand); }").css, scale)).toEqual(defaults);
        // An older library declares its own --one-* tokens; the components still never read them.
        const beside = await draw(page, legacyPage, scale);
        // Colours a face leaves to the text around it (currentColor) follow the surrounding page body.
        for (const part of ["primary", "secondary", "field", "menu"] as const) {
          for (const property of ["background", "radius", "font", "size", "height"] as const) expect(beside[part][property], `${part} ${property} at ${scale}`).toBe(defaults[part][property]);
        }
        expect(beside.menu.border).toBe(defaults.menu.border);
        expect(defaults.primary.radius).toBe(`${4 * scale}px`);
        expect(defaults.primary.height).toBe(16 * scale);
      }
    });
  }
});

describe("with a prepared library", () => {
  for (const sheets of SHEETS) for (const scheme of SCHEMES) {
    test(`its corners, fills, accent and type reach ds-button, ds-input and ds-menu (${sheets}, ${scheme})`, async () => {
      const page = pages[`${sheets}-${scheme}`];
      const accent = scheme === "light" ? "rgb(211, 87, 254)" : "rgb(138, 43, 226)";
      for (const scale of [1, 1.5]) {
        const drawn = await draw(page, library, scale);
        for (const part of ["primary", "secondary", "field", "menu"] as const) {
          expect(drawn[part].radius, `${part} corners at ${scale}`).toBe(`${8 * scale}px`);
          expect(drawn[part].font, `${part} type`).toBe("Georgia, serif");
          expect(drawn[part].size, `${part} size at ${scale}`).toBe(`${16 * scale}px`);
        }
        expect(drawn.primary.background).toBe(accent);
        expect(drawn.primary.color).toBe("rgb(255, 255, 255)");
        expect(drawn.secondary.background).toBe("rgb(18, 52, 86)");
        expect(drawn.field.background).toBe("rgb(171, 205, 239)");
        expect(drawn.menu.background).toBe(scheme === "light" ? "rgb(240, 240, 224)" : "rgb(16, 16, 16)");
        expect(drawn.menu.color).toBe(scheme === "light" ? "rgb(48, 16, 16)" : "rgb(240, 240, 240)");
        expect(drawn.menu.border).toBe("rgb(0, 170, 0)");
        // The grid stays DS1's: controls one control high, menu entries one square each.
        expect(drawn.primary.height).toBe(16 * scale);
        expect(drawn.field.height).toBe(16 * scale);
        expect(drawn.entries).toEqual([UNIT * scale, UNIT * scale]);
      }
    });
  }
});

describe("button links", () => {
  const faces = prepareLibrary([
    ":root { --one-radius: 6px; }",
    "button { background: rgb(1, 2, 3); color: rgb(250, 250, 250); border-radius: var(--one-radius); }",
    "button:disabled { opacity: 0.5; }",
    "a { color: rgb(9, 9, 9); text-decoration: underline; }",
    ".note a { color: rgb(7, 7, 7); }",
  ].join("\n")).css;

  test("take the library's button faces and stay links", async () => {
    const page = pages["tokens-light"];
    await page.evaluate((css) => {
      document.getElementById("library")!.textContent = css;
      document.getElementById("stage")!.innerHTML = '<p class="note"><a id="go" href="#go" data-library-button>Go</a> <a id="off" href="#off" data-library-button aria-disabled="true">Off</a> <button id="native">Go</button> <a id="read" href="#read">Read</a></p>';
    }, faces);
    const read = (id: string) => page.evaluate((id) => {
      const style = getComputedStyle(document.getElementById(id)!);
      return { background: style.backgroundColor, color: style.color, radius: style.borderTopLeftRadius, decoration: style.textDecorationLine, opacity: style.opacity };
    }, id);
    const native = await read("native");
    expect(await read("go")).toMatchObject({ background: native.background, color: native.color, radius: "6px", opacity: "1" });
    expect((await read("go")).decoration).toBe("none");
    expect((await read("off")).opacity).toBe("0.5");
    // An ordinary link keeps the link face, including the more specific rule for links in a note.
    expect(await read("read")).toMatchObject({ color: "rgb(7, 7, 7)", decoration: "underline", background: "rgba(0, 0, 0, 0)" });
    // Still a link to assistive technology and the keyboard.
    expect(await page.getByRole("link", { name: "Go" }).count()).toBe(1);
    expect(await page.getByRole("link", { name: "Off" }).count()).toBe(1);
    await page.focus("#go");
    await page.keyboard.press("Enter");
    expect(await page.evaluate(() => location.hash)).toBe("#go");
  });
});
