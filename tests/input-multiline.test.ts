// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import React, { act, createElement, createRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Input, type InputElement } from "../DS1/react/input";
vi.stubGlobal(
  "fetch",
  vi.fn(async () => new Response("{}")),
);
await import("../DS1/2-core/ds-input");
afterEach(() => document.body.replaceChildren());

test("multiline fields inherit input form, selection, validation and reset behavior", async () => {
  document.body.innerHTML =
    '<ds-input multiline name="description" value="Initial" aria-label="Description" rows="4" maxlength="80" required></ds-input>';
  const field = document.querySelector("ds-input")!;
  await field.updateComplete;
  const native = field.shadowRoot!.querySelector("textarea")!;
  expect(native.value).toBe("Initial");
  expect(native.getAttribute("rows")).toBe("4");
  expect(native.maxLength).toBe(80);
  expect(native.getAttribute("aria-label")).toBe("Description");
  const changed = vi.fn();
  field.addEventListener("input-change", changed);
  native.value = "Two\nlines";
  native.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  expect(field.value).toBe("Two\nlines");
  expect(changed.mock.calls[0][0].detail).toEqual({ name: "description", value: "Two\nlines" });
  field.focus();
  field.setSelectionRange(0, 3);
  expect(field.selectionEnd).toBe(3);
  field.error = "Check this description";
  await field.updateComplete;
  expect(field.checkValidity()).toBe(false);
  field.error = "";
  field.formResetCallback();
  await field.updateComplete;
  expect(native.value).toBe("Initial");
  expect(field.checkValidity()).toBe(true);
  field.formDisabledCallback(true);
  await field.updateComplete;
  expect(native.disabled).toBe(true);
});

test("React multiline edits, disabled state and Enter stay within the existing product flow", async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  const ref = createRef<InputElement>();
  const submit = vi.fn();
  function Form() {
    const [value, setValue] = useState("Initial");
    return createElement(
      "form",
      { onSubmit: submit },
      createElement(Input, {
        multiline: true,
        ref,
        value,
        rows: 2,
        autoGrow: true,
        maxRows: 5,
        onChange: (event) => setValue(event.target.value),
        "aria-label": "Message",
      }),
      createElement("button", { type: "submit" }, "Save"),
    );
  }
  try {
    await act(async () => root.render(createElement(Form)));
    const field = host.querySelector("ds-input")!;
    await field.updateComplete;
    const native = field.shadowRoot!.querySelector("textarea")!;
    await act(async () => {
      native.value = "First\nSecond";
      native.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    });
    await field.updateComplete;
    expect(native.value).toBe("First\nSecond");
    expect(ref.current).toBe(field);
    expect(field.autoGrow).toBe(true);
    expect(field.maxRows).toBe(5);
    await act(async () =>
      native.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          composed: true,
          cancelable: true,
        }),
      ),
    );
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(submit).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
  }
});
