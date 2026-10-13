// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";

afterEach(() => { delete window.DS_ONE_PREFERENCES; localStorage.clear(); vi.restoreAllMocks(); });

test("shared theme starts from a product's existing storage without rewriting it", async () => {
  vi.resetModules();
  window.DS_ONE_PREFERENCES = { themeStorageKey: "product:theme" };
  localStorage.setItem("product:theme", "dark");
  localStorage.setItem("ds-one:theme", "light");
  const { currentTheme, setTheme } = await import("../DS1/0-face/theme");
  expect(currentTheme.get()).toBe("dark");
  expect(document.documentElement.classList.contains("dark-theme")).toBe(true);
  setTheme("light");
  expect(localStorage.getItem("product:theme")).toBe("light");
  expect(localStorage.getItem("ds-one:theme")).toBe("light");
});

test("blocked storage does not prevent the shared theme from mounting", async () => {
  vi.resetModules();
  vi.spyOn(window.localStorage, "getItem").mockImplementation(() => { throw new Error("Unavailable"); });
  const { currentTheme } = await import("../DS1/0-face/theme");
  expect(["light", "dark"]).toContain(currentTheme.get());
});
