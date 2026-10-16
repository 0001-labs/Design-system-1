// @vitest-environment edge-runtime
import { expect, test } from "vite-plus/test";
import {
  formatDate,
  formatList,
  formatMoney,
  formatRelativeTime,
  localeTag,
} from "../DS1/0-face/format";

// A Worker's runtime: no window, no document, no localStorage
test("formats in a Worker's runtime, in the language a request names", () => {
  expect(typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime).toBe("string");
  expect(typeof (globalThis as { document?: unknown }).document).toBe("undefined");
  expect(localeTag("ja")).toBe("ja-JP");
  expect(formatMoney(1999, "USD", { minor: true, language: "en" })).toBe("$19.99");
  expect(formatDate("2026-10-17", { language: "da" })).toBe("17. okt. 2026");
  expect(formatList(["A", "B"], { language: "da" })).toBe("A og B");
  const now = Date.UTC(2026, 9, 17, 10);
  expect(formatRelativeTime(now - 3 * 60_000, { now, language: "en" })).toBe("3 minutes ago");
});
