// @vitest-environment node
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Dialog, DialogContent, DialogTitle } from "../DS1/react/dialog";

test("server rendering needs no DOM and never exposes a non-modal open dialog", () => {
  expect(typeof globalThis.HTMLElement).toBe("undefined");
  const output = renderToString(h(Dialog, { open: true }, h(DialogContent, null, h(DialogTitle, null, "Example"))));
  expect(output).toContain("<ds-dialog><dialog");
  expect(output).not.toMatch(/<dialog[^>]*\bopen/);
  expect(output).toContain(">Example</h2>");
  expect(renderToString(h(Dialog, { open: false }, h(DialogContent, null, "Hidden")))).toBe("");
});
