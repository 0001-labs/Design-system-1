// @vitest-environment happy-dom
import { expect, test } from "vite-plus/test";
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "../DS1/react/button";
import "../DS1/2-core/ds-button";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
test("React controls accepted and rejected choices, updated callbacks and action mode", async () => {
  const host = document.createElement("div"); document.body.append(host);
  const root = createRoot(host); const requests: string[] = [];
  const segments = [{ value: "one", label: "One, with a colon: yes" }, { value: "two", label: "Two" }, { value: "three", label: "Unavailable", disabled: true }];
  function Example({ accept }: { accept: boolean }) {
    const [value, setValue] = useState("one");
    return h(Button, { split: true, segments, value, label: "View", onPress: next => { requests.push(next); if (accept) setValue(next); } });
  }
  try {
    await act(async () => root.render(h(Example, { accept: false })));
    const split = host.querySelector("ds-button")!; await split.updateComplete;
    const buttons = () => [...split.shadowRoot!.querySelectorAll("button")];
    await act(async () => buttons()[1].click()); await split.updateComplete;
    expect(requests).toEqual(["two"]); expect(split.value).toBe("one");
    expect(buttons()[0].querySelector("ds-text")!.text).toBe("One, with a colon: yes");
    await act(async () => root.render(h(Example, { accept: true })));
    await act(async () => buttons()[1].click()); await split.updateComplete;
    expect(split.value).toBe("two"); expect(buttons()[1].getAttribute("aria-pressed")).toBe("true");
    await act(async () => { buttons()[1].click(); buttons()[2].click(); });
    expect(requests).toEqual(["two", "two"]);
    await act(async () => root.render(h(Button, { split: true, segments, label: "History", onPress: next => requests.push(next) })));
    const actions = host.querySelector("ds-button")!; await actions.updateComplete;
    await act(async () => { actions.shadowRoot!.querySelector("button")!.click(); actions.shadowRoot!.querySelector("button")!.click(); });
    expect(requests).toEqual(["two", "two", "one", "one"]);
    expect(actions.actions).toBe(true);
    expect(actions.shadowRoot!.querySelector("button")!.hasAttribute("aria-pressed")).toBe(false);
  } finally { await act(async () => root.unmount()); host.remove(); }
});
