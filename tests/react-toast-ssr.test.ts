// @vitest-environment node
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { Toaster, toast } from "../DS1/react/toast";
test("the toast adapter renders and accepts calls without browser globals", () => {
  expect(typeof HTMLElement).toBe("undefined");
  const html = renderToString(createElement(Toaster, { position: "bottom-center", visibleToasts: 3, expand: true }));
  expect(html).toContain("<ds-toast");
  expect(html).toContain('position="bottom-center"');
  expect(toast("Saved", { id: "saved" })).toBe("saved");
  expect(typeof toast.error("Failed")).toBe("string");
  expect(toast.dismiss()).toBeUndefined();
});
