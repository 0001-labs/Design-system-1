// @vitest-environment happy-dom
// Cut words fade over their last square, never an ellipsis (0-face/cut-fade.ts): an element is
// marked `data-cut="end"` only while its words are wider than its box, and no stylesheet in DS1
// ends cut words with an ellipsis.
import { afterEach, expect, test, vi } from "vite-plus/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { CUT_FADE_SELECTOR, markCut, startCutFades, watchCuts } from "../DS1/0-face/cut-fade";

vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/components");
await import("../DS1/2-core/ds-tag");

afterEach(() => document.body.replaceChildren());

/** Every watcher measures in the next frame, all together. */
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/** happy-dom has no layout: stand in for the measures a browser would give. */
function measures(element: Element, scroll: number, client: number) {
  Object.defineProperty(element, "scrollWidth", { value: scroll, configurable: true });
  Object.defineProperty(element, "clientWidth", { value: client, configurable: true });
}

const DS1 = join(import.meta.dirname, "../DS1");
function files(dir: string, found: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "generated" || name === "x-icon" || name === "node_modules") continue;
    if (statSync(path).isDirectory()) files(path, found);
    else if (/\.(css|ts)$/.test(name)) found.push(path);
  }
  return found;
}

test("no DS1 stylesheet ends cut words with an ellipsis", () => {
  const offenders = files(DS1)
    .filter(path => /text-overflow:\s*ellipsis/.test(readFileSync(path, "utf8")))
    .map(path => relative(DS1, path));
  expect(offenders).toEqual([]);
});

test("every fade is the one rule: a mask over the last square, only where marked cut", () => {
  const fade = "mask-image: linear-gradient(to right, #000 calc(100% - var(--ds-unit)), transparent)";
  for (const path of ["1-root/controls.css", "1-root/row.css", "2-core/styles/ds-text.css", "2-core/styles/ds-tag.css", "3-unit/styles/ds-calendar.css", "3-unit/styles/ds-sidebar.css"]) {
    const css = readFileSync(join(DS1, path), "utf8");
    expect(css, path).toContain(fade);
    expect(css, path).toContain("mask-image: linear-gradient(to left, #000 calc(100% - var(--ds-unit)), transparent)");
    // The fade is drawn only under the mark.
    for (const rule of css.match(/[^{}]+\{[^}]*mask-image: linear-gradient\(to (right|left), #000 calc\(100% - var\(--ds-unit\)\)[^}]*\}/g) ?? []) {
      expect(rule.slice(0, rule.indexOf("{")), path).toContain('[data-cut="end"]');
    }
  }
});

test("a literal ds-text wider than its box is marked cut, and loses the mark when it fits", async () => {
  const text = document.createElement("ds-text");
  text.literal = true;
  text.textContent = "Patriksson Grove and the long way round";
  document.body.append(text);
  await text.updateComplete;
  measures(text, 240, 120);
  text.requestUpdate();
  await text.updateComplete;
  await frame();
  expect(text.getAttribute("data-cut")).toBe("end");
  measures(text, 120, 120);
  text.text = "Short";
  await text.updateComplete;
  await frame();
  expect(text.hasAttribute("data-cut")).toBe(false);
});

test("a translated ds-text is never measured: only words someone wrote are cut", async () => {
  const text = document.createElement("ds-text");
  text.text = "Save";
  document.body.append(text);
  measures(text, 240, 120);
  text.requestUpdate();
  await text.updateComplete;
  await frame();
  expect(text.hasAttribute("data-cut")).toBe(false);
});

test("a row's slotted ds-text literal name is marked cut by the row and the text alike", async () => {
  document.body.innerHTML = `<ds-row href="/people/1"><ds-text class="ds-row__name" literal>Patriksson Grove</ds-text><span class="ds-row__value">Oct</span></ds-row>`;
  const row = document.querySelector("ds-row")!;
  const name = row.querySelector<HTMLElement & { updateComplete: Promise<unknown> }>(".ds-row__name")!;
  await row.updateComplete;
  measures(name, 200, 80);
  row.requestUpdate();
  await row.updateComplete;
  await frame();
  expect(name.getAttribute("data-cut")).toBe("end");
  measures(name, 80, 80);
  row.requestUpdate();
  await row.updateComplete;
  await frame();
  expect(name.hasAttribute("data-cut")).toBe(false);
});

test("tags may fade but button labels never do", async () => {
  document.body.innerHTML = `<ds-tag>A very long tag</ds-tag><ds-button primary text="Publish everything"></ds-button>`;
  const tag = document.querySelector("ds-tag") as HTMLElement & { updateComplete: Promise<unknown>; requestUpdate(): void };
  const button = document.querySelector("ds-button") as HTMLElement & { updateComplete: Promise<unknown>; requestUpdate(): void };
  await tag.updateComplete;
  await button.updateComplete;
  const words = tag.shadowRoot!.querySelector(".words")!;
  const label = button.shadowRoot!.querySelector('[part="control"] > ds-text')!;
  measures(words, 200, 80);
  measures(label, 200, 80);
  tag.requestUpdate();
  button.requestUpdate();
  await tag.updateComplete;
  await button.updateComplete;
  await frame();
  expect(words.getAttribute("data-cut")).toBe("end");
  expect(tag.shadowRoot!.querySelector(".frame")!.hasAttribute("data-cut")).toBe(false);
  expect(label.hasAttribute("data-cut")).toBe(false);
  expect(button.shadowRoot!.querySelector('[part="control"]')!.hasAttribute("data-cut")).toBe(false);
});

test("the watcher marks what a selector finds at each measure, and lets go when disconnected", async () => {
  document.body.innerHTML = `<p class="words">One</p>`;
  const watcher = watchCuts();
  watcher.select(document.body, ".words");
  const first = document.querySelector(".words")!;
  expect(first.hasAttribute("data-cut")).toBe(false);
  measures(first, 100, 50);
  const second = document.createElement("p");
  second.className = "words";
  measures(second, 100, 50);
  document.body.append(second);
  watcher.measure();
  // Nothing is read until the frame, where every watcher measures together.
  expect(first.hasAttribute("data-cut")).toBe(false);
  await frame();
  expect(first.getAttribute("data-cut")).toBe("end");
  expect(second.getAttribute("data-cut")).toBe("end");
  watcher.disconnect();
  measures(first, 50, 50);
  watcher.measure();
  await frame();
  expect(first.getAttribute("data-cut")).toBe("end");
});

test("markCut leaves a sheet's start mark to the sheet", () => {
  const cell = document.createElement("span");
  cell.setAttribute("data-cut", "start");
  measures(cell, 50, 50);
  expect(markCut(cell)).toBe(false);
  expect(cell.getAttribute("data-cut")).toBe("start");
});

test("a page without Lit marks DS1's native classes, and stops when asked", () => {
  document.body.innerHTML = `<div class="ds-row"><span class="ds-row__name">A record's long name</span></div><button class="ds-menu__item">An entry</button><p class="other">Not DS1's</p>`;
  const name = document.querySelector(".ds-row__name")!;
  const item = document.querySelector(".ds-menu__item")!;
  const other = document.querySelector(".other")!;
  for (const element of [name, item, other]) measures(element, 200, 100);
  const stop = startCutFades();
  expect(name.getAttribute("data-cut")).toBe("end");
  expect(item.getAttribute("data-cut")).toBe("end");
  expect(other.hasAttribute("data-cut")).toBe(false);
  stop();
  expect(CUT_FADE_SELECTOR).toContain(".ds-sidebar__label");
});
