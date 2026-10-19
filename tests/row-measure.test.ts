// @vitest-environment node
// Real layout and colour: pressable rows, navigation rows and trees are drawn in Chromium, light and
// dark, at a scale of 1 and 1.5, the elements beside the native classes of row.css that they must match.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

const UNIT = 20;
const SCHEMES = ["light", "dark"] as const;
const SCALES = [1, 1.5] as const;
type Scheme = (typeof SCHEMES)[number];
let server: ViteDevServer;
let browser: Browser;
const pages = {} as Record<Scheme, Page>;

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  const url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/row-measure.html`;
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

/** Puts markup on a stage scaled by `sf` and waits for its components to render and paint. */
async function stage(page: Page, markup: string, sf = 1, script?: string) {
  await page.mouse.move(799, 599);
  await page.evaluate(({ markup, sf }) => {
    const stage = document.getElementById("stage")!;
    stage.setAttribute("data-ds-surface", "");
    stage.style.setProperty("--ds-sf", String(sf));
    stage.innerHTML = markup;
  }, { markup, sf });
  if (script) await page.addScriptTag({ content: script });
  await page.evaluate(async () => {
    const stage = document.getElementById("stage")!;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) {
      for (const inner of element.shadowRoot?.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*") ?? []) await inner.updateComplete;
    }
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
  });
}

const box = (page: Page, selector: string) => page.evaluate((selector) => {
  const [host, inner] = selector.split(" >>> ");
  let element: Element | null | undefined = document.querySelector(host!);
  if (inner) element = element?.shadowRoot?.querySelector(inner);
  const rect = element!.getBoundingClientRect();
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}, selector);

const ROWS = `
  <ds-row id="link" href="#atlas"><span>Atlas</span><span>12</span></ds-row>
  <ds-row id="button" interactive><span>Harbor</span></ds-row>
  <a id="native-link" class="ds-row" href="#meadow"><span>Meadow</span></a>
  <button id="native-button" class="ds-row" type="button"><span>Studio</span></button>
  <ul style="margin:0;padding:0;list-style:none"><li id="native-holder" class="ds-row"><a class="ds-row__target" href="#guide">Guide</a><span style="flex:1"></span><button id="native-action" class="ds-button ds-button--icon" type="button">+</button></li></ul>
  <table class="ds-table" style="width:400px"><tbody><tr id="native-tr" class="ds-row"><td><button id="tr-target" class="ds-row__target" type="button">Order 1042</button></td><td id="tr-other">Paid</td><td><a id="tr-link" href="#invoice">Invoice</a></td></tr></tbody></table>
  <ds-row id="tile" interactive stacked style="width:calc(4 * var(--ds-unit))"><span>Cash</span><span>¥1,200</span></ds-row>
  <a id="native-tile" class="ds-row ds-row--stacked" href="#cash" style="width:calc(4 * var(--ds-unit))"><span>Cash</span><span>¥1,200</span></a>`;

test("a pressable row is one square high and a tile whole squares, the element and the native class alike, at every scale", async () => {
  for (const scheme of SCHEMES) {
    for (const sf of SCALES) {
      const page = pages[scheme];
      await stage(page, ROWS, sf);
      const square = UNIT * sf;
      for (const id of ["link", "button", "native-link", "native-button", "native-holder", "native-tr"]) {
        expect((await box(page, `#${id}`)).height, `${id} at ${sf} in ${scheme}`).toBeCloseTo(square, 3);
      }
      for (const id of ["tile", "native-tile"]) {
        const tile = await box(page, `#${id}`);
        expect(tile.width, `${id} width`).toBeCloseTo(4 * square, 3);
        expect(tile.height, `${id} height`).toBeCloseTo(2 * square, 3);
      }
      // The press target covers the row: the link's target spans the row inside its padding.
      const host = await box(page, "#link");
      const target = await box(page, "#link >>> .target");
      expect(target.left - host.left).toBeCloseTo(4 * sf, 3);
      expect(target.height).toBeCloseTo(square, 3);
    }
  }
});

test("a native row's words stand on the sixteen even in a page set on 20px lines, a link or button row too", async () => {
  for (const sf of SCALES) {
    const page = pages.light;
    // A product's page often sets its text on whole-square lines; a native link or button
    // inherits its font, which must not carry that line into the row.
    await stage(page, `<div style="line-height:calc(20px * ${sf})">${ROWS}<div id="native-div" class="ds-row"><span>Plain</span></div></div>`, sf);
    for (const id of ["native-div", "native-link", "native-button"]) {
      const row = await box(page, `#${id}`);
      const words = await box(page, `#${id} > span`);
      expect(words.height, `${id} line at ${sf}`).toBeCloseTo(16 * sf, 3);
      expect(words.top + words.height, `${id} words on the row's foot at ${sf}`).toBeCloseTo(row.top + row.height, 3);
    }
  }
});

test("a press anywhere on the row is the row's, and a control inside presses only itself", async () => {
  for (const sf of SCALES) {
    const page = pages.light;
    await stage(page, ROWS + '<ds-row id="with-end" interactive><span>Atlas</span><span style="flex:1"></span><button id="end" slot="end" type="button">Buy</button></ds-row>', sf);
    await page.evaluate(() => {
      const log: string[] = [];
      (window as unknown as { pressLog: string[] }).pressLog = log;
      document.addEventListener("ds-row-press", (event) => log.push(`row:${(event.target as Element).id}`), true);
      document.addEventListener("click", (event) => {
        const target = event.target as Element;
        if (target.closest("a")) event.preventDefault();
        log.push(`click:${target.id || target.className}`);
      }, true);
    });
    const centre = async (selector: string, at = 0.5) => { const b = await box(page, selector); return { x: b.left + b.width * at, y: b.top + b.height / 2 }; };
    const pressAt = async ({ x, y }: { x: number; y: number }) => {
      await page.evaluate(() => { (window as unknown as { pressLog: string[] }).pressLog.length = 0; });
      await page.mouse.click(x, y);
      return page.evaluate(() => [...(window as unknown as { pressLog: string[] }).pressLog]);
    };
    // Lit: the row's empty middle presses the row; the end control presses itself.
    expect(await pressAt(await centre("#with-end", 0.6))).toContain("row:with-end");
    expect(await pressAt(await centre("#end"))).toEqual(["click:end"]);
    // Native: another cell's words press the row's target; the link and the action in the row press themselves.
    expect(await pressAt(await centre("#tr-other"))).toEqual(["click:tr-target"]);
    expect(await pressAt(await centre("#tr-link"))).toEqual(["click:tr-link"]);
    expect(await pressAt(await centre("#native-holder", 0.6))).toEqual(["click:ds-row__target"]);
    expect(await pressAt(await centre("#native-action"))).toEqual(["click:native-action"]);
  }
});

const background = (page: Page, selector: string, pseudo?: string) => page.evaluate(({ selector, pseudo }) => {
  const [host, inner] = selector.split(" >>> ");
  let element: Element | null | undefined = document.querySelector(host!);
  if (inner) element = element?.shadowRoot?.querySelector(inner);
  return getComputedStyle(element!, pseudo ?? null).backgroundColor;
}, { selector, pseudo });

const TREES = `
  <ds-sidebar id="sidebar" label="Library"></ds-sidebar>
  <ds-row id="current" href="#atlas" current nav><span>Atlas</span></ds-row>
  <a id="native-current" class="ds-row ds-row--nav" href="#atlas" aria-current="page">Atlas</a>
  <ds-sidebar tree id="tree" label="Files"></ds-sidebar>
  <ul id="native-tree" class="ds-sidebar" role="tree" aria-label="Files">
    <li class="ds-sidebar__item" role="treeitem" aria-level="1" aria-expanded="true" data-id="src"><span class="ds-sidebar__disclosure" aria-hidden="true"></span><span class="ds-sidebar__label">src</span></li>
    <li class="ds-sidebar__item" role="treeitem" aria-level="2" aria-expanded="true" data-id="lib"><span class="ds-sidebar__disclosure" aria-hidden="true"></span><span class="ds-sidebar__label">lib</span></li>
    <li class="ds-sidebar__item" role="treeitem" aria-level="3" data-id="deep" aria-selected="true"><span class="ds-sidebar__disclosure" aria-hidden="true"></span><span class="ds-sidebar__label">deep.ts</span></li>
  </ul>`;
const TREE_SCRIPT = `
  document.getElementById('sidebar').items = [{ id: 'atlas', label: 'Atlas', current: true }, { id: 'harbor', label: 'Harbor' }];
  document.getElementById('tree').items = [
    { id: 'src', label: 'src', expanded: true },
    { id: 'lib', label: 'lib', depth: 1, expanded: true },
    { id: 'deep', label: 'deep.ts', depth: 2, selected: true },
  ];
  window.connectSidebar(document.getElementById('native-tree'));`;

test("the current destination and a selected tree row are drawn as the sidebar's current row, in light and dark", async () => {
  const fills = {} as Record<Scheme, string>;
  for (const scheme of SCHEMES) {
    const page = pages[scheme];
    await stage(page, TREES, 1, TREE_SCRIPT);
    const sidebar = await background(page, "#sidebar >>> .row[data-current]");
    expect(sidebar).not.toBe("rgba(0, 0, 0, 0)");
    expect(await background(page, "#current >>> .target", "::after")).toBe(sidebar);
    expect(await background(page, "#native-current", "::after")).toBe(sidebar);
    expect(await background(page, '#tree >>> [data-item="deep"]')).toBe(sidebar);
    expect(await background(page, '#native-tree [data-id="deep"]')).toBe(sidebar);
    const weight = await page.evaluate(() => [
      getComputedStyle(document.querySelector("#current")!.shadowRoot!.querySelector(".target")!).fontWeight,
      getComputedStyle(document.querySelector("#native-current")!).fontWeight,
      getComputedStyle(document.querySelector("#tree")!.shadowRoot!.querySelector('[data-item="deep"]')!).fontWeight,
    ]);
    expect(weight).toEqual(["500", "500", "500"]);
    // The navigation row's corners are the sidebar's two pixels.
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("#current")!.shadowRoot!.querySelector(".target")!, "::after").borderRadius)).toBe("2px");
    expect(await page.evaluate(() => getComputedStyle(document.querySelector("#native-current")!).borderRadius)).toBe("2px");
    fills[scheme] = sidebar;
  }
  expect(fills.light).not.toBe(fills.dark);
});

test("the pointer's layer is exactly the row's square, four pixels past its content at each side, on the grid (Joachim, 19 October 2026)", async () => {
  for (const sf of SCALES) {
    const page = pages.light;
    await stage(page, ROWS + '<a id="native-flush" class="ds-row" href="#flush" style="--ds-row-padding: 0px"><span>Flush</span></a>', sf);
    const layer = (selector: string) => page.evaluate((selector) => {
      const [host, inner] = selector.split(" >>> ");
      let element: Element | null | undefined = document.querySelector(host!);
      if (inner) element = element?.shadowRoot?.querySelector(inner);
      const style = getComputedStyle(element!, "::after");
      return [style.top, style.bottom, style.left, style.right, style.borderTopLeftRadius].map(parseFloat);
    }, selector);
    // The row's own square, top to foot: never into the next row; padded 4px, it fills the row's edges.
    for (const id of ["#native-button", "#native-link", "#button >>> .target"])
      expect(await layer(id), `${id} at ${sf}`).toEqual([0, 0, 0, 0, 4 * sf]);
    // Words on the column's edge (no padding): the layer reaches four past the row's edges.
    expect((await layer("#native-flush")).slice(0, 4)).toEqual([0, 0, -4 * sf, -4 * sf]);
    // A tile is filled whole.
    expect((await layer("#native-tile")).slice(0, 4)).toEqual([0, 0, 0, 0]);
  }
});

test("the pointer and the press fill the row, and keyboard focus rings it inside its box", async () => {
  for (const scheme of SCHEMES) {
    const page = pages[scheme];
    await stage(page, `<button id="before" type="button">Before</button>` + ROWS, 1);
    const paper = await background(page, "#link >>> .target", "::after");
    const link = await box(page, "#link");
    await page.mouse.move(link.left + link.width / 2, link.top + link.height / 2);
    const hover = await background(page, "#link >>> .target", "::after");
    expect(hover).not.toBe(paper);
    const native = await box(page, "#native-link");
    await page.mouse.move(native.left + native.width / 2, native.top + native.height / 2);
    expect(await background(page, "#native-link", "::after")).toBe(hover);
    await page.mouse.down();
    const press = await background(page, "#native-link", "::after");
    expect(press).not.toBe(hover);
    await page.mouse.up();
    await page.mouse.move(799, 599);
    await page.focus("#before");
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const style = getComputedStyle(document.querySelector("#link")!.shadowRoot!.querySelector(".target")!, "::after");
      return [style.outlineStyle, style.outlineWidth, style.outlineOffset];
    });
    expect(ring).toEqual(["solid", "2px", "-2px"]);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("native-link");
    expect(await page.evaluate(() => { const s = getComputedStyle(document.activeElement!, "::after"); return [s.outlineStyle, s.outlineOffset]; })).toEqual(["solid", "-2px"]);
  }
});

test("a tree's levels stand a whole square apart, its arrow and icon each on a square, the element and the native class alike", async () => {
  for (const scheme of SCHEMES) {
    for (const sf of SCALES) {
      const page = pages[scheme];
      await stage(page, TREES, sf, TREE_SCRIPT);
      const square = UNIT * sf;
      const measure = (rows: string) => page.evaluate((rows) => {
        const [host, inner] = rows.split(" >>> ");
        const root = inner ? document.querySelector(host!)!.shadowRoot! : document;
        const tree = (inner ? document.querySelector(host!)! : document.querySelector(host!)!).getBoundingClientRect();
        return [...root.querySelectorAll<HTMLElement>(inner ?? `${host} [role="treeitem"]`)].map((row) => {
          const disclosure = row.querySelector<HTMLElement>(".disclosure, .ds-sidebar__disclosure")!.getBoundingClientRect();
          const label = row.querySelector<HTMLElement>(".label, .ds-sidebar__label")!.getBoundingClientRect();
          return { height: row.getBoundingClientRect().height, arrow: disclosure.left - tree.left, arrowWidth: disclosure.width, label: label.left - tree.left };
        });
      }, rows);
      for (const rows of ['#tree >>> [role="treeitem"]', "#native-tree"]) {
        const measured = await measure(rows);
        expect(measured.length, rows).toBe(3);
        measured.forEach((row, depth) => {
          expect(row.height, `${rows} row ${depth} at ${sf}`).toBeCloseTo(square, 3);
          expect(row.arrow, `${rows} arrow ${depth} at ${sf}`).toBeCloseTo(depth * square, 3);
          expect(row.arrowWidth).toBeCloseTo(square, 3);
          // The label stands one square and the words' 4px in, so a child's arrow stands under its parent's label.
          expect(row.label).toBeCloseTo((depth + 1) * square, 3);
        });
      }
      // The arrow turns down on an open row; a leaf keeps its square empty.
      const turns = await page.evaluate(() => [...document.querySelectorAll("#native-tree .ds-sidebar__disclosure")].map((arrow) => getComputedStyle(arrow).transform));
      expect(turns.slice(0, 2)).toEqual([expect.stringMatching(/^matrix\(/), expect.stringMatching(/^matrix\(/)]);
      expect(turns[0]).not.toBe("matrix(1, 0, 0, 1, 0, 0)");
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('#native-tree [data-id="deep"] .ds-sidebar__disclosure')!).visibility)).toBe("hidden");
    }
  }
});

test("a native tree takes the keyboard from connectSidebar", async () => {
  const page = pages.light;
  await stage(page, TREES, 1, TREE_SCRIPT);
  await page.focus('#native-tree [data-id="deep"]');
  await page.keyboard.press("Home");
  expect(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.id)).toBe("src");
  await page.keyboard.press("ArrowLeft");
  expect(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("#native-tree li")].map((li) => li.hidden))).toEqual([false, true, true]);
  await page.keyboard.press("ArrowRight");
  expect(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("#native-tree li")].map((li) => li.hidden))).toEqual([false, false, false]);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Space");
  expect(await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("#native-tree li")].map((li) => [li.tabIndex, li.getAttribute("aria-selected")]))).toEqual([[-1, null], [-1, null], [0, "true"]]);
});

for (const scheme of SCHEMES) for (const sf of SCALES) {
  test(`open detail rows retain their fill and geometry, then clear (${scheme}, ${sf})`, async () => {
    const page = pages[scheme];
    await stage(page, `<ds-row id="detail" interactive open><span>Record</span></ds-row>
      <button id="native-detail" class="ds-row" data-open aria-expanded="true">Record</button>
      <div id="swipe-detail" class="ds-row" data-open style="background: var(--ds-background)">Record</div>
      <table class="ds-table" data-sticky><tbody><tr data-open><th scope="row">Record</th><td>12</td></tr></tbody></table>`, sf);
    const states = await page.evaluate(() => {
      const el = document.querySelector("ds-row")!;
      const targets = [el.shadowRoot!.querySelector(".target")!, document.querySelector("#native-detail")!, document.querySelector("#swipe-detail")!];
      return targets.map(t => ({ fill: getComputedStyle(t, "::after").backgroundColor, height: t.getBoundingClientRect().height }));
    });
    expect(states[0]!.fill).not.toBe("rgba(0, 0, 0, 0)");
    expect(new Set(states.map(s => s.fill)).size).toBe(1);
    for (const s of states) expect(s.height).toBeCloseTo(20 * sf, 1);
    const cells = await page.locator("tbody th, tbody td").evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
    expect(cells).toEqual([states[0]!.fill, states[0]!.fill]);
    await page.evaluate(async () => {
      const el = document.querySelector("ds-row")! as HTMLElement & { open: boolean; updateComplete: Promise<unknown> };
      el.open = false;
      document.querySelectorAll("[data-open]").forEach(e => e.removeAttribute("data-open"));
      await el.updateComplete;
    });
    expect(await page.locator("#native-detail").evaluate(el => getComputedStyle(el, "::after").backgroundColor)).toBe("rgba(0, 0, 0, 0)");
    expect(await page.locator("ds-row").evaluate(el => getComputedStyle(el.shadowRoot!.querySelector(".target")!, "::after").backgroundColor)).toBe("rgba(0, 0, 0, 0)");
  });
}
