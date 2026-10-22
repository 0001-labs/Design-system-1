// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { inspectConstraints } from "../DS1/0-face/constraints";
import { initConstraintShortcut } from "../DS1/0-face/constraint-panel";

type Box = { left: number; top: number; width: number; height: number };
/** Draws an element at a place, as a browser would measure it. */
const at = (element: Element, { left, top, width, height }: Box) => {
  element.getBoundingClientRect = () => ({ left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) }) as DOMRect;
};
const card = (left: number, picture: Box, radius = "0px") => {
  const element = document.createElement("div");
  element.className = "ds-card";
  element.innerHTML = `<div class="ds-card__media"><img alt="" style="border-radius: ${radius}"></div>`;
  at(element, { left, top: 0, width: 280, height: 400 });
  at(element.querySelector("img")!, picture);
  return element;
};
const press = (key: string, times = 1) => {
  for (let i = 0; i < times; i += 1) window.dispatchEvent(new KeyboardEvent("keydown", { key }));
};
const panel = () => document.querySelector<HTMLElement>("[data-ds-constraint-panel]");

afterEach(() => { document.body.replaceChildren(); document.documentElement.removeAttribute("data-ds-owner"); });

test("cards side by side whose pictures stand on the foot at one level keep every rule", () => {
  const row = document.createElement("div");
  row.append(card(0, { left: 20, top: 160, width: 240, height: 240 }), card(300, { left: 320, top: 160, width: 240, height: 240 }));
  document.body.append(row);
  expect(inspectConstraints()).toEqual([]);
});

test("a picture above the foot, and one lower than the picture beside it, break card.media-level", () => {
  const row = document.createElement("div");
  row.append(card(0, { left: 20, top: 120, width: 240, height: 240 }), card(300, { left: 320, top: 200, width: 240, height: 200 }));
  document.body.append(row);
  const found = inspectConstraints().filter(f => f.constraint.code === "card.media-level").map(f => f.message);
  expect(found).toEqual([
    "The picture stands 40px above the card's foot.",
    "The picture starts 80px lower than the one in the first card beside it.",
  ]);
});

test("a picture rounded where it meets the card's foot breaks card.media-corners; a free corner may stay round", () => {
  document.body.append(card(0, { left: 20, top: 160, width: 240, height: 240 }, "8px"));
  const found = inspectConstraints().filter(f => f.constraint.code === "card.media-corners").map(f => f.message);
  expect(found).toEqual(["The picture's bottom right and bottom left corners are rounded where it meets the card."]);
});

test("five presses of C open the panel with what the page breaks, for the owner alone", () => {
  initConstraintShortcut();
  document.body.append(card(0, { left: 20, top: 120, width: 240, height: 240 }));
  press("c", 5);
  expect(panel()).toBeNull();
  document.documentElement.setAttribute("data-ds-owner", "");
  press("c", 4);
  expect(panel()).toBeNull();
  press("x");
  press("c", 5);
  expect(panel()!.hidden).toBe(false);
  const items = panel()!.shadowRoot!.querySelectorAll("[data-findings] li");
  expect(items).toHaveLength(1);
  expect(items[0]!.textContent).toContain("card.media-level");
  expect(panel()!.shadowRoot!.querySelectorAll(".ring")).toHaveLength(1);
  press("Escape");
  expect(panel()!.hidden).toBe(true);
});

test("on a site without sign-in, ?ds-owner=on switches this browser on as the owner's and ?ds-owner=off forgets it", async () => {
  const { isPageOwner } = await import("../DS1/0-face/constraint-panel");
  localStorage.clear();
  expect(isPageOwner()).toBe(false);
  localStorage.setItem("ds-owner", "on");
  expect(isPageOwner()).toBe(true);
  localStorage.removeItem("ds-owner");
  history.replaceState(null, "", "/?ds-owner=on");
  expect(isPageOwner()).toBe(true);
  history.replaceState(null, "", "/");
  expect(isPageOwner()).toBe(false);
});

test("a page wider than its window is found at the outermost piece that passes the edge, not inside a scroller", () => {
  const width = document.documentElement.clientWidth || window.innerWidth;
  const wide = document.createElement("section");
  wide.innerHTML = "<p>Words</p>";
  at(wide, { left: 0, top: 0, width: width + 40, height: 100 });
  at(wide.querySelector("p")!, { left: 0, top: 0, width: width + 40, height: 20 });
  const scroller = document.createElement("div");
  scroller.style.overflowX = "auto";
  scroller.innerHTML = "<div>Slides</div>";
  at(scroller, { left: 0, top: 100, width, height: 100 });
  at(scroller.firstElementChild!, { left: 0, top: 100, width: width * 3, height: 100 });
  document.body.append(wide, scroller);
  const found = inspectConstraints().filter(f => f.constraint.code === "page.window-width");
  expect(found.map(f => f.element)).toEqual([wide]);
  expect(found[0]!.message).toBe(`It reaches 40px past the window's right edge, in a window ${width}px wide.`);
});
