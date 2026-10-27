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

for (const surface of ["iframe", "shadow"] as const) {
  test(`right-click preserves the initiating control in a ${surface}`, async () => {
    const page = await browser.newPage();
    await page.goto(`${origin}/tests/fixtures/menu-measure.html`);
    await page.addScriptTag({ type: "module", content: 'import { bindContextMenuTrigger } from "/DS1/3-unit/context-trigger.ts"; window.bindTrigger = bindContextMenuTrigger;' });
    await page.waitForFunction(() => "bindTrigger" in window);
    const result = await page.evaluate((surface) => {
      const bindContextMenuTrigger = (window as unknown as { bindTrigger: typeof import("../DS1/3-unit/context-trigger").bindContextMenuTrigger }).bindTrigger;
      let doc = document;
      let parent: HTMLElement | ShadowRoot = document.body;
      if (surface === "iframe") {
        const frame = document.createElement("iframe");
        document.body.append(frame);
        doc = frame.contentDocument!;
        parent = doc.body;
      } else {
        const host = document.createElement("div");
        document.body.append(host);
        parent = host.attachShadow({ mode: "open" });
      }
      const button = doc.createElement("button");
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
