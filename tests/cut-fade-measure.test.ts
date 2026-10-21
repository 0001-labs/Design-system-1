// @vitest-environment node
// Real layout, in Chromium: words DS1 cuts fade over their last square and never end in "…"; words
// that fit stay crisp. A literal ds-text, a row's ds-text name (the one a list of people showed as
// "PATRIKSSON GRO…"), a tag and a page's native classes, left to right and right to left.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

let server: ViteDevServer;
let browser: Browser;
let url = "";

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/cut-fade-measure.html`;
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

async function measure(dir: "ltr" | "rtl") {
  const tab = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await tab.goto(url);
  await tab.waitForFunction(() => document.documentElement.dataset.ready === "true");
  const result = await tab.evaluate(async dir => {
    document.documentElement.dir = dir;
    const stage = document.getElementById("stage")!;
    stage.innerHTML = `
      <div style="width: 80px"><ds-text id="long" literal>Patriksson Grove and the long way round</ds-text></div>
      <div style="width: 200px"><ds-text id="short" literal>Patrik</ds-text></div>
      <ds-row id="row" href="/people/1" style="width: 120px"><ds-text class="ds-row__name" literal>Patriksson Grove</ds-text><span class="ds-row__value">Oct</span></ds-row>
      <div style="width: 60px"><ds-tag id="tag">A very long tag</ds-tag></div>
      <div style="width: 80px"><ds-button id="menu" menu-item><ds-text literal>Patriksson Grove</ds-text></ds-button></div>
      <div class="ds-row" style="width: 80px"><span class="ds-row__name" id="native">A record's long name</span></div>`;
    await Promise.all([...stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")].map(element => element.updateComplete));
    (window as unknown as { startCutFades: () => () => void }).startCutFades();
    // Let the resize observers report.
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const read = (element: Element) => {
      const style = getComputedStyle(element);
      return { cut: element.getAttribute("data-cut"), mask: style.maskImage, overflow: style.textOverflow };
    };
    const tag = document.getElementById("tag")!;
    const menu = document.getElementById("menu")!;
    const rowName = document.querySelector("#row .ds-row__name")!;
    const long = document.getElementById("long")!;
    return {
      long: read(long),
      short: read(document.getElementById("short")!),
      row: read(rowName),
      tag: read(tag.shadowRoot!.querySelector(".words")!),
      tagFrame: read(tag.shadowRoot!.querySelector(".frame")!),
      menu: read(menu.querySelector("ds-text")!),
      native: read(document.getElementById("native")!),
      // The box is cut at its width: the words do not run past it.
      longWidth: long.getBoundingClientRect().width,
    };
  }, dir);
  await tab.close();
  return result;
}

for (const dir of ["ltr", "rtl"] as const) {
  test(`cut words fade over their last square and words that fit stay crisp (${dir})`, async () => {
    const to = dir === "ltr" ? "to right" : "to left";
    const fade = (mask: string) => {
      expect(mask).toContain("linear-gradient");
      expect(mask).toContain(dir === "ltr" ? "to right" : "to left");
      expect(mask).toContain("calc(100% - 20px)");
    };
    const seen = await measure(dir);
    for (const name of ["long", "row", "tag", "menu", "native"] as const) {
      expect(seen[name].cut, `${name} ${to}`).toBe("end");
      fade(seen[name].mask);
      expect(seen[name].overflow, name).not.toBe("ellipsis");
    }
    expect(seen.short.cut).toBeNull();
    expect(seen.short.mask).toBe("none");
    expect(seen.short.overflow).toBe("clip");
    // A tag's fill stays whole: only its words fade.
    expect(seen.tagFrame.mask).toBe("none");
    expect(seen.longWidth).toBe(80);
  }, 60_000);
}
