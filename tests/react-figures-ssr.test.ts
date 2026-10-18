// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Progress } from "../DS1/react/progress";
import { Stat } from "../DS1/react/stat";

const plain = (text: string) => text.replace(/[  ]/g, " ");

test("the stat adapter writes its label, figure and caption in the light DOM without browser globals", () => {
  expect(typeof HTMLElement).toBe("undefined");
  const stat = renderToString(createElement(Stat, { label: "Revenue", value: 1234.5, format: "money", currency: "EUR", change: 0.12, changeFormat: "percent", caption: "Since last month" }));
  expect(stat).toContain("<ds-stat");
  expect(stat).toContain('<span slot="label">Revenue</span>');
  expect(stat).toContain('<span slot="figure">€1,234.50</span>');
  expect(stat).toContain('<span slot="caption">Since last month</span>');
  expect(stat).toContain('change-format="percent"');
  // A server answering a request writes the figure in the request's language.
  expect(plain(renderToString(createElement(Stat, { value: 1234.5, language: "da" })))).toContain('<span slot="figure">1.234,5</span>');
  expect(renderToString(createElement(Stat, { label: "Month ends at", figure: "Incomplete" }))).toContain('<span slot="figure">Incomplete</span>');
  const cells = renderToString(createElement(Stat, { value: 1204, cells: true }));
  expect(cells).toContain("1,204</span>");
  expect(cells.match(/display:inline-block/g)).toHaveLength(4);
});

test("the progress adapter puts a value's role and values in the markup from the first render", () => {
  const meter = renderToString(createElement(Progress, { label: "Spent", value: 12, max: 10 }));
  expect(meter).toContain('role="meter"');
  expect(meter).toContain('aria-valuenow="10"');
  expect(meter).toContain('aria-valuemin="0"');
  expect(meter).toContain('aria-valuemax="10"');
  expect(meter).toContain('aria-valuetext="12 of 10, over by 2"');
  expect(meter).toContain('aria-label="Spent"');
  expect(renderToString(createElement(Progress, { value: 3, max: 4, valuetext: "Three of four" }))).toContain('aria-valuetext="Three of four"');
});

test("the steps adapter slots each step's body under it in a vertical sequence", () => {
  const steps = renderToString(createElement(Progress, { steps: ["Apply", "Connect"], current: 2, vertical: true, bodies: [null, createElement("p", null, "Connect an account.")] }));
  expect(steps).toContain("<ds-progress");
  expect(steps).toContain('<div slot="step-2" style="display:contents"><p>Connect an account.</p></div>');
  expect(steps).not.toContain('slot="step-1"');
});
