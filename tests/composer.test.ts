// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement as h, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { Composer } from "../DS1/react/composer";
import "../DS1/2-core/ds-composer";
afterEach(() => document.body.replaceChildren());
const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!;

test("highlights preserve every original character, escape markup and reject invalid or overlapping ranges", async () => {
  document.body.innerHTML = '<ds-composer><textarea name="message" rows="2"></textarea></ds-composer>';
  const host = document.querySelector("ds-composer")!, input = host.querySelector("textarea")!;
  input.value = "Hello 雪 <b>\nNext line";
  host.highlights = [{start: 6, end: 7}, {start: 6, end: 10}, {start: -1, end: 2}, {start: 100, end: 101}];
  await host.updateComplete;
  host.refresh(); await host.updateComplete;
  expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe(input.value + "\n");
  expect(host.shadowRoot!.querySelectorAll("mark")).toHaveLength(1);
  expect(host.shadowRoot!.querySelector("b")).toBeNull();
  input.scrollTop = 40; input.scrollLeft = 20; input.dispatchEvent(new Event("scroll"));
  expect(host.shadowRoot!.querySelector(".mirror")!.scrollTop).toBe(40);
  expect(host.shadowRoot!.querySelector(".mirror")!.scrollLeft).toBe(20);
});

test("React preserves native refs, labels, ARIA links, forms, rejected edits and keyboard cancellation", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount), ref = createRef<HTMLTextAreaElement>(), changed = vi.fn();
  function Example() {
    const [value, setValue] = useState("Hi Snow");
    return h("form", {}, h("label", {htmlFor: "message"}, "Message"), h(Composer, {
      ref, id: "message", name: "body", value, highlights: [{start: 3, end: 7}],
      "aria-controls": "people", "aria-activedescendant": "snow", maxLength: 80,
      onChange: event => { changed(event.target.value); if (!event.target.value.includes("reject")) setValue(event.target.value); },
      onKeyDown: event => { if (event.key === "Enter") event.preventDefault(); },
    }), h("div", {id: "people", role: "listbox"}, h("div", {id: "snow", role: "option"}, "Snow")));
  }
  try {
    await act(async () => root.render(h(Example)));
    const input = ref.current!, host = input.parentElement as HTMLElementTagNameMap["ds-composer"];
    await host.updateComplete;
    expect(input.getRootNode()).toBe(document);
    expect(input.labels![0].textContent).toBe("Message");
    expect(document.getElementById(input.getAttribute("aria-activedescendant")!)?.textContent).toBe("Snow");
    input.focus(); input.setSelectionRange(3, 7);
    expect(document.activeElement).toBe(input); expect(input.selectionEnd).toBe(7);
    await act(async () => { setValue.call(input, "Hi Snow\nAgain"); input.dispatchEvent(new Event("input", {bubbles: true})); });
    expect(changed).toHaveBeenLastCalledWith("Hi Snow\nAgain");
    expect(new FormData(mount.querySelector("form")!).getAll("body")).toEqual(["Hi Snow\nAgain"]);
    await act(async () => { setValue.call(input, "reject"); input.dispatchEvent(new Event("input", {bubbles: true})); });
    expect(input.value).toBe("Hi Snow\nAgain");
    await host.updateComplete;
    expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe(input.value + "\n");
    const enter = new KeyboardEvent("keydown", {key: "Enter", bubbles: true, cancelable: true});
    input.dispatchEvent(enter); expect(enter.defaultPrevented).toBe(true);
  } finally { await act(async () => root.unmount()); }
});

test("uncontrolled form reset and reconnect refresh the overlay; SSR keeps the native field", async () => {
  document.body.innerHTML = '<form><ds-composer><textarea name="body">Original</textarea></ds-composer></form>';
  const host = document.querySelector("ds-composer")!, input = host.querySelector("textarea")!;
  host.highlights = [{start: 0, end: 8}]; await host.updateComplete;
  input.value = "Modified"; input.dispatchEvent(new Event("input")); await host.updateComplete;
  input.form!.reset(); await Promise.resolve(); await host.updateComplete;
  expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe("Original\n");
  host.remove(); input.value = "Returned"; document.body.append(host); await host.updateComplete;
  expect(host.shadowRoot!.querySelector(".mirror")!.textContent).toBe("Returned\n");
  expect(renderToString(h(Composer, {name: "message", defaultValue: "Server text"}))).toContain('<textarea name="message">Server text</textarea>');
});
