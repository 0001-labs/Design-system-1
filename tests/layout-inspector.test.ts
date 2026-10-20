// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import { createLayoutInspector } from "../DS1/0-face/layout-inspector";

afterEach(() => document.body.replaceChildren());

function place(element: HTMLElement, top: number, width: number, height: number) {
  element.getBoundingClientRect = () => ({ top, left: 20, width, height, right: 20 + width, bottom: top + height, x: 20, y: top, toJSON() {} }) as DOMRect;
}

test("draws named areas, text and components with their tag names", async () => {
  document.body.innerHTML = `<header data-ds-area="header"><h1>General settings</h1><ds-select><select><option>Monday</option></select></ds-select></header>`;
  const header = document.querySelector<HTMLElement>("header")!;
  const title = document.querySelector<HTMLElement>("h1")!;
  const select = document.querySelector<HTMLElement>("ds-select")!;
  place(header, 40, 400, 120);
  place(title, 60, 400, 40);
  place(select, 120, 120, 20);
  const inspector = createLayoutInspector();
  inspector.toggle();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const layer = document.querySelector("[data-ds-layout-overlay]")!.shadowRoot!;
  expect(layer.querySelector(".area .tag")?.firstChild?.textContent).toBe("Header");
  expect(layer.querySelectorAll(".text")).toHaveLength(1);
  expect(layer.querySelector(".component .tag")?.textContent).toBe("ds-select");
  inspector.hide();
  expect(layer.querySelectorAll(".box")).toHaveLength(0);
});
