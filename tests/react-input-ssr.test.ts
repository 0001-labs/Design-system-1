// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Input } from "../DS1/react/input";
import { MenuHost as Menu } from "../DS1/react/menu-engine";
test("a menu adapter renders without browser element globals", () => {
  expect(typeof globalThis.HTMLElement).toBe("undefined");
  const markup = renderToString(createElement(Menu, {open: false, role: "menu"}, createElement("button", {role: "menuitem"}, "Choice")));
  expect(markup).toContain("<ds-menu");
  expect(markup).toContain('role="menuitem"');
});
test("the React adapter renders without importing browser element globals", () => {
  expect(typeof globalThis.HTMLElement).toBe("undefined");
  const markup = renderToString(
    createElement(Input, {
      name: "email",
      type: "email",
      value: "reader@example.com",
      required: true,
      "aria-invalid": false,
    }),
  );
  expect(markup).toContain("<ds-input");
  expect(markup).toContain('value="reader@example.com"');
  expect(markup).toContain('aria-invalid="false"');
});

test("the multiline adapter also renders without browser globals", () => {
  const markup = renderToString(
    createElement(Input, {
      multiline: true,
      name: "description",
      value: "Two\nlines",
      rows: 2,
      autoGrow: true,
      maxRows: 6,
    }),
  );
  expect(markup).toContain("<ds-input");
  expect(markup).toContain('multiline=""');
  expect(markup).toContain('rows="2"');
  expect(markup).toContain('max-rows="6"');
});

test("the label, its translation key and the other words reach the element as its own attributes", () => {
  const markup = renderToString(
    createElement(Input, {
      name: "amount",
      label: "Amount",
      labelText: "Amount",
      placeholderKey: "Amount, in kroner",
      error: "Too much",
      errorText: "Too much",
    }),
  );
  expect(markup).toContain('label="Amount"');
  expect(markup).toContain('label-text="Amount"');
  expect(markup).toContain('placeholder-key="Amount, in kroner"');
  expect(markup).toContain('error-text="Too much"');
  expect(markup).not.toMatch(/labelText|placeholderKey|errorText/i);
  const multiline = renderToString(createElement(Input, { multiline: true, label: "Notes", labelText: "Notes" }));
  expect(multiline).toContain('label="Notes"');
  expect(multiline).toContain('label-text="Notes"');
});
