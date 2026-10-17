// @vitest-environment happy-dom
import { readFileSync } from "node:fs";
import { afterEach, expect, test } from "vite-plus/test";
await import("../DS1/3-unit/ds-menu");
afterEach(() => document.body.replaceChildren());

const rule = (css: string, selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start, selector).toBeGreaterThan(-1);
  return css.slice(start, css.indexOf("}", start));
};

test("a floating menu takes whole squares: its width rounds up, the height it may take rounds down", async () => {
  const menu = document.createElement("ds-menu");
  menu.anchor = new DOMRect(40, 16, 93, 20);
  menu.floating = menu.open = true;
  menu.innerHTML = '<button role="menuitem">Choice</button>';
  document.body.append(menu);
  await menu.updateComplete;
  const width = parseFloat(menu.style.getPropertyValue("--ds-menu-anchor-width"));
  const height = parseFloat(menu.style.getPropertyValue("--ds-menu-available-height"));
  expect(width).toBe(100);
  expect(height % 20).toBe(0);
  expect(height).toBeGreaterThan(0);
  expect(parseFloat(menu.style.maxWidth) % 20).toBe(0);
});

test("the menu box is half a square inside its line, with no shadow, the element and the native class alike", () => {
  const element = rule(readFileSync("DS1/3-unit/styles/ds-menu.css", "utf8"), ".frame");
  const native = rule(readFileSync("DS1/1-root/controls.css", "utf8"), ".ds-menu");
  for (const block of [element, native]) {
    expect(block).toContain("padding: calc(var(--ds-unit) / 2 - 1px);");
    expect(block).toContain("border: 1px solid");
    expect(block).toMatch(/box-shadow: none;/);
    expect(block).toMatch(/gap: 0;/);
  }
});

test("entries are one row whatever button styles surround them", () => {
  const element = readFileSync("DS1/3-unit/styles/ds-menu.css", "utf8");
  const native = readFileSync("DS1/1-root/controls.css", "utf8");
  const button = readFileSync("DS1/2-core/styles/ds-button.css", "utf8");
  expect(element).toMatch(/::slotted\(:is\(button, a, \[role="option"\], \[role\^="menuitem"\]\):not\(ds-button, ds-file-picker\)\) \{[^}]*height: var\(--ds-menu-row\) !important;/);
  expect(native).toMatch(/\.ds-menu > :is\(button, a, \[role="option"\], \[role\^="menuitem"\]\),[^{]*\{[^}]*height: var\(--ds-row-height\) !important;/);
  expect(button).toMatch(/:host\(:is\(\[menu-item\], \[role="option"\], \[role\^="menuitem"\]\)\) :is\(button, a\) \{[^}]*height: var\(--ds-button-height, var\(--ds-row-height\)\);/);
});
