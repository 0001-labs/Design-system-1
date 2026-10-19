// @vitest-environment node
// Real layout and colour, in Chromium: a Select's list and a Context's rows stand on the sixteen,
// on whole squares, and Context's gap face shows the page between its rows, in light and dark.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

const UNIT = 20;
let server: ViteDevServer;
let browser: Browser;
let url = "";

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/menu-measure.html`;
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

async function page(scheme: "light" | "dark" = "light") {
  const tab = await browser.newPage({ viewport: { width: 800, height: 600 }, colorScheme: scheme });
  await tab.goto(url);
  await tab.waitForFunction(() => document.documentElement.dataset.ready === "true");
  return tab;
}
const frames = (tab: Page) => tab.evaluate(async () => { for (let i = 0; i < 4; i++) await new Promise(requestAnimationFrame); });

test("a field's list: one square a choice, words and marks on the sixteen, the chosen one checked, whole squares from the field", async () => {
  const tab = await page();
  await tab.evaluate(() => {
    document.getElementById("stage")!.innerHTML = '<ds-select><select aria-label="Size"><option>Small</option><option selected data-details="Most chosen">Medium</option><optgroup label="Print"><option data-icon="file">A4</option></optgroup></select></ds-select>';
  });
  await frames(tab);
  await tab.click("ds-select");
  await frames(tab);
  const box = await tab.evaluate(() => {
    const host = document.querySelector("ds-select")!;
    const list = host.shadowRoot!.querySelector<HTMLElement>(".list")!;
    const field = host.getBoundingClientRect(), menu = list.getBoundingClientRect();
    const choices = [...list.querySelectorAll<HTMLElement>(".choice, .group-label")].map(row => {
      const r = row.getBoundingClientRect();
      // A choice's name, or a group label's own line box (its padding-free 16px line at the row's foot).
      const named = row.querySelector(".name");
      const style = getComputedStyle(row);
      const name = named ? named.getBoundingClientRect() : { bottom: r.bottom, height: parseFloat(style.lineHeight) };
      const mark = row.querySelector(".mark, ds-icon")?.getBoundingClientRect();
      const check = row.querySelector<HTMLElement>(".check");
      return { top: r.top, height: r.height, nameBottom: name.bottom - r.top, nameHeight: name.height, markBottom: mark ? mark.bottom - r.top : null, checked: check ? getComputedStyle(check).visibility : null };
    });
    return { open: (list as HTMLElement & { open: boolean }).open, field: { bottom: field.bottom, width: field.width }, menu: { top: menu.top, width: menu.width, height: menu.height }, choices, focused: (list.querySelector(":focus") as HTMLElement | null)?.dataset.textValue ?? null };
  });
  expect(box.open).toBe(true);
  // Half a square below the field, as wide as it in whole squares.
  expect(box.menu.top - box.field.bottom).toBeCloseTo(UNIT / 2, 0);
  expect(box.menu.width % UNIT).toBe(0);
  expect(box.menu.width).toBeGreaterThanOrEqual(box.field.width);
  expect(box.menu.height % UNIT).toBe(0);
  for (const choice of box.choices) {
    expect(choice.height).toBeCloseTo(UNIT, 3);
    expect(choice.nameHeight).toBeCloseTo(16, 3);
    expect(choice.nameBottom).toBeCloseTo(UNIT, 3);
    if (choice.markBottom !== null) expect(choice.markBottom).toBeCloseTo(UNIT, 3);
  }
  expect(box.choices.map(choice => choice.checked)).toEqual(["hidden", "visible", null, "hidden"]);
  expect(box.focused).toBe("Medium");
  await tab.close();
});

for (const scheme of ["light", "dark"] as const) {
  test(`Context's gap face in ${scheme}: rows a pixel apart and groups two, the page showing through, words on the sixteen, the fill turned over`, async () => {
    const tab = await page(scheme);
    await tab.evaluate(() => {
      document.getElementById("stage")!.innerHTML = '<div id="area" style="width:200px;height:200px">Area</div><ds-context for="area"><button role="menuitem">Rename</button><button role="menuitem">Duplicate</button><hr data-ds-menu-separator><button role="menuitem" data-danger>Delete</button></ds-context>';
    });
    await frames(tab);
    await tab.click("#area", { button: "right", position: { x: 30, y: 30 } });
    await frames(tab);
    const box = await tab.evaluate(() => {
      const menu = document.querySelector("ds-context")!;
      const rows = [...menu.querySelectorAll<HTMLElement>("button")].map(row => {
        const r = row.getBoundingClientRect(), style = getComputedStyle(row);
        return { top: r.top, bottom: r.bottom, height: r.height, background: style.backgroundColor, color: style.color, line: style.lineHeight, display: style.display, align: style.alignItems };
      });
      const probe = document.createElement("span"); document.body.append(probe);
      const rgb = (value: string) => { probe.style.color = value; return getComputedStyle(probe).color; };
      const colours = { text: rgb("var(--ds-text-color)"), paper: rgb("var(--ds-paper)"), red: rgb(document.documentElement.matches("[data-theme=dark], .dark-theme") || matchMedia("(prefers-color-scheme: dark)").matches ? "var(--ds-red-for-blood)" : "var(--ds-tuned-red)") };
      probe.remove();
      const frame = menu.shadowRoot!.querySelector<HTMLElement>(".frame")!;
      return { open: (menu as HTMLElement & { open: boolean }).open, at: menu.getBoundingClientRect(), rows, colours, clip: getComputedStyle(frame).clipPath };
    });
    expect(box.open).toBe(true);
    expect(box.rows.map(row => row.height)).toEqual([19, 19, 19]);
    expect(box.rows[1]!.top - box.rows[0]!.bottom).toBe(1);
    expect(box.rows[2]!.top - box.rows[1]!.bottom).toBe(2);
    // Words on a 16px line at the row's foot: the sixteen of each square.
    for (const row of box.rows) {
      expect(row.line).toBe("16px");
      expect(row.display).toBe("flex");
      expect(row.align).toBe("flex-end");
    }
    // The ink is the fill, the paper's colour the words; turned over in dark. (The first row is
    // under the pointer that opened the menu, so it shows the hover.)
    expect(box.rows[1]!.background).toBe(box.colours.text);
    expect(box.rows[1]!.color).not.toBe(box.colours.text);
    expect(box.rows[0]!.background).not.toBe(box.rows[1]!.background);
    expect(box.rows[2]!.color).toBe(box.colours.red);
    expect(box.clip).toContain("inset");
    await tab.close();
  });
}

test("a Context row hovered lightens, and the keyboard's focus rings it", async () => {
  const tab = await page();
  await tab.evaluate(() => {
    document.getElementById("stage")!.innerHTML = '<div id="area" tabindex="0" style="width:200px;height:200px">Area</div><ds-context for="area"><button role="menuitem">Rename</button><button role="menuitem">Duplicate</button></ds-context>';
  });
  await frames(tab);
  await tab.focus("#area");
  await tab.keyboard.press("Shift+F10");
  await frames(tab);
  const states = await tab.evaluate(() => {
    const [first, second] = document.querySelectorAll<HTMLElement>("ds-context button");
    return { focused: document.activeElement === first, ring: getComputedStyle(first!).boxShadow, resting: getComputedStyle(second!).backgroundColor, active: getComputedStyle(first!).backgroundColor };
  });
  expect(states.focused).toBe(true);
  expect(states.ring).toContain("inset");
  expect(states.active).not.toBe(states.resting);
  await tab.close();
});

test("a menu from a button fits its words on whole squares, at least as wide as its button", async () => {
  const tab = await page();
  await tab.evaluate(() => {
    document.getElementById("stage")!.innerHTML = '<button id="filter" type="button" style="width:20px;height:20px">F</button><ds-select for="filter" aria-label="Filter"><ds-button menu-item role="menuitemradio" aria-checked="true">All accounts and their cash</ds-button><ds-button menu-item role="menuitemradio">Wise</ds-button></ds-select>';
  });
  await frames(tab);
  await tab.click("#filter");
  await frames(tab);
  const box = await tab.evaluate(() => {
    const menu = document.querySelector("ds-select")!;
    const row = menu.querySelector("ds-button")!;
    const words = row.shadowRoot?.querySelector("button")?.scrollWidth ?? 0;
    return { open: (menu as HTMLElement & { open: boolean }).open, width: menu.getBoundingClientRect().width, words, clipped: (row.shadowRoot?.querySelector("button")?.scrollWidth ?? 0) > (row.shadowRoot?.querySelector("button")?.clientWidth ?? 0) };
  });
  expect(box.open).toBe(true);
  expect(box.width % UNIT).toBe(0);
  expect(box.width).toBeGreaterThan(4 * UNIT);
  expect(box.clipped).toBe(false);
  await tab.close();
});

for (const scheme of ["light", "dark"] as const) {
  test(`the native .ds-context in ${scheme}: the element's gap face on native buttons, groups as gaps, empty groups quiet`, async () => {
    const tab = await page(scheme);
    await tab.evaluate(() => {
      document.getElementById("stage")!.innerHTML = '<div class="ds-context" role="menu" aria-label="Track"><hr><span class="ds-context__label">Track</span><button role="menuitem">Rename<span class="ds-context__shortcut">⌘R</span></button><button role="menuitem">Duplicate</button><hr><hr><button role="menuitem" class="ds-context__item--danger">Delete</button><hr></div>';
    });
    await frames(tab);
    const box = await tab.evaluate(() => {
      const menu = document.querySelector<HTMLElement>(".ds-context")!;
      const rows = [...menu.querySelectorAll<HTMLElement>(".ds-context__label, button")].map(row => {
        const r = row.getBoundingClientRect(), style = getComputedStyle(row);
        return { top: r.top, bottom: r.bottom, height: r.height, background: style.backgroundColor, color: style.color, line: style.lineHeight, align: style.alignItems };
      });
      const quiet = [...menu.querySelectorAll("hr")].map(hr => getComputedStyle(hr).display);
      const probe = document.createElement("span"); document.body.append(probe);
      const rgb = (value: string) => { probe.style.color = value; return getComputedStyle(probe).color; };
      const colours = { text: rgb("var(--ds-text-color)"), red: rgb(matchMedia("(prefers-color-scheme: dark)").matches ? "var(--ds-red-for-blood)" : "var(--ds-tuned-red)") };
      probe.remove();
      return { rows, quiet, colours, clip: getComputedStyle(menu).clipPath, width: menu.getBoundingClientRect().width };
    });
    expect(box.rows.map(row => row.height)).toEqual([19, 19, 19, 19]);
    expect(box.rows[1]!.top - box.rows[0]!.bottom).toBe(1);
    expect(box.rows[2]!.top - box.rows[1]!.bottom).toBe(1);
    // One group gap where two separators stood, none first or last.
    expect(box.rows[3]!.top - box.rows[2]!.bottom).toBe(2);
    expect(box.quiet).toEqual(["none", "block", "none", "none"]);
    for (const row of box.rows.slice(1)) { expect(row.line).toBe("16px"); expect(row.align).toBe("flex-end"); }
    expect(box.rows[1]!.background).toBe(box.colours.text);
    expect(box.rows[1]!.color).not.toBe(box.colours.text);
    expect(box.rows[3]!.color).toBe(box.colours.red);
    expect(box.clip).toContain("inset");
    expect(box.width).toBeGreaterThanOrEqual(4 * UNIT);
    await tab.close();
  });
}
