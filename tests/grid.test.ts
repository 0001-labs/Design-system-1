// @vitest-environment happy-dom
import { afterEach, expect, test } from "vite-plus/test";
import type { Grid } from "../DS1/4-page/ds-grid";
await import("../DS1/4-page/ds-grid");

afterEach(() => document.body.replaceChildren());
async function setup(attributes: Record<string, string> = {}) {
  const grid = document.createElement("ds-grid") as Grid;
  for (const [name, value] of Object.entries(attributes)) grid.setAttribute(name, value);
  document.body.append(grid); await grid.updateComplete;
  return grid;
}
function paper(grid: Grid) { return grid.shadowRoot!.querySelector<HTMLElement>(".paper")!; }

test("existing alignment-only markup remains a square overlay", async () => {
  const grid = await setup({align: "left"});
  expect(grid.contained).toBe(false); expect(grid.align).toBe("left");
  expect(paper(grid).dataset.pattern).toBe("grid");
  expect(paper(grid).style.getPropertyValue("--pitch-x")).toBe("20px");
  expect(paper(grid).style.getPropertyValue("--pitch-y")).toBe("20px");
  expect(paper(grid).getAttribute("aria-hidden")).toBe("true");
  expect(grid.shadowRoot!.querySelector("button, input, a, [tabindex]")).toBeNull();
});

test("pattern and colour changes update independent instances and restore inherited defaults", async () => {
  const first = await setup({contained: "", pattern: "lines", color: "var(--ds-sharp-blue)", paper: "pink"});
  const second = await setup({pattern: "dots"});
  expect(first.contained).toBe(true);
  expect(paper(first).dataset.pattern).toBe("lines"); expect(paper(second).dataset.pattern).toBe("dots");
  expect(paper(first).style.getPropertyValue("--ink")).toBe("var(--ds-sharp-blue)");
  first.pattern = "none"; await first.updateComplete;
  expect(paper(first).dataset.pattern).toBe("none"); expect(paper(first).style.getPropertyValue("--paper")).toBe("pink");
  first.removeAttribute("color"); first.removeAttribute("paper"); await first.updateComplete;
  expect(paper(first).style.getPropertyValue("--ink")).toContain("var(--ds-grid-color,");
  expect(paper(first).style.getPropertyValue("--paper")).toBe("var(--ds-grid-paper, transparent)");
  expect(paper(second).dataset.pattern).toBe("dots");
});

test("row density is independent, while invalid spacing falls back to a usable grid", async () => {
  const grid = await setup({size: "10", "row-size": "30"});
  expect(paper(grid).style.getPropertyValue("--pitch-x")).toBe("10px");
  expect(paper(grid).style.getPropertyValue("--pitch-y")).toBe("30px");
  grid.removeAttribute("row-size"); await grid.updateComplete;
  expect(paper(grid).style.getPropertyValue("--pitch-y")).toBe("10px");
  grid.setAttribute("size", "-20"); grid.setAttribute("row-size", "NaN"); grid.setAttribute("pattern", "unknown"); await grid.updateComplete;
  expect(paper(grid).dataset.pattern).toBe("grid");
  expect(paper(grid).style.getPropertyValue("--pitch-x")).toBe("20px");
  expect(paper(grid).style.getPropertyValue("--pitch-y")).toBe("20px");
});
