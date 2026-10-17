// @vitest-environment happy-dom
import { afterEach, beforeAll, expect, test, vi } from "vite-plus/test";
import { LONG_PRESS_DELAY, TOUCH_TOOLTIP_DURATION, hideTooltip, initTooltips, showTooltip } from "../DS1/0-face/tooltips";

const bubble = () => document.querySelector<HTMLElement>("[data-ds-tooltip]")!;
const visible = () => bubble().classList.contains("is-visible");

function element(text: string, tag = "button"): HTMLElement {
  const node = document.createElement(tag);
  node.dataset.tooltip = text;
  document.body.append(node);
  return node;
}

function pointer(target: Element, type: string, init: PointerEventInit = {}) {
  target.dispatchEvent(new PointerEvent(type, { bubbles: true, composed: true, pointerId: 1, ...init }));
}

beforeAll(() => {
  // The module installs itself on import; a second call changes nothing.
  initTooltips();
  expect(document.querySelectorAll("[data-ds-tooltip]")).toHaveLength(1);
});

afterEach(() => {
  hideTooltip();
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.querySelectorAll("button, span").forEach((node) => node.remove());
});

test("hover with a mouse shows the tooltip at once, and leaving hides it", () => {
  const save = element("Save");
  pointer(save, "pointerover", { pointerType: "mouse" });
  expect(visible()).toBe(true);
  expect(bubble().textContent).toBe("Save");
  expect(save.getAttribute("aria-describedby")).toBe("ds-tooltip");
  pointer(document.body, "pointerover", { pointerType: "mouse" });
  expect(visible()).toBe(false);
  expect(save.hasAttribute("aria-describedby")).toBe(false);
});

test("focus shows the tooltip only when it is the keyboard's", () => {
  const first = element("Backwards");
  let keyboard = false;
  const matches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
    return selector === ":focus-visible" ? keyboard : matches.call(this, selector);
  });
  // A menu opened by a press moves focus into its first row: no tooltip.
  first.dispatchEvent(new FocusEvent("focusin", { bubbles: true, composed: true }));
  expect(visible()).toBe(false);
  keyboard = true;
  first.dispatchEvent(new FocusEvent("focusin", { bubbles: true, composed: true }));
  expect(visible()).toBe(true);
  first.dispatchEvent(new FocusEvent("focusout", { bubbles: true, composed: true }));
  expect(visible()).toBe(false);
});

test("a showing tooltip follows its text, and goes when the text does", async () => {
  const play = element("Play");
  pointer(play, "pointerover", { pointerType: "mouse" });
  play.dataset.tooltip = "Pause";
  await Promise.resolve();
  expect(bubble().textContent).toBe("Pause");
  play.dataset.tooltipColour = "#f5aad1";
  await Promise.resolve();
  expect(bubble().style.getPropertyValue("--ds-tooltip-background")).toBe("#f5aad1");
  play.removeAttribute("data-tooltip");
  await Promise.resolve();
  expect(visible()).toBe(false);
});

test("a tap never shows a tooltip, a long press does, and the next touch or a moment hides it", () => {
  vi.useFakeTimers();
  const remove = element("Remove");
  const clicked = vi.fn();
  remove.addEventListener("click", clicked);

  pointer(remove, "pointerover", { pointerType: "touch" });
  pointer(remove, "pointerdown", { pointerType: "touch" });
  pointer(remove, "pointerup", { pointerType: "touch" });
  remove.click();
  expect(visible()).toBe(false);
  expect(clicked).toHaveBeenCalledTimes(1);

  pointer(remove, "pointerdown", { pointerType: "touch" });
  vi.advanceTimersByTime(LONG_PRESS_DELAY);
  expect(visible()).toBe(true);
  pointer(remove, "pointerup", { pointerType: "touch" });
  // The release of a press for the label does not press the element.
  remove.click();
  expect(clicked).toHaveBeenCalledTimes(1);
  pointer(document.body, "pointerdown", { pointerType: "touch" });
  expect(visible()).toBe(false);

  pointer(remove, "pointerdown", { pointerType: "touch" });
  vi.advanceTimersByTime(LONG_PRESS_DELAY);
  pointer(remove, "pointerup", { pointerType: "touch" });
  vi.advanceTimersByTime(TOUCH_TOOLTIP_DURATION);
  expect(visible()).toBe(false);

  // A finger that moves is scrolling, not pressing.
  pointer(remove, "pointerdown", { pointerType: "touch", clientX: 0, clientY: 0 });
  pointer(remove, "pointermove", { pointerType: "touch", clientX: 0, clientY: 40 });
  vi.advanceTimersByTime(LONG_PRESS_DELAY);
  expect(visible()).toBe(false);
});

test("data-tooltip-press shows the tooltip from a tap, for a moment", () => {
  vi.useFakeTimers();
  const size = element("Size 40");
  size.setAttribute("data-tooltip-press", "");
  pointer(size, "pointerdown", { pointerType: "touch" });
  pointer(size, "pointerup", { pointerType: "touch" });
  expect(visible()).toBe(true);
  vi.advanceTimersByTime(TOUCH_TOOLTIP_DURATION);
  expect(visible()).toBe(false);
});

test("showTooltip and hideTooltip show and hide it from code", () => {
  vi.useFakeTimers();
  const label = element("Copied", "span");
  showTooltip(label);
  expect(visible()).toBe(true);
  expect(bubble().textContent).toBe("Copied");
  hideTooltip();
  expect(visible()).toBe(false);
  showTooltip(label, { duration: 300 });
  vi.advanceTimersByTime(300);
  expect(visible()).toBe(false);
  showTooltip(element("", "span"));
  expect(visible()).toBe(false);
});
