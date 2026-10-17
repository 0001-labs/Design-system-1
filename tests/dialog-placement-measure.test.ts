// @vitest-environment node
// Real layout, colour and touch: sheets, drawers and shortcut hints drawn in Chromium,
// light and dark and at a phone's scale, measured against the 20px square.
import { afterAll, beforeAll, expect, test } from "vite-plus/test";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";
import type { AddressInfo } from "node:net";

const UNIT = 20;
const PHONE = { width: 375, height: 812 };
let server: ViteDevServer;
let browser: Browser;
let url: string;
const contexts: BrowserContext[] = [];

beforeAll(async () => {
  server = await createServer({ configFile: false, root: process.cwd(), logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
  await server.listen();
  browser = await chromium.launch();
  url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/dialog-placement.html`;
}, 60_000);

afterAll(async () => {
  for (const context of contexts) await context.close();
  await browser?.close();
  await server?.close();
});

async function page(options: { scheme?: "light" | "dark"; width?: number; height?: number; reducedMotion?: "reduce" | "no-preference" } = {}): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width: options.width ?? PHONE.width, height: options.height ?? PHONE.height },
    colorScheme: options.scheme ?? "light",
    reducedMotion: options.reducedMotion ?? "no-preference",
    hasTouch: true,
  });
  contexts.push(context);
  const tab = await context.newPage();
  await tab.goto(url);
  await tab.waitForFunction(() => document.documentElement.dataset.ready === "true");
  return tab;
}

const rows = (count: number) => Array.from({ length: count }, (_, index) => `<p class="row">Row ${index + 1}</p>`).join("");

/** Opens a ds-dialog (or a native frame) and waits for it to come to rest. */
async function open(tab: Page, markup: string, { scale = 1, native = false } = {}) {
  await tab.evaluate(async ({ markup, scale, native }) => {
    document.documentElement.style.setProperty("--ds-sf", String(scale));
    const stage = document.getElementById("stage")!;
    stage.innerHTML = markup;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    if (native) {
      const dialog = stage.querySelector("dialog")!;
      (window as unknown as { unbind?: () => void }).unbind = (window as unknown as { bindDialogSwipe: (dialog: HTMLDialogElement) => () => void }).bindDialogSwipe(dialog);
      dialog.showModal();
    } else await (stage.querySelector("ds-dialog") as HTMLElement & { show(): Promise<void> }).show();
    await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
    for (let i = 0; i < 2; i++) await new Promise(requestAnimationFrame);
  }, { markup, scale, native });
}

async function measure(tab: Page) {
  return tab.evaluate(() => {
    const dialog = document.querySelector("dialog")!;
    const box = dialog.getBoundingClientRect();
    const style = getComputedStyle(dialog);
    const handle = getComputedStyle(dialog, "::before");
    const first = dialog.querySelector(".row")?.getBoundingClientRect();
    return {
      left: box.left, top: box.top, right: box.right, bottom: box.bottom, width: box.width, height: box.height,
      firstRow: first ? first.top - box.top : null,
      borders: [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth],
      handle: { content: handle.content, display: handle.display, width: parseFloat(handle.width), height: parseFloat(handle.height), top: parseFloat(handle.top), background: handle.backgroundColor },
      border: getComputedStyle(document.documentElement).getPropertyValue("--ds-border-color"),
      transform: style.transform,
      transition: style.transitionProperty,
    };
  });
}

/** One finger along a path, each step a frame apart (or `gap` milliseconds), held `hold` milliseconds before it lifts. */
async function swipe(tab: Page, path: [number, number][], { gap = 16, hold = 0, prevent = false } = {}) {
  return tab.evaluate(async ({ path, gap, hold, prevent }) => {
    const dialog = document.querySelector("dialog")!;
    const host = dialog.closest("ds-dialog") ?? dialog;
    const reasons: string[] = [];
    const listen = (event: Event) => { reasons.push((event as CustomEvent<{ reason: string }>).detail.reason); if (prevent) event.preventDefault(); };
    host.addEventListener("ds-close-request", listen);
    const target = dialog.querySelector(".row") ?? dialog;
    const fire = (type: string, x: number, y: number, held: boolean) => {
      const touch = new Touch({ identifier: 7, target, clientX: x, clientY: y });
      target.dispatchEvent(new TouchEvent(type, { touches: held ? [touch] : [], targetTouches: held ? [touch] : [], changedTouches: [touch], bubbles: true, cancelable: true, composed: true }));
    };
    const [startX, startY] = path[0]!;
    fire("touchstart", startX, startY, true);
    let dragging = false;
    for (const [x, y] of path.slice(1)) {
      await new Promise(resolve => setTimeout(resolve, gap));
      fire("touchmove", x, y, true);
      dragging ||= dialog.hasAttribute("data-ds-dialog-dragging");
    }
    if (hold) await new Promise(resolve => setTimeout(resolve, hold));
    const [endX, endY] = path.at(-1)!;
    const dragged = dialog.style.getPropertyValue("--ds-dialog-drag");
    fire("touchend", endX, endY, false);
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
    await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
    await new Promise(resolve => setTimeout(resolve, 450));
    host.removeEventListener("ds-close-request", listen);
    return { reasons, dragging, dragged, open: dialog.open, transform: getComputedStyle(dialog).transform };
  }, { path, gap, hold, prevent });
}

const sheet = (content = rows(3), attributes = "") => `<ds-dialog placement="sheet" ${attributes}><dialog aria-label="Sheet">${content}</dialog></ds-dialog>`;
const nativeSheet = (content = rows(3), placement = "sheet") => `<dialog class="ds-dialog ds-dialog--${placement}" aria-label="Sheet">${content}</dialog>`;

test("a sheet stands at the foot of a phone, as wide as it, on whole squares, with its handle in its first square", async () => {
  for (const scheme of ["light", "dark"] as const) {
    const tab = await page({ scheme });
    for (const scale of [1, 1.5]) {
      for (const native of [false, true]) {
        await open(tab, native ? nativeSheet() : sheet(), { scale, native });
        const box = await measure(tab);
        const square = UNIT * scale;
        const label = `${scheme} ${scale} ${native ? "native" : "element"}`;
        expect(box.left, label).toBe(0);
        expect(box.width, label).toBe(PHONE.width);
        expect(box.bottom, label).toBe(PHONE.height);
        // A square of padding, three rows and two gaps of a square, a square of padding.
        expect(box.height, label).toBeCloseTo(7 * square, 5);
        expect(box.firstRow, `${label}: the handle takes no room`).toBeCloseTo(square, 5);
        expect(box.borders, label).toEqual(["1px", "1px", "0px", "1px"]);
        expect(box.handle.display, label).toBe("block");
        expect(box.handle.width, label).toBeCloseTo(2 * square, 5);
        expect(box.handle.height, label).toBeCloseTo(4 * scale, 5);
        // Centred in the first square, which holds the sheet's line (sticky top is measured inside it).
        expect(box.handle.top, label).toBeCloseTo((square - 4 * scale) / 2 - 1, 5);
        expect(box.transform, `${label} at rest`).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
        expect(box.transition, label).toContain("transform");
      }
    }
    // The handle is drawn in the line colour of each scheme.
    const handle = (await measure(tab)).handle.background;
    expect(handle).toBe(scheme === "light" ? "rgb(216, 216, 216)" : "rgb(61, 61, 61)");
  }
});

test("on a wide screen a sheet is 32 squares wide, centred on whole squares", async () => {
  const tab = await page({ width: 1200, height: 800 });
  await open(tab, sheet());
  const box = await measure(tab);
  expect(box.width).toBe(32 * UNIT);
  expect(box.left).toBe((1200 - 32 * UNIT) / 2);
  expect(box.left % UNIT).toBe(0);
  expect(box.bottom).toBe(800);
});

test("a tall sheet stops two squares below the top and scrolls, its handle staying put", async () => {
  const tab = await page();
  await open(tab, sheet(rows(60)));
  const box = await measure(tab);
  expect(box.top).toBe(2 * UNIT);
  expect(box.bottom).toBe(PHONE.height);
  const scrolled = await tab.evaluate(() => {
    const dialog = document.querySelector("dialog")!;
    dialog.scrollTop = 200;
    return { scrollTop: dialog.scrollTop, handleTop: getComputedStyle(dialog, "::before").top };
  });
  expect(scrolled.scrollTop).toBe(200);
  expect(scrolled.handleTop).toBe("7px");
});

test("drawers are the screen's height and 16 squares wide, at the end or the start, with one line facing the page", async () => {
  const tab = await page();
  for (const [placement, dir, side] of [["end", "ltr", "right"], ["start", "ltr", "left"], ["end", "rtl", "left"], ["start", "rtl", "right"]] as const) {
    for (const native of [false, true]) {
      const markup = native ? `<div dir="${dir}">${nativeSheet(rows(3), placement)}</div>` : `<div dir="${dir}"><ds-dialog placement="${placement}"><dialog aria-label="Drawer">${rows(3)}</dialog></ds-dialog></div>`;
      await open(tab, markup, { native });
      const box = await measure(tab);
      const label = `${placement} ${dir} ${native ? "native" : "element"}`;
      expect(box.width, label).toBe(16 * UNIT);
      expect(box.height, label).toBe(PHONE.height);
      expect(box.top, label).toBe(0);
      if (side === "right") expect(box.right, label).toBe(PHONE.width);
      else expect(box.left, label).toBe(0);
      expect(box.borders, label).toEqual(side === "right" ? ["0px", "0px", "0px", "1px"] : ["0px", "1px", "0px", "0px"]);
      expect(box.firstRow, label).toBe(UNIT);
      expect(box.handle.content, `${label}: no handle`).toBe("none");
    }
  }
});

test("a sheet slides out to its edge when it closes, and with reduced motion fades where it stands", async () => {
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    const tab = await page({ reducedMotion });
    await open(tab, sheet());
    const leaving = await tab.evaluate(async () => {
      const host = document.querySelector("ds-dialog") as HTMLElement & { close(): void };
      const dialog = host.querySelector("dialog")!;
      const height = dialog.getBoundingClientRect().height;
      host.close();
      await new Promise(resolve => setTimeout(resolve, 120));
      const style = getComputedStyle(dialog);
      const midway = { display: style.display, y: new DOMMatrixReadOnly(style.transform).m42, opacity: Number(style.opacity), height };
      await new Promise(resolve => setTimeout(resolve, 500));
      return { midway, after: getComputedStyle(dialog).display, transition: getComputedStyle(dialog).transitionProperty };
    });
    expect(leaving.midway.display, reducedMotion).toBe("flex");
    if (reducedMotion === "reduce") {
      expect(leaving.transition).not.toContain("transform");
      expect(leaving.midway.y).toBe(0);
      expect(leaving.midway.opacity).toBeLessThan(1);
    } else {
      expect(leaving.midway.y).toBeGreaterThan(0);
      expect(leaving.midway.y).toBeLessThanOrEqual(leaving.midway.height);
    }
    expect(leaving.after).toBe("none");
  }
});

test("a quick swipe down dismisses a sheet through a close request; a short, slow one settles it home", async () => {
  const tab = await page();
  await open(tab, sheet(rows(10)));
  const slow = await swipe(tab, [[180, 500], [180, 520], [180, 540], [180, 560], [180, 580]], { gap: 40, hold: 160 });
  expect(slow.dragging).toBe(true);
  expect(slow.reasons).toEqual([]);
  expect(slow.open).toBe(true);
  expect(slow.transform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);

  const quick = await swipe(tab, [[180, 500], [180, 530], [180, 570], [180, 620], [180, 680]]);
  expect(quick.reasons).toEqual(["swipe"]);
  expect(quick.open).toBe(false);
  expect(await tab.evaluate(() => (document.querySelector("ds-dialog") as HTMLElement & { open: boolean }).open)).toBe(false);
});

test("a declined swipe keeps the sheet open and settles it home", async () => {
  const tab = await page();
  await open(tab, sheet(rows(10)));
  const declined = await swipe(tab, [[180, 500], [180, 530], [180, 570], [180, 620], [180, 680]], { prevent: true });
  expect(declined.reasons).toEqual(["swipe"]);
  expect(declined.open).toBe(true);
  expect(declined.transform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
});

test("content scrolled down takes the finger first, and a sideways move is left alone", async () => {
  const tab = await page();
  await open(tab, sheet(rows(60)));
  await tab.evaluate(() => { document.querySelector("dialog")!.scrollTop = 100; });
  const scrolled = await swipe(tab, [[180, 300], [180, 330], [180, 370], [180, 420], [180, 480]]);
  expect(scrolled.dragging).toBe(false);
  expect(scrolled.reasons).toEqual([]);
  await tab.evaluate(() => { document.querySelector("dialog")!.scrollTop = 0; });
  const sideways = await swipe(tab, [[100, 300], [130, 302], [170, 304], [220, 306]]);
  expect(sideways.dragging).toBe(false);
  expect(sideways.open).toBe(true);
});

test("a native sheet and a drawer swipe away too, toward their own edge", async () => {
  const tab = await page();
  await open(tab, nativeSheet(rows(10)), { native: true });
  const down = await swipe(tab, [[180, 500], [180, 530], [180, 570], [180, 620], [180, 680]]);
  expect(down.reasons).toEqual(["swipe"]);
  expect(down.open).toBe(false);

  await open(tab, `<ds-dialog placement="end"><dialog aria-label="Drawer">${rows(3)}</dialog></ds-dialog>`);
  const left = await swipe(tab, [[200, 300], [170, 300], [130, 300], [80, 300]]);
  expect(left.dragging, "towards the page: it gives a little").toBe(true);
  expect(left.open).toBe(true);
  const right = await swipe(tab, [[200, 300], [230, 300], [270, 300], [320, 300], [370, 300]]);
  expect(right.reasons).toEqual(["swipe"]);
  expect(right.open).toBe(false);
});

test("a shortcut hint is one control high in its one-square line, set in a face led by Inter's arrows", async () => {
  for (const scheme of ["light", "dark"] as const) {
    const tab = await page({ scheme });
    for (const scale of [1, 1.5]) {
      const boxes = await tab.evaluate(async (scale) => {
        document.documentElement.style.setProperty("--ds-sf", String(scale));
        const stage = document.getElementById("stage")!;
        stage.innerHTML = `<p class="ds-text" id="native"><kbd class="ds-kbd">↑</kbd> Up</p><p class="ds-text" id="element"><ds-kbd shortcut="mod+shift+d"></ds-kbd> Duplicate</p><p class="ds-text" id="plain"><ds-kbd plain shortcut="escape"></ds-kbd></p>`;
        await (stage.querySelector("ds-kbd") as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
        await new Promise(requestAnimationFrame);
        return ["native", "element", "plain"].map(id => {
          const line = document.getElementById(id)!;
          const host = line.firstElementChild as HTMLElement;
          const kbd = (host.shadowRoot?.querySelector("kbd") ?? host) as HTMLElement;
          const box = kbd.getBoundingClientRect(), lineBox = line.getBoundingClientRect();
          const style = getComputedStyle(kbd);
          return { line: lineBox.height, height: box.height, width: box.width, offset: box.top - lineBox.top, font: style.fontFamily, background: style.backgroundColor, text: kbd.textContent };
        });
      }, scale);
      const [native, element, plain] = boxes;
      for (const box of [native!, element!]) {
        expect(box.line, `${scheme} ${scale}`).toBeCloseTo(UNIT * scale, 5);
        expect(box.height).toBeCloseTo(16 * scale, 5);
        expect(box.width).toBeGreaterThanOrEqual(16 * scale - 0.01);
        expect(box.offset).toBeCloseTo(2 * scale, 5);
        expect(box.font.startsWith('"Inter Arrows"')).toBe(true);
        expect(box.background).not.toBe("rgba(0, 0, 0, 0)");
      }
      expect(plain!.background).toBe("rgba(0, 0, 0, 0)");
      expect(plain!.font.startsWith('"Inter Arrows"')).toBe(true);
      expect(element!.text).toMatch(/^(⇧⌘D|Ctrl\+Shift\+D)$/);
    }
  }
});
