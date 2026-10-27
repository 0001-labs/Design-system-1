// @vitest-environment node
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

let server: ViteDevServer;
let browser: Browser;
let origin: string;
beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  origin = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}`;
  browser = await chromium.launch();
}, 60_000);
afterAll(async () => { await browser?.close(); await server?.close(); });

for (const surface of ["iframe", "adopted iframe", "shadow"] as const) {
  test(`right-click preserves the initiating control in a ${surface}`, async () => {
    const page = await browser.newPage();
    await page.goto(`${origin}/tests/fixtures/menu-measure.html`);
    await page.addScriptTag({ type: "module", content: 'import { bindContextMenuTrigger } from "/DS1/3-unit/context-trigger.ts"; window.bindTrigger = bindContextMenuTrigger;' });
    await page.waitForFunction(() => "bindTrigger" in window);
    const result = await page.evaluate((surface) => {
      const bindContextMenuTrigger = (window as unknown as { bindTrigger: typeof import("../DS1/3-unit/context-trigger").bindContextMenuTrigger }).bindTrigger;
      let doc = document;
      let parent: HTMLElement | ShadowRoot = document.body;
      if (surface !== "shadow") {
        const frame = document.createElement("iframe");
        frame.setAttribute("sandbox", "allow-same-origin");
        document.body.append(frame);
        doc = frame.contentDocument!;
        parent = doc.body;
      } else {
        const host = document.createElement("div");
        document.body.append(host);
        parent = host.attachShadow({ mode: "open" });
      }
      const button = (surface === "adopted iframe" ? document : doc).createElement("button");
      parent.append(button);
      let opened = 0;
      let correctTarget = false;
      bindContextMenuTrigger(button, (_point, control, event) => {
        opened++;
        correctTarget = control === button && event.target === button && event.composedPath().includes(button);
      });
      const realm = doc.defaultView!;
      button.dispatchEvent(new realm.PointerEvent("pointerdown", { bubbles: true, composed: true, pointerType: "mouse", button: 2, clientX: 10, clientY: 10 }));
      button.dispatchEvent(new realm.MouseEvent("contextmenu", { bubbles: true, composed: true, cancelable: true, button: 2, clientX: 10, clientY: 10 }));
      return { opened, correctTarget };
    }, surface);
    expect(result).toEqual({ opened: 1, correctTarget: true });
    await page.close();
  });
}

test("native right-click stays on its initiating row when pointerdown settles a transform", async () => {
  const page = await browser.newPage();
  await page.goto(`${origin}/tests/fixtures/menu-measure.html`);
  await page.addScriptTag({ type: "module", content: 'import { bindContextMenuTrigger } from "/DS1/3-unit/context-trigger.ts"; window.bindTrigger = bindContextMenuTrigger;' });
  await page.waitForFunction(() => "bindTrigger" in window);
  await page.evaluate(() => {
    document.body.innerHTML = '<style>body{margin:0}button{display:block;width:160px;height:20px;border:0;padding:0}</style><div id="moving" style="transform:translateY(20px)"><button id="first">First</button><button id="second">Second</button></div>';
    const host = document.querySelector<HTMLElement>("#moving")!;
    const result = { press: "", context: "", opened: "", target: "" };
    (window as unknown as { gestureResult: typeof result }).gestureResult = result;
    host.addEventListener("pointerdown", event => { result.press = (event.target as HTMLElement).id; host.style.transform = ""; }, true);
    host.addEventListener("contextmenu", event => { result.context = (event.target as HTMLElement).id; }, true);
    const bind = (window as unknown as { bindTrigger: typeof import("../DS1/3-unit/context-trigger").bindContextMenuTrigger }).bindTrigger;
    bind(host, (_point, control, event) => { result.opened = control.id; result.target = (event.target as HTMLElement).id; }, {
      touch: false,
      resolve: event => event.composedPath().find(node => node instanceof HTMLButtonElement) as HTMLElement ?? null,
    });
  });
  await page.mouse.click(60, 30, { button: "right" });
  expect(await page.evaluate(() => (window as unknown as { gestureResult: object }).gestureResult)).toEqual({ press: "first", context: "second", opened: "first", target: "first" });
  await page.close();
});
