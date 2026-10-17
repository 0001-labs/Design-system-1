// @vitest-environment node
// Real layout and colour: stats, meters and steps drawn in Chromium, light and dark, at the
// computer's scale and at 1.5, beside the native classes of figures.css that they must match.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

const SCHEMES = ["light", "dark"] as const;
const SCALES = [1, 1.5] as const;
type Scheme = (typeof SCHEMES)[number];
const DANGER: Record<Scheme, string> = { light: "rgb(222, 3, 49)", dark: "rgb(255, 95, 95)" };
const INK: Record<Scheme, string> = { light: "rgb(42, 42, 42)", dark: "rgb(255, 255, 255)" };
let server: ViteDevServer;
let browser: Browser;
const pages = {} as Record<Scheme, Page>;

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  const url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/figures-measure.html`;
  for (const scheme of SCHEMES) {
    const page = await browser.newPage({ viewport: { width: 900, height: 700 }, colorScheme: scheme });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    pages[scheme] = page;
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

/** Puts markup on a surface at a scale and waits for its components to render, measure and paint. */
async function stage(page: Page, scale: number, markup: string) {
  await page.evaluate(async ({ scale, markup }) => {
    const stage = document.getElementById("stage")!;
    stage.innerHTML = `<div id="surface" data-ds-surface style="--ds-sf: ${scale}">${markup}</div>`;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    await document.fonts.ready;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
  }, { scale, markup });
}

/** Every combination of scheme and scale, with the square at that scale. */
const each = SCHEMES.flatMap(scheme => SCALES.map(scale => ({ scheme, scale, unit: 20 * scale })));

test("a stat is a label on one square, its figure on two and its caption on one, as the native class draws it", async () => {
  for (const { scheme, scale, unit } of each) {
    const page = pages[scheme];
    await stage(page, scale, `
      <ds-stat label="Revenue" value="1234.5" format="money" currency="EUR" change="0.12" change-format="percent" caption="Since last month" icon="dot-coins" literal></ds-stat>
      <div class="ds-stat"><p class="ds-stat__label">Revenue</p><p class="ds-stat__figure">€1,234.50</p><p class="ds-stat__caption"><span class="ds-stat__change">+12%</span>Since last month</p></div>
      <ds-stat label="Over budget" value="18200" format="money" currency="JPY" tone="danger" literal></ds-stat>`);
    const [element, native, danger] = await page.evaluate(() => [...document.getElementById("surface")!.children].map(host => {
      const root = host.shadowRoot ?? host;
      const top = host.getBoundingClientRect().top;
      const box = (selector: string) => { const r = root.querySelector(selector)?.getBoundingClientRect(); return r ? { top: r.top - top, height: r.height } : null; };
      const figure = root.querySelector(".ds-stat__figure")!;
      const style = getComputedStyle(figure);
      return { height: host.getBoundingClientRect().height, label: box(".ds-stat__label"), figure: box(".ds-stat__figure"), caption: box(".ds-stat__caption"),
        icon: root.querySelector(".ds-stat__icon")?.getBoundingClientRect().width ?? null, numerals: style.fontVariantNumeric, color: style.color, size: parseFloat(style.fontSize) };
    }));
    for (const stat of [element!, native!]) {
      expect(stat.height, `${scheme} ${scale}`).toBe(4 * unit);
      expect(stat.label).toEqual({ top: 0, height: unit });
      expect(stat.figure).toEqual({ top: unit, height: 2 * unit });
      expect(stat.caption).toEqual({ top: 3 * unit, height: unit });
      expect(stat.numerals).toBe("tabular-nums");
      expect(stat.size).toBe(20 * scale);
      expect(stat.color).toBe(INK[scheme]);
    }
    expect(element!.icon).toBe(unit);
    // Without a change or caption there is no caption line.
    expect(danger!.height).toBe(3 * unit);
    expect(danger!.color).toBe(DANGER[scheme]);
  }
});

test("a group of stats stands on whole squares: columns eight squares wide with one square between them", async () => {
  for (const { scheme, scale, unit } of each) {
    const page = pages[scheme];
    const stat = '<ds-stat label="Users" value="12840" caption="This month" literal></ds-stat>';
    await stage(page, scale, `<div class="ds-stats">${stat.repeat(5)}</div>`);
    const boxes = await page.evaluate(() => {
      const group = document.querySelector(".ds-stats")!.getBoundingClientRect();
      return [...document.querySelectorAll("ds-stat")].map(stat => { const r = stat.getBoundingClientRect(); return { left: r.left - group.left, top: r.top - group.top, width: r.width, height: r.height }; });
    });
    const columns = Math.floor((800 + unit) / (9 * unit));
    boxes.forEach((box, index) => {
      expect(box.width, `${scheme} ${scale}`).toBe(8 * unit);
      expect(box.left).toBe((index % columns) * 9 * unit);
      expect(box.top).toBe(Math.floor(index / columns) * 5 * unit);
      expect(box.height).toBe(4 * unit);
    });
  }
  // Narrower than a column, the group is one column as wide as it is.
  await stage(pages.light, 1, '<div class="ds-stats" style="width: 120px"><ds-stat label="Users" value="1" literal></ds-stat><ds-stat label="Sites" value="2" literal></ds-stat></div>');
  const narrow = await pages.light.evaluate(() => [...document.querySelectorAll("ds-stat")].map(stat => stat.getBoundingClientRect().width));
  expect(narrow).toEqual([120, 120]);
});

test("a stat's digits in cells are all one width", async () => {
  await stage(pages.light, 1, '<ds-stat value="1118" cells literal></ds-stat>');
  const widths = await pages.light.evaluate(() => [...document.querySelector("ds-stat")!.shadowRoot!.querySelectorAll(".ds-stat__digit")].map(cell => cell.getBoundingClientRect().width));
  expect(widths).toHaveLength(4);
  expect(new Set(widths).size).toBe(1);
});

test("a meter is one square high with a bar half a square high across its middle, filled to its value", async () => {
  for (const { scheme, scale, unit } of each) {
    const page = pages[scheme];
    await stage(page, scale, `
      <ds-meter value="0.25" style="width: ${8 * unit}px"></ds-meter>
      <div class="ds-meter" role="meter" aria-valuenow="0.25" aria-valuemin="0" aria-valuemax="1" style="--ds-meter-value: 0.25; width: ${8 * unit}px"><span class="ds-meter__fill"></span></div>
      <ds-meter value="12" max="10" style="width: ${8 * unit}px"></ds-meter>`);
    const meters = await page.evaluate(() => [...document.getElementById("surface")!.children].map(host => {
      const root = host.shadowRoot ?? host;
      const r = host.getBoundingClientRect();
      const fill = root.querySelector(".ds-meter__fill")!;
      const f = fill.getBoundingClientRect();
      const track = getComputedStyle(host.shadowRoot ? root.querySelector(".ds-meter")! : host, "::before");
      return { height: r.height, width: f.width, left: f.left - r.left, top: f.top - r.top, barHeight: f.height, color: getComputedStyle(fill).backgroundColor, trackTop: parseFloat(track.top), trackHeight: parseFloat(track.height) };
    }));
    for (const meter of meters.slice(0, 2)) {
      expect(meter.height, `${scheme} ${scale}`).toBe(unit);
      expect(meter).toMatchObject({ width: 2 * unit, left: 0, top: unit / 4, barHeight: unit / 2, trackTop: unit / 4, trackHeight: unit / 2, color: INK[scheme] });
    }
    expect(meters[2]).toMatchObject({ width: 8 * unit, color: DANGER[scheme] });
  }
});

test("a meter in squares draws one square per step of its range, each on the grid with its line", async () => {
  for (const { scheme, scale, unit } of each) {
    const page = pages[scheme];
    await stage(page, scale, `
      <ds-meter value="7" max="10" squares="10"></ds-meter>
      <div class="ds-meter ds-meter--squares" role="meter" aria-valuenow="2" aria-valuemin="0" aria-valuemax="3"><span class="ds-meter__square ds-meter__square--on"></span><span class="ds-meter__square ds-meter__square--on"></span><span class="ds-meter__square"></span></div>
      <ds-meter value="4" max="3" squares="3"></ds-meter>`);
    const meters = await page.evaluate(() => [...document.getElementById("surface")!.children].map(host => {
      const root = host.shadowRoot ?? host;
      const r = host.getBoundingClientRect();
      return { height: r.height, squares: [...root.querySelectorAll(".ds-meter__square")].map(square => {
        const s = square.getBoundingClientRect();
        return { left: s.left - r.left, top: s.top - r.top, width: s.width, height: s.height, color: getComputedStyle(square).backgroundColor };
      }) };
    }));
    for (const meter of meters) {
      expect(meter.height, `${scheme} ${scale}`).toBe(unit);
      meter.squares.forEach((square, index) => expect(square).toMatchObject({ left: index * unit, top: 0, width: unit - 1, height: unit - 1 }));
    }
    expect(meters[0]!.squares.filter(square => square.color === INK[scheme])).toHaveLength(7);
    expect(meters[1]!.squares.map(square => square.color === INK[scheme])).toEqual([true, true, false]);
    expect(meters[2]!.squares.every(square => square.color === DANGER[scheme])).toBe(true);
  }
});

test("steps stand one square high, each step on whole squares with its mark one control high in its square", async () => {
  for (const { scheme, scale, unit } of each) {
    const page = pages[scheme];
    await stage(page, scale, `
      <ds-steps current="2" steps='["Apply", "Approval", "Connect payouts", "Start earning"]' literal></ds-steps>
      <ol class="ds-steps"><li class="ds-steps__step ds-steps__step--done"><span class="ds-steps__mark">1</span><span class="ds-steps__label">Apply</span></li><li class="ds-steps__step ds-steps__step--current" aria-current="step"><span class="ds-steps__mark">2</span><span class="ds-steps__label">Approval</span></li><li class="ds-steps__step"><span class="ds-steps__mark">3</span><span class="ds-steps__label">Connect payouts</span></li><li class="ds-steps__step"><span class="ds-steps__mark">4</span><span class="ds-steps__label">Start earning</span></li></ol>`);
    const [element, native] = await page.evaluate(() => [...document.getElementById("surface")!.children].map(host => {
      const root = host.shadowRoot ?? host;
      const list = (host.shadowRoot ? root.querySelector("ol")! : host).getBoundingClientRect();
      return { height: list.height, steps: [...root.querySelectorAll("li")].map(step => {
        const s = step.getBoundingClientRect();
        const mark = step.querySelector(".ds-steps__mark")!;
        const m = mark.getBoundingClientRect();
        const label = getComputedStyle(step.querySelector(".ds-steps__label")!);
        return { left: s.left - list.left, top: s.top - list.top, width: s.width, height: s.height, markLeft: m.left - s.left, markTop: m.top - s.top, mark: m.width, markHeight: m.height,
          markColor: getComputedStyle(mark).backgroundColor, labelFamily: label.fontFamily, labelColor: label.color };
      }) };
    }));
    for (const steps of [element!, native!]) {
      expect(steps.height, `${scheme} ${scale}`).toBe(unit);
      for (const step of steps.steps) {
        expect(step.height).toBe(unit);
        expect(step.top).toBe(0);
        expect(step.width % unit, `${step.width} on whole squares`).toBe(0);
        expect(step.left % unit).toBe(0);
        expect(step).toMatchObject({ mark: 16 * scale, markHeight: 16 * scale, markLeft: 2 * scale, markTop: 2 * scale });
      }
      expect(steps.steps[1]!.markColor).toBe(INK[scheme]);
      expect(steps.steps[1]!.labelFamily).toContain("GT-America-Standard-Medium");
      expect(steps.steps[2]!.labelFamily).not.toContain("Medium");
      expect(steps.steps[2]!.markColor).toBe("rgba(0, 0, 0, 0)");
    }
    expect(element!.steps.map(step => step.width)).toEqual(native!.steps.map(step => step.width));
  }
});

test("a failed step is in the danger colour, and a vertical sequence puts a step on each square with its body under it", async () => {
  for (const { scheme, scale, unit } of each) {
    const page = pages[scheme];
    await stage(page, scale, `<ds-steps vertical current="3" literal steps='["Apply", {"label": "Approval", "state": "failed"}, "Connect payouts", "Start earning"]'><ds-text slot="step-3" literal tone="muted">Connect an account to get paid.</ds-text></ds-steps>`);
    const layout = await page.evaluate(() => {
      const root = document.querySelector("ds-steps")!.shadowRoot!;
      const list = root.querySelector("ol")!.getBoundingClientRect();
      const failed = root.querySelectorAll("li")[1]!;
      const body = document.querySelector('ds-steps [slot="step-3"]')!.getBoundingClientRect();
      return { height: list.height, tops: [...root.querySelectorAll("li")].map(step => step.getBoundingClientRect().top - list.top),
        failedMark: getComputedStyle(failed.querySelector(".ds-steps__mark")!).backgroundColor, failedLabel: getComputedStyle(failed.querySelector(".ds-steps__label")!).color,
        body: { left: body.left - list.left, top: body.top - list.top, height: body.height } };
    });
    expect(layout.tops, `${scheme} ${scale}`).toEqual([0, unit, 2 * unit, 4 * unit]);
    expect(layout.height).toBe(5 * unit);
    expect(layout.body).toEqual({ left: unit, top: 3 * unit, height: unit });
    expect(layout.failedMark).toBe(DANGER[scheme]);
    expect(layout.failedLabel).toBe(DANGER[scheme]);
  }
});
