// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Input, Textarea } from "../DS1/react/input";
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
    createElement(Textarea, {
      name: "description",
      value: "Two\nlines",
      rows: 2,
      autoGrow: true,
      maxRows: 6,
    }),
  );
  expect(markup).toContain("<ds-textarea");
  expect(markup).toContain('rows="2"');
  expect(markup).toContain('max-rows="6"');
});
