// @vitest-environment happy-dom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vite-plus/test";
import { ButtonLink } from "../DS1/react/button";
import { Accordion } from "../DS1/react/accordion";
await import("../DS1/3-unit/ds-accordion");
await import("../DS1/3-unit/ds-menu");

test("shared links retain browser destinations and modifiers, and disabled links cannot activate", async () => {
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
  const host = document.createElement("div"); document.body.append(host); const root = createRoot(host);
  const choose = vi.fn(event => {expect(event.defaultPrevented).toBe(false); event.preventDefault();});
  try {
    await act(async () => root.render(h(ButtonLink, {href: "#destination", target: "_blank", rel: "noreferrer", onClick: choose}, "Open")));
    const link = host.querySelector("a")!;
    expect(link.getAttribute("href")).toBe("#destination"); expect(link.target).toBe("_blank"); expect(link.rel).toBe("noreferrer");
    const modified = new MouseEvent("click", {bubbles: true, cancelable: true, ctrlKey: true});
    link.dispatchEvent(modified); expect(modified.defaultPrevented).toBe(true); expect(choose).toHaveBeenCalledOnce();
    await act(async () => root.render(h(ButtonLink, {href: "#destination", disabled: true, onClick: choose}, "Open")));
    const disabled = new MouseEvent("click", {bubbles: true, cancelable: true}); link.dispatchEvent(disabled);
    expect(disabled.defaultPrevented).toBe(true); expect(link.hasAttribute("href")).toBe(false); expect(link.tabIndex).toBe(-1); expect(choose).toHaveBeenCalledOnce();
    await act(async () => root.render(h(ButtonLink, {href: "#destination"}, "Open")));
    expect(link.getAttribute("href")).toBe("#destination"); expect(link.hasAttribute("aria-disabled")).toBe(false);
    host.querySelector("ds-button")!.focus(); expect(document.activeElement).toBe(link);
  } finally {await act(async () => root.unmount()); host.remove();}
});

test("disclosures hide nested choices from menu navigation and can decline controlled changes", async () => {
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
  const menu = document.createElement("ds-menu"); document.body.append(menu); const root = createRoot(menu);
  const requested = vi.fn();
  function example(open?: boolean) { return h(Accordion, {summary: "Workspace", triggerRole: "menuitem", open, onOpenChange: requested}, h("button", {role: "menuitem"}, "Nested")); }
  try {
    await act(async () => root.render(example()));
    const trigger = menu.querySelector('button')!, nested = menu.querySelectorAll('button')[1]!;
    trigger.focus(); trigger.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true, composed: true, cancelable: true}));
    expect(document.activeElement).toBe(trigger);
    await act(async () => trigger.click()); expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.dispatchEvent(new KeyboardEvent("keydown", {key: "ArrowDown", bubbles: true, composed: true, cancelable: true})); expect(document.activeElement).toBe(nested);
    await act(async () => root.render(example(false))); expect(document.activeElement).toBe(trigger); expect(nested.closest('[hidden]')).not.toBeNull();
    await act(async () => trigger.click()); expect(requested).toHaveBeenLastCalledWith(true); expect(trigger.getAttribute("aria-expanded")).toBe("false");
  } finally {await act(async () => root.unmount()); menu.remove();}
});
