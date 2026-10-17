// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { applyScaling, calculateScalingFactor, defaultScalingConfig, detectMobileDevice, startScaling, toDevicePixel, toLayoutStep } from "../DS1/0-face/scaling";

const PHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const COMPUTER = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const root = document.documentElement;

function screen(agent: string, width: number, pixelRatio = 1) {
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(agent);
  Object.defineProperty(root, "clientWidth", { configurable: true, get: () => width });
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, get: () => pixelRatio });
}

afterEach(() => {
  vi.restoreAllMocks();
  delete (root as { clientWidth?: number }).clientWidth;
  delete (window as { devicePixelRatio?: number }).devicePixelRatio;
  root.style.removeProperty("--sf");
  root.removeAttribute("data-mobile");
});

test("a phone scales by its width over 280, between 0.75 and 2", () => {
  expect(calculateScalingFactor(375)).toBe(1.339);
  expect(calculateScalingFactor(140)).toBe(0.75);
  expect(calculateScalingFactor(1200)).toBe(2);
  expect(calculateScalingFactor(375, { ...defaultScalingConfig, mode: "fixed" })).toBe(1);
});

test("snapping puts a square on whole layout steps or whole device pixels", () => {
  const layout = calculateScalingFactor(375, { ...defaultScalingConfig, snap: "layout" });
  expect(Number.isInteger(Math.round(layout * 20 * 64 * 1e9) / 1e9)).toBe(true);
  expect(layout).toBe(toLayoutStep(375 / 280));
  const pixel = calculateScalingFactor(375, { ...defaultScalingConfig, snap: "pixel" }, 3);
  expect(Math.round(pixel * 20 * 3 * 1e9) / 1e9).toBe(80);
  expect(pixel).toBeLessThanOrEqual(375 / 280);
  expect(toDevicePixel(375 / 280, 0)).toBe(toDevicePixel(375 / 280, 1));
});

test("a computer stays at 1 however narrow its window, without data-mobile", () => {
  screen(COMPUTER, 400);
  expect(detectMobileDevice()).toBe(false);
  expect(applyScaling()).toBe(1);
  expect(root.style.getPropertyValue("--sf")).toBe("1");
  expect(root.hasAttribute("data-mobile")).toBe(false);
});

test("a phone gets its scale and data-mobile on the root, snapped when asked", () => {
  screen(PHONE, 375, 3);
  expect(applyScaling()).toBe(1.339);
  expect(root.style.getPropertyValue("--sf")).toBe("1.339");
  expect(root.hasAttribute("data-mobile")).toBe(true);
  expect(applyScaling({ snap: "layout" })).toBe(toLayoutStep(375 / 280));
  const surface = document.createElement("div");
  applyScaling({ root: surface, snap: "pixel" });
  expect(Number(surface.style.getPropertyValue("--sf")) * 60).toBeCloseTo(80, 9);
  expect(surface.hasAttribute("data-mobile")).toBe(true);
});

test("startScaling follows resizes and turns until stopped", () => {
  let width = 375;
  vi.spyOn(navigator, "userAgent", "get").mockReturnValue(PHONE);
  Object.defineProperty(root, "clientWidth", { configurable: true, get: () => width });
  const stop = startScaling();
  expect(root.style.getPropertyValue("--sf")).toBe("1.339");
  width = 560; window.dispatchEvent(new Event("resize"));
  expect(root.style.getPropertyValue("--sf")).toBe("2");
  width = 280; window.dispatchEvent(new Event("orientationchange"));
  expect(root.style.getPropertyValue("--sf")).toBe("1");
  stop();
  width = 420; window.dispatchEvent(new Event("resize"));
  expect(root.style.getPropertyValue("--sf")).toBe("1");
});

function surfaceOf(width: () => number): HTMLElement {
  const surface = document.createElement("div");
  Object.defineProperty(surface, "clientWidth", { configurable: true, get: width });
  document.body.append(surface);
  return surface;
}

test("a surface scales to its own width on a computer, with the same rule and snapping", () => {
  screen(COMPUTER, 1440, 3);
  const surface = surfaceOf(() => 390);
  expect(applyScaling({ surface })).toBe(calculateScalingFactor(390));
  expect(surface.style.getPropertyValue("--sf")).toBe(String(calculateScalingFactor(390)));
  // Shared components inside take the same scale.
  expect(surface.style.getPropertyValue("--ds-sf")).toBe(String(calculateScalingFactor(390)));
  // The page and data-mobile are left alone.
  expect(root.style.getPropertyValue("--sf")).toBe("");
  expect(surface.hasAttribute("data-mobile")).toBe(false);
  const snapped = applyScaling({ surface, snap: "pixel" });
  expect(snapped).toBe(toDevicePixel(390 / 280, 3));
  expect(Math.round(snapped * 20 * 3 * 1e9) / 1e9).toBe(83);
  const target = document.createElement("div");
  applyScaling({ surface, root: target, snap: "layout" });
  expect(target.style.getPropertyValue("--sf")).toBe(String(toLayoutStep(390 / 280)));
  surface.remove();
});

test("surface: true scales every data-ds-surface element to its own width", () => {
  screen(COMPUTER, 1440);
  const phone = surfaceOf(() => 375);
  const wide = surfaceOf(() => 560);
  phone.setAttribute("data-ds-surface", "");
  wide.setAttribute("data-ds-surface", "");
  expect(applyScaling({ surface: true })).toBe(1.339);
  expect(phone.style.getPropertyValue("--sf")).toBe("1.339");
  expect(wide.style.getPropertyValue("--sf")).toBe("2");
  expect(root.style.getPropertyValue("--sf")).toBe("");
  phone.remove();
  wide.remove();
});

test("startScaling follows a surface as its size changes, until stopped", () => {
  screen(COMPUTER, 1440);
  const observed: Array<() => void> = [];
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { observed.push(callback); }
    observe() {}
    disconnect() { disconnect(); }
  });
  let width = 375;
  const surface = surfaceOf(() => width);
  const stop = startScaling({ surface });
  expect(surface.style.getPropertyValue("--sf")).toBe("1.339");
  width = 280;
  observed[0]?.();
  expect(surface.style.getPropertyValue("--sf")).toBe("1");
  width = 420;
  window.dispatchEvent(new Event("resize"));
  expect(surface.style.getPropertyValue("--sf")).toBe("1.5");
  stop();
  expect(disconnect).toHaveBeenCalled();
  width = 560;
  window.dispatchEvent(new Event("resize"));
  expect(surface.style.getPropertyValue("--sf")).toBe("1.5");
  vi.unstubAllGlobals();
  surface.remove();
});

test("the device module applies the same rule and reports it", async () => {
  screen(PHONE, 420);
  const device = await import("../DS1/0-face/device");
  expect(device.detectMobileDevice).toBe(detectMobileDevice);
  const changed = vi.fn();
  window.addEventListener("scaling-changed", changed);
  device.updateScalingFactor();
  window.removeEventListener("scaling-changed", changed);
  expect(device.scalingFactor.get()).toBe(1.5);
  expect(root.style.getPropertyValue("--sf")).toBe("1.5");
  expect(root.hasAttribute("data-mobile")).toBe(true);
  expect(changed.mock.calls.at(-1)?.[0].detail.scalingFactor).toBe(1.5);
});
