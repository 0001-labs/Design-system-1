// @vitest-environment happy-dom
import { expect, it } from "vite-plus/test";
import { connectLibraryStyles } from "../DS1/0-face/library-styles";
it("replaces the snapshot only after a successful stylesheet load and cleans up", () => {
  const stop = connectLibraryStyles({ url: "https://example.com/latest.css", fallback: ":root { --ink: black; }" });
  const fallback = document.querySelector<HTMLStyleElement>('[data-design-library="fallback"]')!;
  const published = document.querySelector<HTMLLinkElement>('[data-design-library="published"]')!;
  expect(fallback.textContent).toContain("--ink: black");
  published.dispatchEvent(new Event("load"));
  expect(fallback.disabled).toBe(true);
  published.dispatchEvent(new Event("error"));
  expect(fallback.disabled).toBe(false);
  stop();
  expect(document.querySelector('[data-design-library]')).toBeNull();
});
