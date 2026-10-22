// @vitest-environment happy-dom
import { expect, test } from "vite-plus/test";
import { initGridShortcut } from "../DS1/0-face/grid";

const press = (key: string, times = 1, target: EventTarget = window) => {
  for (let i = 0; i < times; i += 1) target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, composed: true }));
};
const gridShown = () => document.documentElement.hasAttribute("data-ds-grid-visible");
const layoutShown = () => [...document.body.children].some(el => el.hasAttribute("data-ds-layout-overlay") && !(el as HTMLElement).hidden);

initGridShortcut();

test("five presses of G show the grid and five more hide it; four do nothing", () => {
  press("g", 4);
  expect(gridShown()).toBe(false);
  press("Escape");
  press("g", 5);
  expect(gridShown()).toBe(true);
  press("g", 5);
  expect(gridShown()).toBe(false);
});

test("another key between the presses starts the count again", () => {
  press("g", 3);
  press("x");
  press("g", 2);
  expect(gridShown()).toBe(false);
  press("x");
});

test("five presses of L toggle the layout inspector, and Escape hides it", () => {
  const before = document.body.innerHTML;
  press("l", 5);
  expect(document.body.innerHTML).not.toBe(before);
  press("Escape");
  expect(layoutShown()).toBe(false);
});

test("presses typed into a field never count", () => {
  const field = document.createElement("input");
  document.body.append(field);
  press("g", 5, field);
  expect(gridShown()).toBe(false);
  field.remove();
});
