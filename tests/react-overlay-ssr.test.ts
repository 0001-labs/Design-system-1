// @vitest-environment node
import { createElement as h } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Overlay, OverlayContent, OverlayTitle } from "../DS1/react/overlay";

test("server rendering needs no DOM and leaves modal portals for the client", () => {
  expect(typeof globalThis.HTMLElement).toBe("undefined");
  const output = renderToString(h(Overlay, { open: true }, h(OverlayContent, null, h(OverlayTitle, null, "Example"))));
  expect(output).toBe("");
  expect(renderToString(h(Overlay, { open: false }, h(OverlayContent, null, "Hidden")))).toBe("");
});
