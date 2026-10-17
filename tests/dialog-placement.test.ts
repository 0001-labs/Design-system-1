// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { bindDialogSwipe, dialogPlacement } from "../DS1/0-face/dialog-swipe";
import { Dialog, DialogContent, DialogTitle } from "../DS1/react/dialog";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/4-page/ds-dialog");

afterEach(() => { document.body.replaceChildren(); document.documentElement.removeAttribute("style"); });

const frames = async (count = 3) => { for (let i = 0; i < count; i++) await new Promise(resolve => setTimeout(resolve, 20)); };

/** A finger on the dialog, as a touch event with its touches, a frame between moves. */
async function swipe(dialog: HTMLDialogElement, path: [number, number][], { hold = 0 } = {}) {
  const target = dialog.firstElementChild ?? dialog;
  const fire = (type: string, x: number, y: number, held: boolean, time: number) => {
    const touch = { identifier: 1, clientX: x, clientY: y, target };
    const event = new Event(type, { bubbles: true, cancelable: true, composed: true });
    Object.defineProperties(event, { touches: { value: held ? [touch] : [] }, changedTouches: { value: [touch] }, timeStamp: { value: time } });
    target.dispatchEvent(event);
    return event;
  };
  let time = 1000;
  fire("touchstart", ...path[0]!, true, time);
  const moves: Event[] = [];
  for (const [x, y] of path.slice(1)) { time += 16; moves.push(fire("touchmove", x, y, true, time)); }
  time += hold;
  const dragging = dialog.hasAttribute("data-ds-dialog-dragging");
  const dragged = dialog.style.getPropertyValue("--ds-dialog-drag");
  fire("touchend", ...path.at(-1)!, false, time);
  return { dragging, dragged, prevented: moves.some(move => move.defaultPrevented) };
}

const tall = (dialog: HTMLDialogElement, height = 400) =>
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ width: 375, height, top: 412, left: 0, right: 375, bottom: 812, x: 0, y: 412 } as DOMRect);
const QUICK: [number, number][] = [[100, 400], [100, 430], [100, 470], [100, 520], [100, 580]];

async function sheet(placement = "sheet") {
  const host = document.createElement("ds-dialog");
  host.setAttribute("placement", placement);
  host.innerHTML = '<dialog aria-label="Sheet"><p>Words</p></dialog>';
  document.body.append(host);
  await host.show();
  const dialog = host.querySelector("dialog")!;
  tall(dialog);
  return { host, dialog };
}

test("placement marks the native frame, defaults to the centre and leaves an anchored panel alone", async () => {
  const host = document.createElement("ds-dialog");
  host.innerHTML = '<dialog aria-label="Example"></dialog>';
  document.body.append(host);
  await host.updateComplete;
  const dialog = host.querySelector("dialog")!;
  expect(host.placement).toBe("center");
  expect(dialog.hasAttribute("data-ds-placement")).toBe(false);
  for (const placement of ["sheet", "end", "start"] as const) {
    host.placement = placement;
    await host.updateComplete;
    expect(dialog.getAttribute("data-ds-placement")).toBe(placement);
    expect(host.getAttribute("placement")).toBe(placement);
    expect(dialogPlacement(dialog)).toBe(placement);
  }
  host.anchor = { x: 10, y: 10 };
  await host.updateComplete;
  expect(dialog.hasAttribute("data-ds-placement")).toBe(false);
  host.anchor = null;
  host.placement = "center";
  await host.updateComplete;
  expect(dialog.hasAttribute("data-ds-placement")).toBe(false);
});

test("a quick swipe asks to close with the reason swipe, and closes; keyboard and focus stay the dialog's", async () => {
  const opener = document.createElement("button");
  document.body.append(opener); opener.focus();
  const { host, dialog } = await sheet();
  const reasons: string[] = [];
  host.addEventListener("ds-close-request", event => reasons.push((event as CustomEvent<{ reason: string }>).detail.reason));
  const gesture = await swipe(dialog, QUICK);
  expect(gesture.dragging).toBe(true);
  expect(gesture.prevented).toBe(true);
  expect(gesture.dragged).toMatch(/px$/);
  expect(reasons).toEqual(["swipe"]);
  expect(host.open).toBe(false);
  expect(dialog.open).toBe(false);
  expect(document.activeElement).toBe(opener);
});

test("a declined swipe keeps it open and settles it home; a slow, short drag settles without asking", async () => {
  const { host, dialog } = await sheet();
  const reasons: string[] = [];
  host.addEventListener("ds-close-request", event => { reasons.push((event as CustomEvent<{ reason: string }>).detail.reason); event.preventDefault(); });
  await swipe(dialog, QUICK);
  expect(reasons).toEqual(["swipe"]);
  await frames();
  expect(host.open).toBe(true);
  expect(dialog.style.getPropertyValue("--ds-dialog-drag")).toBe("0px");
  expect(dialog.style.getPropertyValue("--ds-dialog-progress")).toBe("0");
  expect(dialog.hasAttribute("data-ds-dialog-dragging")).toBe(false);
  await swipe(dialog, [[100, 400], [100, 420], [100, 440], [100, 460]], { hold: 200 });
  expect(reasons).toEqual(["swipe"]);
  expect(dialog.style.getPropertyValue("--ds-dialog-drag")).toBe("0px");
});

test("dragged towards the page it gives a little, and fades the backdrop as it goes", async () => {
  const { dialog } = await sheet();
  const up = await swipe(dialog, [[100, 400], [100, 370], [100, 300], [100, 200]]);
  expect(up.dragging).toBe(true);
  // Rubber-banded: 190px up moves it far less.
  expect(Math.abs(parseFloat(up.dragged))).toBeLessThan(190);
  expect(parseFloat(up.dragged)).toBeLessThan(0);
  const target = dialog.firstElementChild!;
  const touch = (type: string, y: number, held = true) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(event, { touches: { value: held ? [{ identifier: 2, clientX: 100, clientY: y, target }] : [] } });
    target.dispatchEvent(event);
  };
  // Tracked from where the drag began, twenty pixels down: 200 of 400 is half way.
  touch("touchstart", 400); touch("touchmove", 420); touch("touchmove", 620);
  expect(dialog.style.getPropertyValue("--ds-dialog-progress")).toBe("0.5");
  touch("touchcancel", 620, false);
  expect(dialog.style.getPropertyValue("--ds-dialog-drag")).toBe("0px");
});

test("a sideways move, a slider and content scrolled down keep their touches", async () => {
  const { host, dialog } = await sheet();
  const close = vi.fn();
  host.addEventListener("ds-close-request", close);
  expect((await swipe(dialog, [[100, 400], [140, 404], [190, 408], [260, 412]])).dragging).toBe(false);
  dialog.firstElementChild!.setAttribute("role", "slider");
  expect((await swipe(dialog, QUICK)).dragging).toBe(false);
  dialog.firstElementChild!.removeAttribute("role");
  dialog.style.overflowY = "auto";
  Object.defineProperties(dialog, { scrollHeight: { value: 900, configurable: true }, clientHeight: { value: 400, configurable: true } });
  dialog.scrollTop = 50;
  Object.defineProperty(dialog, "scrollTop", { value: 50, configurable: true });
  expect((await swipe(dialog, QUICK)).dragging).toBe(false);
  expect(close).not.toHaveBeenCalled();
  expect(host.open).toBe(true);
});

test("a drawer at the end swipes away to the right, and in a right-to-left page to the left", async () => {
  const { host, dialog } = await sheet("end");
  const reasons: string[] = [];
  host.addEventListener("ds-close-request", event => reasons.push((event as CustomEvent<{ reason: string }>).detail.reason));
  expect((await swipe(dialog, [[200, 300], [230, 300], [270, 300], [320, 300], [370, 300]])).dragged).toMatch(/^\d/);
  expect(reasons).toEqual(["swipe"]);
  expect(host.open).toBe(false);

  const rtl = await sheet("end");
  rtl.host.setAttribute("dir", "rtl");
  rtl.dialog.style.direction = "rtl";
  expect((await swipe(rtl.dialog, [[200, 300], [230, 300], [270, 300], [320, 300]])).dragged, "towards the page: it gives").toMatch(/^\d/);
  expect(rtl.host.open).toBe(true);
  await swipe(rtl.dialog, [[300, 300], [270, 300], [230, 300], [180, 300], [120, 300]]);
  expect(rtl.host.open).toBe(false);
});

test("a centred dialog is never swiped", async () => {
  const { host, dialog } = await sheet("center");
  expect((await swipe(dialog, QUICK)).dragging).toBe(false);
  expect(host.open).toBe(true);
});

test("a native sheet asks with a cancelable ds-close-request on the dialog, closes unless declined, and starts clean when opened again", async () => {
  document.body.innerHTML = '<dialog class="ds-dialog ds-dialog--sheet" aria-label="Native"><p>Words</p></dialog>';
  const dialog = document.querySelector("dialog")!;
  tall(dialog);
  expect(dialogPlacement(dialog)).toBe("sheet");
  const unbind = bindDialogSwipe(dialog);
  dialog.showModal();
  let decline = true;
  const reasons: string[] = [];
  dialog.addEventListener("ds-close-request", event => { reasons.push((event as CustomEvent<{ reason: string }>).detail.reason); if (decline) event.preventDefault(); });
  await swipe(dialog, QUICK);
  expect(dialog.open).toBe(true);
  decline = false;
  await swipe(dialog, QUICK);
  expect(reasons).toEqual(["swipe", "swipe"]);
  expect(dialog.open).toBe(false);
  expect(dialog.style.getPropertyValue("--ds-dialog-drag")).not.toBe("");
  dialog.showModal();
  await frames(1);
  expect(dialog.style.getPropertyValue("--ds-dialog-drag")).toBe("");
  unbind();
  expect((await swipe(dialog, QUICK)).dragging).toBe(false);
});

test("onDismiss replaces the close request; a product closing a moment later is not settled home", async () => {
  document.body.innerHTML = '<dialog class="ds-dialog ds-dialog--start" aria-label="Native"><p>Words</p></dialog>';
  const dialog = document.querySelector("dialog")!;
  tall(dialog);
  const onDismiss = vi.fn(() => setTimeout(() => dialog.close(), 5));
  bindDialogSwipe(dialog, { onDismiss });
  dialog.showModal();
  await swipe(dialog, [[300, 300], [270, 300], [230, 300], [180, 300], [120, 300]]);
  expect(onDismiss).toHaveBeenCalledWith(dialog);
  await frames();
  expect(dialog.open).toBe(false);
  expect(dialog.style.getPropertyValue("--ds-dialog-drag")).not.toBe("0px");
});

test("React passes placement, keeps a sliding dialog on the page until it has slid out, and removes a centred one at once", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount);
  let toggle: (open: boolean) => void = () => {};
  function Example({ placement }: { placement: "sheet" | "center" }) {
    const [open, setOpen] = useState(true);
    toggle = setOpen;
    return h(Dialog, { open, onOpenChange: setOpen, children: h(DialogContent, { placement }, h(DialogTitle, null, "Trade")) });
  }
  await act(async () => { root.render(h(Example, { placement: "sheet" })); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  const host = document.querySelector("ds-dialog")!;
  expect(host.placement).toBe("sheet");
  expect(host.querySelector("dialog")!.getAttribute("data-ds-placement")).toBe("sheet");
  await act(async () => { toggle(false); });
  expect(document.querySelector("ds-dialog")).toBe(host);
  expect(host.open).toBe(false);
  await act(async () => {
    const event = new Event("transitionend");
    Object.defineProperties(event, { propertyName: { value: "transform" }, pseudoElement: { value: "" } });
    host.querySelector("dialog")!.dispatchEvent(event);
  });
  expect(document.querySelector("ds-dialog")).toBeNull();

  await act(async () => { root.render(h(Example, { placement: "center" })); });
  await act(async () => { toggle(true); });
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
  expect(document.querySelector("ds-dialog")).not.toBeNull();
  await act(async () => { toggle(false); });
  expect(document.querySelector("ds-dialog")).toBeNull();
  act(() => root.unmount());
});
