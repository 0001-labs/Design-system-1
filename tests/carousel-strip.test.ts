// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const script = await import("../DS1/0-face/carousel");
await import("../DS1/2-core/ds-card");
await import("../DS1/3-unit/ds-carousel");
type Carousel = HTMLElementTagNameMap["ds-carousel"];

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

const sheet = (name: string) => readFileSync(join(import.meta.dirname, `../DS1/${name}`), "utf8");
const settle = async (element: { updateComplete: Promise<unknown> }) => { await element.updateComplete; await new Promise(resolve => setTimeout(resolve)); await element.updateComplete; };
const items = (count: number) => Array.from({ length: count }, (_, index) => `<a class="ds-card" href="#${index}" id="card-${index}">Card ${index + 1}</a>`).join("");

test("an autoplay interval is off unless asked for, five seconds when empty, and never under a second", () => {
  expect(script.autoplayInterval(null)).toBe(0);
  expect(script.autoplayInterval(undefined)).toBe(0);
  expect(script.autoplayInterval("false")).toBe(0);
  expect(script.autoplayInterval("")).toBe(script.CAROUSEL_AUTOPLAY_MS);
  expect(script.autoplayInterval(true)).toBe(5000);
  expect(script.autoplayInterval("3000")).toBe(3000);
  expect(script.autoplayInterval("200")).toBe(1000);
  expect(script.autoplayInterval("soon")).toBe(0);
});

test("a native strip copies nothing without loop", () => {
  document.body.innerHTML = `<section class="ds-carousel" aria-label="Work" data-slides="auto"><div class="ds-carousel__track">${items(3)}</div></section>`;
  const stop = script.startCarousels();
  const track = document.querySelector(".ds-carousel__track")!;
  expect(document.querySelector(".ds-carousel")!.getAttribute("role")).toBe("region");
  expect([...track.children].map(item => item.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
  expect(track.querySelectorAll(`[${script.COPY}]`)).toHaveLength(0);
  stop();
});

test("a native loop holds the slides three times over, the copies inert, hidden and without ids, and stopping removes them", () => {
  document.body.innerHTML = `<section class="ds-carousel" aria-label="Work" data-slides="auto" data-loop><div class="ds-carousel__track">${items(3)}</div><div class="ds-pagedots"></div></section>`;
  const stop = script.startCarousels();
  const track = document.querySelector(".ds-carousel__track")!;
  const copies = [...track.querySelectorAll<HTMLElement>(`[${script.COPY}]`)];
  expect(track.children).toHaveLength(9);
  expect(copies).toHaveLength(6);
  expect(copies.every(copy => copy.getAttribute("aria-hidden") === "true" && copy.inert && !copy.id)).toBe(true);
  expect([...track.children].slice(3, 6).map(item => item.id)).toEqual(["card-0", "card-1", "card-2"]);
  // A looping strip has no place to point to, so its dots stay empty.
  expect(document.querySelectorAll(".ds-pagedots__dot")).toHaveLength(0);
  stop();
  expect(track.children).toHaveLength(3);
});

test("a single slide never loops", () => {
  document.body.innerHTML = `<section class="ds-carousel" data-loop><div class="ds-carousel__track">${items(1)}</div></section>`;
  script.startCarousels();
  expect(document.querySelector(".ds-carousel__track")!.children).toHaveLength(1);
});

test("native autoplay adds a pause button that holds and resumes", () => {
  document.body.innerHTML = `<section class="ds-carousel" aria-label="Work" data-slides="auto" data-autoplay="2000"><div class="ds-carousel__track">${items(3)}</div></section>`;
  script.startCarousels(document, { icons: "/x-icon/" });
  const pause = document.querySelector<HTMLButtonElement>(".ds-carousel__controls > .ds-carousel__pause")!;
  expect(pause).not.toBeNull();
  expect(pause.getAttribute("aria-label")).toBe("Pause");
  expect(pause.getAttribute("aria-pressed")).toBe("false");
  pause.click();
  expect(pause.getAttribute("aria-label")).toBe("Play");
  expect(pause.getAttribute("aria-pressed")).toBe("true");
  expect(pause.querySelector<HTMLElement>(".ds-icon")!.style.getPropertyValue("--ds-icon")).toContain("/x-icon/play-alt.svg");
});

test("a bleeding strip measures its room to the window's edges", () => {
  document.body.innerHTML = `<section class="ds-carousel" data-slides="auto" data-bleed="end"><div class="ds-carousel__track">${items(2)}</div></section>`;
  script.startCarousels();
  const block = document.querySelector<HTMLElement>(".ds-carousel")!;
  expect(block.style.getPropertyValue("--ds-carousel-before")).toMatch(/px$/);
  expect(block.style.getPropertyValue("--ds-carousel-after")).toMatch(/px$/);
});

test("a strip of slides of their own width is a named region with buttons named by the shared words", async () => {
  document.body.innerHTML = `<ds-carousel label="Work" literal slide-width="auto" no-dots buttons gap="2">${items(3)}</ds-carousel>`;
  const strip = document.querySelector("ds-carousel") as Carousel;
  await settle(strip);
  expect(strip.getAttribute("role")).toBe("region");
  expect(strip.getAttribute("aria-label")).toBe("Work");
  expect(strip.shadowRoot!.querySelector(".ds-carousel")!.getAttribute("data-slides")).toBe("auto");
  expect(strip.slides.map(item => item.getAttribute("aria-label"))).toEqual(["1 of 3", "2 of 3", "3 of 3"]);
  expect([...strip.shadowRoot!.querySelectorAll("button")].map(button => button.getAttribute("aria-label"))).toEqual(["Previous slide", "Next slide"]);
  expect(strip.style.getPropertyValue("--ds-carousel-gap")).toBe("calc(var(--ds-unit) * 2)");
  expect(strip.style.getPropertyValue("--ds-carousel-slide")).toBe("max-content");
});

test("a looping ds-carousel keeps its slides, counts no copies among them and draws no dots", async () => {
  document.body.innerHTML = `<ds-carousel label="Work" literal slide-width="auto" loop buttons>${items(3)}</ds-carousel>`;
  const strip = document.querySelector("ds-carousel") as Carousel;
  await settle(strip);
  expect(strip.children).toHaveLength(9);
  expect(strip.slides).toHaveLength(3);
  expect(strip.shadowRoot!.querySelector("ds-pagedots")).toBeNull();
  expect(strip.shadowRoot!.querySelector<HTMLButtonElement>(".ds-carousel__previous")!.disabled).toBe(false);
});

test("ds-carousel with autoplay draws a pause button, and bleed reaches the track", async () => {
  document.body.innerHTML = `<ds-carousel label="Work" literal slide-width="auto" autoplay bleed="end">${items(3)}</ds-carousel>`;
  const strip = document.querySelector("ds-carousel") as Carousel;
  await settle(strip);
  const pause = strip.shadowRoot!.querySelector<HTMLButtonElement>(".ds-carousel__pause")!;
  expect(pause.getAttribute("aria-label")).toBe("Pause");
  pause.click();
  await settle(strip);
  expect(pause.getAttribute("aria-label")).toBe("Play");
  expect(strip.shadowRoot!.querySelector(".ds-carousel")!.getAttribute("data-bleed")).toBe("end");
});

test("the sheet keeps the strip to the grid: gaps in squares, the bleed's room, free sliding", () => {
  const carousel = sheet("1-root/carousel.css");
  expect(carousel).toContain("margin-inline-end: calc(-1 * var(--ds-carousel-after, 0px))");
  expect(carousel).toContain('.ds-carousel[data-slides="auto"] > .ds-carousel__track {\n  grid-auto-columns: max-content;');
  expect(carousel).toContain('.ds-carousel[data-snap="none"] > .ds-carousel__track {\n  scroll-snap-type: none;');
  expect(sheet("1-root/controls.css")).toMatch(/@import "\.\/carousel\.css";\n@import "\.\/card\.css";/);
});
