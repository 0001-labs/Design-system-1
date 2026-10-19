// @vitest-environment node
// A ds-tooltip at the window's edge stays inside it: shifted to four pixels from the edge, and
// below its control when there is no room above (Joachim, 19 October 2026: cut at a docs frame's edge).
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

let server: ViteDevServer;
let browser: Browser;
let page: Page;

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 400, height: 300 } });
  await page.goto(`http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/control-measure.html`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.addScriptTag({ type: "module", content: 'import "/DS1/2-core/ds-tooltip.ts";' });
  await page.waitForFunction(() => !!customElements.get("ds-tooltip"));
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function bubbleAt(style: string, placement = "top") {
  await page.evaluate(async ({ style, placement }) => {
    const stage = document.getElementById("stage")!;
    stage.innerHTML = `<ds-tooltip id="tip" placement="${placement}" literal text="Add to selected works" style="position:fixed;${style}"><button type="button">★</button></ds-tooltip>`;
    const tip = document.getElementById("tip") as HTMLElement & { updateComplete: Promise<unknown> };
    await tip.updateComplete;
    tip.dispatchEvent(new MouseEvent("mouseenter"));
    await tip.updateComplete;
    await new Promise(requestAnimationFrame);
  }, { style, placement });
  return page.evaluate(() => {
    const bubble = document.getElementById("tip")!.shadowRoot!.querySelector<HTMLElement>(".bubble")!;
    const box = bubble.getBoundingClientRect(), control = document.querySelector("#tip button")!.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, above: box.bottom <= control.top, width: innerWidth, height: innerHeight };
  });
}

test("a tooltip at the left edge shifts to four pixels inside the window", async () => {
  const box = await bubbleAt("left:0;top:100px");
  expect(box.left).toBe(4);
  expect(box.above).toBe(true);
});

test("a tooltip at the right edge shifts to four pixels inside the window", async () => {
  const box = await bubbleAt("right:0;top:100px");
  expect(box.width - box.right).toBe(4);
});

test("a tooltip with no room above stands below its control, and one with room stays centred", async () => {
  const flipped = await bubbleAt("left:180px;top:0");
  expect(flipped.above).toBe(false);
  expect(flipped.top).toBeGreaterThanOrEqual(0);
  const centred = await bubbleAt("left:180px;top:100px");
  expect(centred.above).toBe(true);
  expect(centred.left).toBeGreaterThan(4);
});

test("placement bottom with no room below stands above", async () => {
  const box = await bubbleAt("left:180px;bottom:0", "bottom");
  expect(box.above).toBe(true);
});
