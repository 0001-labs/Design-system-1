// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test, vi } from "vite-plus/test";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const script = await import("../DS1/0-face/slide");
await import("../DS1/2-core/ds-card");
await import("../DS1/3-unit/ds-slide");
type Slide = HTMLElementTagNameMap["ds-slide"];
type Card = HTMLElementTagNameMap["ds-card"];

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });

const sheet = (name: string) => readFileSync(join(import.meta.dirname, `../DS1/${name}`), "utf8");
const settle = async (element: { updateComplete: Promise<unknown> }) => { await element.updateComplete; await new Promise(resolve => setTimeout(resolve)); await element.updateComplete; };
const items = (count: number) => Array.from({ length: count }, (_, index) => `<a class="ds-card" href="#${index}" id="card-${index}">Card ${index + 1}</a>`).join("");

test("an autoplay interval is off unless asked for, five seconds when empty, and never under a second", () => {
  expect(script.autoplayInterval(null)).toBe(0);
  expect(script.autoplayInterval(undefined)).toBe(0);
  expect(script.autoplayInterval("false")).toBe(0);
  expect(script.autoplayInterval("")).toBe(script.SLIDE_AUTOPLAY_MS);
  expect(script.autoplayInterval(true)).toBe(5000);
  expect(script.autoplayInterval("3000")).toBe(3000);
  expect(script.autoplayInterval("200")).toBe(1000);
  expect(script.autoplayInterval("soon")).toBe(0);
});

test("a native slide is a region holding a list, and copies nothing without loop", () => {
  document.body.innerHTML = `<section class="ds-slide" aria-label="Work"><div class="ds-slide__track">${items(3)}</div></section>`;
  const stop = script.startSlides();
  const block = document.querySelector(".ds-slide")!;
  const track = block.querySelector(".ds-slide__track")!;
  expect(block.getAttribute("role")).toBe("region");
  expect(track.getAttribute("role")).toBe("list");
  expect([...track.children].map(item => item.getAttribute("role"))).toEqual(["listitem", "listitem", "listitem"]);
  expect(track.querySelectorAll(`[${script.COPY}]`)).toHaveLength(0);
  stop();
});

test("a native loop holds the items three times over, the copies inert, hidden and without ids, and stopping removes them", () => {
  document.body.innerHTML = `<section class="ds-slide" aria-label="Work" data-loop><div class="ds-slide__track">${items(3)}</div></section>`;
  const stop = script.startSlides();
  const track = document.querySelector(".ds-slide__track")!;
  const copies = [...track.querySelectorAll<HTMLElement>(`[${script.COPY}]`)];
  expect(track.children).toHaveLength(9);
  expect(copies).toHaveLength(6);
  expect(copies.every(copy => copy.getAttribute("aria-hidden") === "true" && copy.inert && !copy.id)).toBe(true);
  expect([...track.children].slice(3, 6).map(item => item.id)).toEqual(["card-0", "card-1", "card-2"]);
  stop();
  expect(track.children).toHaveLength(3);
});

test("a single item never loops", () => {
  document.body.innerHTML = `<section class="ds-slide" data-loop><div class="ds-slide__track">${items(1)}</div></section>`;
  script.startSlides();
  expect(document.querySelector(".ds-slide__track")!.children).toHaveLength(1);
});

test("native autoplay adds a pause button that holds and resumes", () => {
  document.body.innerHTML = `<section class="ds-slide" aria-label="Work" data-autoplay="2000"><div class="ds-slide__track">${items(3)}</div></section>`;
  script.startSlides(document, { icons: "/x-icon/" });
  const pause = document.querySelector<HTMLButtonElement>(".ds-slide__controls > .ds-slide__pause")!;
  expect(pause).not.toBeNull();
  expect(pause.getAttribute("aria-label")).toBe("Pause");
  expect(pause.getAttribute("aria-pressed")).toBe("false");
  pause.click();
  expect(pause.getAttribute("aria-label")).toBe("Play");
  expect(pause.getAttribute("aria-pressed")).toBe("true");
  expect(pause.querySelector<HTMLElement>(".ds-icon")!.style.getPropertyValue("--ds-icon")).toContain("/x-icon/play-alt.svg");
});

test("a bleeding slide measures its room to the window's edges", () => {
  document.body.innerHTML = `<section class="ds-slide" data-bleed="end"><div class="ds-slide__track">${items(2)}</div></section>`;
  script.startSlides();
  const block = document.querySelector<HTMLElement>(".ds-slide")!;
  expect(block.style.getPropertyValue("--ds-slide-before")).toMatch(/px$/);
  expect(block.style.getPropertyValue("--ds-slide-after")).toMatch(/px$/);
});

test("ds-slide is a region named by its label, its items a list, with buttons named by the shared words", async () => {
  document.body.innerHTML = `<ds-slide label="Work" literal buttons gap="2">${items(3)}</ds-slide>`;
  const slide = document.querySelector("ds-slide") as Slide;
  await settle(slide);
  expect(slide.getAttribute("role")).toBe("region");
  expect(slide.getAttribute("aria-label")).toBe("Work");
  expect(slide.shadowRoot!.querySelector(".ds-slide__track")!.getAttribute("role")).toBe("list");
  expect(slide.items.map(item => item.getAttribute("role"))).toEqual(["listitem", "listitem", "listitem"]);
  expect([...slide.shadowRoot!.querySelectorAll("button")].map(button => button.getAttribute("aria-label"))).toEqual(["Previous slide", "Next slide"]);
  expect(slide.style.getPropertyValue("--ds-slide-gap")).toBe("calc(var(--ds-unit) * 2)");
});

test("ds-slide with loop keeps its items and counts no copies among them", async () => {
  document.body.innerHTML = `<ds-slide label="Work" literal loop>${items(3)}</ds-slide>`;
  const slide = document.querySelector("ds-slide") as Slide;
  await settle(slide);
  expect(slide.children).toHaveLength(9);
  expect(slide.items).toHaveLength(3);
});

test("ds-slide with autoplay draws a pause button, and bleed reaches the track", async () => {
  document.body.innerHTML = `<ds-slide label="Work" literal autoplay bleed="end">${items(3)}</ds-slide>`;
  const slide = document.querySelector("ds-slide") as Slide;
  await settle(slide);
  const pause = slide.shadowRoot!.querySelector<HTMLButtonElement>(".ds-slide__pause")!;
  expect(pause.getAttribute("aria-label")).toBe("Pause");
  pause.click();
  await settle(slide);
  expect(pause.getAttribute("aria-label")).toBe("Play");
  expect(slide.shadowRoot!.querySelector(".ds-slide")!.getAttribute("data-bleed")).toBe("end");
});

test("a card with href is one link carrying its tone, sized in squares", async () => {
  document.body.innerHTML = `<ds-card href="/lists" tone="sharp-blue" width="14" height="22" media="center"><span slot="label">Lists</span><span slot="title">On one grid</span><img slot="media" alt="" /></ds-card>`;
  const card = document.querySelector("ds-card") as Card;
  await settle(card);
  const link = card.shadowRoot!.querySelector("a.ds-card")!;
  expect(link.getAttribute("href")).toBe("/lists");
  expect(link.getAttribute("data-tone")).toBe("sharp-blue");
  expect(card.shadowRoot!.querySelectorAll("a")).toHaveLength(1);
  expect(card.style.getPropertyValue("--ds-card-width")).toBe("calc(var(--ds-unit) * 14)");
  expect(card.style.getPropertyValue("--ds-card-height")).toBe("calc(var(--ds-unit) * 22)");
  expect(card.shadowRoot!.querySelector(".ds-card__media")!.classList.contains("ds-card__media--center")).toBe(true);
  expect(card.shadowRoot!.querySelector<HTMLElement>(".ds-card__label")!.hidden).toBe(false);
});

test("an interactive card is one button that fires ds-card-press on a click, Enter and Space", async () => {
  document.body.innerHTML = `<ds-card interactive><span slot="title">Plans</span></ds-card>`;
  const card = document.querySelector("ds-card") as Card;
  await settle(card);
  const pressed = vi.fn();
  card.addEventListener("ds-card-press", pressed);
  const face = card.shadowRoot!.querySelector<HTMLElement>("[role=button]")!;
  face.click();
  face.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  face.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true }));
  face.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
  expect(pressed).toHaveBeenCalledTimes(3);
});

test("a card's empty slots take no room", async () => {
  document.body.innerHTML = `<ds-card><ds-text literal>Only writing</ds-text></ds-card>`;
  const card = document.querySelector("ds-card") as Card;
  await settle(card);
  for (const part of ["label", "title", "media"]) expect(card.shadowRoot!.querySelector<HTMLElement>(`.ds-card__${part}`)!.hidden).toBe(true);
});

test("the sheets keep to the grid: gaps in squares, the card padded a square, no shadow on a filled card", () => {
  const slide = sheet("1-root/slide.css");
  const card = sheet("1-root/card.css");
  expect(slide).toContain("--ds-slide-gap: var(--ds-unit)");
  expect(slide).toContain("margin-inline-end: calc(-1 * var(--ds-slide-after, 0px))");
  expect(card).toContain("--ds-card-padding: var(--ds-unit)");
  expect(card).toContain("border-radius: var(--ds-radius-card)");
  expect(card).not.toMatch(/box-shadow:\s*0 \d/);
  expect(sheet("1-root/controls.css")).toMatch(/@import "\.\/slide\.css";\n@import "\.\/card\.css";/);
});
