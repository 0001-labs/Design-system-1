import { expect, test } from "vite-plus/test";
import { anchoredPanel } from "../DS1/0-face/anchored-panel";
const viewport = { left: 0, top: 0, width: 393, height: 812 };
const rect = { left: 160, right: 220, width: 60, top: 100, bottom: 120 };
test("centred below keeps exactly four CSS pixels from the field", () => {
  const p = anchoredPanel(rect, { width: 200, height: 300 }, viewport);
  expect(p.left).toBe(90); expect(p.top - rect.bottom).toBe(4);
});
test("edges shift sideways, prefer above when below cannot fit, and bound to the keyboard viewport", () => {
  const p = anchoredPanel({ ...rect, left: 0, right: 60, top: 700, bottom: 720 }, { width: 200, height: 300 }, viewport);
  expect(p.left).toBe(4); expect(700 - p.top - 300).toBe(4);
  const keyboard = anchoredPanel(rect, { width: 200, height: 600 }, { ...viewport, top: 30, height: 250 });
  expect(keyboard.top).toBe(124); expect(keyboard.availableHeight).toBe(152);
});
