// @vitest-environment node
// Real layout: ds-carousel and the native .ds-carousel classes are drawn in Chromium, light and
// dark, at the base scale and at --ds-sf 1.5, and measured against the 20px square.
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
  const url = `http://127.0.0.1:${(server.httpServer!.address() as AddressInfo).port}/tests/fixtures/carousel-measure.html`;
  for (const scheme of SCHEMES) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 }, colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto(url);
    await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
    pages[scheme] = page;
  }
}, 60_000);

afterAll(async () => {
  await browser?.close();
  await server?.close();
});

const slides = (count: number) => Array.from({ length: count }, (_, index) => `<div class="slide">${index + 1}</div>`).join("");
const element = (scale: number, attributes = 'slide-width="12" buttons') =>
  `<ds-carousel label="Colours" literal ${attributes} style="--ds-sf: ${scale}">${slides(4)}</ds-carousel>`;
const native = (scale: number, width = "calc(var(--ds-unit) * 12)") => `<section class="ds-carousel" aria-label="Colours" data-ds-surface style="--ds-sf: ${scale}; --ds-carousel-slide: ${width}">
  <div class="ds-carousel__track">${slides(4)}</div>
  <div class="ds-carousel__controls">
    <button class="ds-button ds-button--icon ds-carousel__previous" type="button"><span class="ds-icon"></span></button>
    <div class="ds-progress ds-progress--dots"></div>
    <button class="ds-button ds-button--icon ds-carousel__next" type="button"><span class="ds-icon"></span></button>
  </div>
</section>`;

/** Puts markup on the stage, starts native carousels and waits for components to render and paint. */
async function stage(page: Page, markup: string) {
  await page.evaluate(async (markup) => {
    const stage = document.getElementById("stage")!;
    stage.innerHTML = markup;
    (window as unknown as { stopCarousels?: () => void; startCarousels: (root: ParentNode) => () => void }).stopCarousels?.();
    (window as unknown as { stopCarousels?: () => void }).stopCarousels = (window as unknown as { startCarousels: (root: ParentNode) => () => void }).startCarousels(stage);
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("*")) await element.updateComplete;
    for (const element of stage.querySelectorAll<HTMLElement & { updateComplete?: Promise<unknown> }>("ds-carousel")) await element.shadowRoot?.querySelector<HTMLElement & { updateComplete?: Promise<unknown> }>("ds-progress")?.updateComplete;
    for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame);
  }, markup);
}

/** The carousel's parts, measured from its own top left corner, in the element and in the native block alike. */
async function measure(page: Page) {
  return page.evaluate(() => {
    const block = document.getElementById("stage")!.firstElementChild as HTMLElement;
    const root = block.shadowRoot ?? block;
    const origin = block.getBoundingClientRect();
    const box = (element: Element) => { const rect = element.getBoundingClientRect(); return { left: rect.left - origin.left, top: rect.top - origin.top, width: rect.width, height: rect.height }; };
    const track = root.querySelector(".ds-carousel__track")!;
    const slideElements = block.shadowRoot ? [...block.children] : [...track.children];
    const dotsHost = root.querySelector(".ds-progress--dots, ds-progress")!;
    const dots = [...(dotsHost.shadowRoot ?? dotsHost).querySelectorAll(".ds-progress__dot")];
    const current = dots.find(dot => dot.getAttribute("aria-current") === "true")!;
    const drawn = getComputedStyle(current, "::before");
    const future = getComputedStyle(dots.at(-1)!, "::before");
    return {
      host: box(block),
      track: box(track),
      slides: slideElements.map(box),
      controls: box(root.querySelector(".ds-carousel__controls")!),
      previous: box(root.querySelector(".ds-carousel__previous")!),
      next: box(root.querySelector(".ds-carousel__next")!),
      dots: dots.map(box),
      dot: { width: parseFloat(drawn.width), transform: drawn.transform, transition: drawn.transitionDuration, background: drawn.backgroundColor, futureBackground: future.backgroundColor, futureRing: future.boxShadow },
      ink: getComputedStyle(document.getElementById("probe")!).color,
    };
  });
}

test("slides, gaps, buttons and dots stand on whole squares, light and dark, at every scale, element and native class alike", async () => {
  const inks = new Set<string>();
  for (const scheme of SCHEMES) {
    for (const scale of [1, 1.5]) {
      for (const markup of [element(scale), native(scale)]) {
        await stage(pages[scheme], markup);
        const box = await measure(pages[scheme]);
        const square = UNIT * scale;
        const what = `${scheme} at ${scale}, ${markup.startsWith("<ds-") ? "element" : "native"}`;
        expect(box.slides.map(slide => slide.width), what).toEqual([12, 12, 12, 12].map(n => n * square));
        expect(box.slides[1]!.left - box.slides[0]!.left, `${what}: one square between slides`).toBe(13 * square);
        expect(box.slides[0]!.left, what).toBe(0);
        expect(box.track.top, what).toBe(0);
        // The controls: one square high, one square under the track.
        expect(box.controls.top - (box.track.top + box.track.height), what).toBe(square);
        expect(box.controls.height, what).toBe(square);
        expect(box.controls.left % square, what).toBe(0);
        // Each button sits in a one-square cell, each dot is one square.
        expect(box.previous.left, what).toBeCloseTo((square - box.previous.width) / 2, 5);
        expect(box.previous.top - box.controls.top, what).toBeCloseTo((square - box.previous.height) / 2, 5);
        expect(box.previous.width, what).toBe(16 * scale);
        expect(box.dots.map(dot => [dot.left, dot.width, dot.height]), what).toEqual(box.dots.map((_, index) => [(index + 1) * square, square, square]));
        expect(box.next.left - box.dots.at(-1)!.left - square, what).toBeCloseTo((square - box.next.width) / 2, 5);
        expect(box.host.height, what).toBe(box.track.height + 2 * square);
        // The dot: 4px scaled, the current one half again as large, filled in the ink; the rest rings.
        expect(box.dot.width, what).toBeCloseTo(4 * scale, 5);
        expect(box.dot.transform, what).toBe("matrix(1.5, 0, 0, 1.5, 0, 0)");
        expect(box.dot.transition, `${what}: no motion when the reader asks for less`).toBe("0s");
        expect(box.dot.background, what).toBe(box.ink);
        expect(box.dot.futureBackground, what).toBe("rgba(0, 0, 0, 0)");
        expect(box.dot.futureRing, what).toContain("inset");
        inks.add(box.dot.background);
      }
    }
  }
  expect(inks.size, "the ink turns over in dark mode").toBe(2);
});

test("without a slide width each slide is the carousel's width, a square from the next", async () => {
  for (const markup of [element(1, ""), native(1, "100%")]) {
    await stage(pages.light, markup);
    const slidesOnly = await pages.light.evaluate(() => {
      const block = document.getElementById("stage")!.firstElementChild as HTMLElement;
      const slides = block.shadowRoot ? [...block.children] : [...block.querySelector(".ds-carousel__track")!.children];
      return slides.map(slide => slide.getBoundingClientRect()).map(rect => [rect.left, rect.width]);
    });
    expect(slidesOnly.map(([, width]) => width)).toEqual([600, 600, 600, 600]);
    expect(slidesOnly[1]![0]! - slidesOnly[0]![0]!).toBe(620);
  }
});

/** Reads the carousel's current slide, its announcement and what has focus. */
async function state(page: Page) {
  return page.evaluate(() => {
    const block = document.getElementById("stage")!.firstElementChild as HTMLElement;
    const root = block.shadowRoot ?? block;
    const dotsHost = root.querySelector(".ds-progress--dots, ds-progress")!;
    const dots = [...(dotsHost.shadowRoot ?? dotsHost).querySelectorAll(".ds-progress__dot")];
    const track = root.querySelector<HTMLElement>(".ds-carousel__track")!;
    let focused: Element | null = document.activeElement;
    while (focused?.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement;
    return {
      current: dots.findIndex(dot => dot.getAttribute("aria-current") === "true"),
      scroll: Math.round(track.scrollLeft),
      status: root.querySelector('.ds-carousel__status[aria-live="polite"]')!.textContent,
      focus: dots.indexOf(focused as Element),
    };
  });
}

const settle = (page: Page) => page.evaluate(async () => { for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame); await new Promise(resolve => setTimeout(resolve, 200)); });

test("buttons, dots, keys and the reader's own scrolling move the same carousel, at once when motion is reduced", async () => {
  const page = pages.light;
  for (const markup of [element(1), native(1)]) {
    await stage(page, markup);
    const what = markup.startsWith("<ds-") ? "element" : "native";
    await page.evaluate(() => {
      const block = document.getElementById("stage")!.firstElementChild as HTMLElement;
      (block.shadowRoot ?? block).querySelector<HTMLButtonElement>(".ds-carousel__next")!.click();
    });
    await settle(page);
    expect(await state(page), what).toMatchObject({ current: 1, scroll: 13 * UNIT, status: "2 of 4" });
    // The keyboard: from the current dot, End goes to the last, Home back to the first.
    await page.evaluate(() => {
      const block = document.getElementById("stage")!.firstElementChild as HTMLElement;
      const root = block.shadowRoot ?? block;
      const host = root.querySelector(".ds-progress--dots, ds-progress")!;
      (host.shadowRoot ?? host).querySelector<HTMLButtonElement>('[aria-current="true"]')!.focus();
    });
    await page.keyboard.press("End");
    await settle(page);
    const last = await state(page);
    // 600px shows the third slide whole at the far end; the last dot is current and focused.
    expect(last, what).toMatchObject({ current: 3, focus: 3, status: "4 of 4" });
    expect(last.scroll, what).toBe(4 * 12 * UNIT + 3 * UNIT - 600);
    await page.keyboard.press("Home");
    await settle(page);
    expect(await state(page), what).toMatchObject({ current: 0, focus: 0, scroll: 0, status: "1 of 4" });
    // The reader scrolls the track: the dot follows the slide nearest the start.
    await page.evaluate(() => {
      const block = document.getElementById("stage")!.firstElementChild as HTMLElement;
      (block.shadowRoot ?? block).querySelector<HTMLElement>(".ds-carousel__track")!.scrollLeft = 13 * 20;
    });
    await settle(page);
    expect(await state(page), what).toMatchObject({ current: 1, status: "2 of 4" });
  }
});
