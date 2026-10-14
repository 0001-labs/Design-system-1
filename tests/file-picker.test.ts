// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { act, createElement as h, createRef } from "react";
import { createRoot } from "react-dom/client";
import { FilePicker } from "../DS1/react/file-picker";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
await import("../DS1/2-core/ds-file-picker");
afterEach(() => document.body.replaceChildren());

test("file selection keeps the native ref, labels, external form and events", async () => {
  const mount = document.createElement("div"); document.body.append(mount);
  const root = createRoot(mount), ref = createRef<HTMLInputElement>();
  const changed: HTMLInputElement[] = [];
  try {
    await act(async () => root.render(h("div", null, h("form", {id:"upload"}), h("label", {htmlFor:"logo"}, "Company logo"), h(FilePicker, {
      id:"logo", label:"Choose logo", name:"logo", form:"upload", required:true, multiple:true, accept:"image/svg+xml,.svg", ref,
      onChange:event=>changed.push(event.currentTarget),
    }))));
    const input=ref.current!, host=mount.querySelector("ds-file-picker")!;
    await host.updateComplete;
    expect(input.type).toBe("file"); expect(input.form?.id).toBe("upload");
    expect(input.labels?.[0]?.textContent).toBe("Company logo");
    expect(input.multiple).toBe(true); expect(input.accept).toBe("image/svg+xml,.svg");
    expect(input.checkValidity()).toBe(false);
    expect(mount.querySelectorAll("input")).toHaveLength(1);
    host.focus(); expect(document.activeElement).toBe(input);
    await act(async () => input.dispatchEvent(new Event("change",{bubbles:true})));
    expect(changed).toEqual([input]);
    const face=host.shadowRoot!.querySelector("ds-button")!;
    expect(face.hasAttribute("inert")).toBe(true); expect(face.getAttribute("aria-hidden")).toBe("true");
    expect(input.hidden).toBe(false);
  } finally { await act(async()=>root.unmount()); }
});

test("pending changes update the face and recover without replacing the native input", async () => {
  const mount=document.createElement("div"); document.body.append(mount);
  const root=createRoot(mount);
  const render=(disabled:boolean, hidden=false)=>act(async()=>root.render(h(FilePicker,{label:disabled?"Uploading":"Choose logo",disabled,hidden})));
  try {
    await render(false);
    const host=mount.querySelector("ds-file-picker")!, input=mount.querySelector("input")!;
    await render(true); await new Promise(resolve=>setTimeout(resolve,0)); await host.updateComplete;
    expect(input.disabled).toBe(true); expect(host.hasAttribute("data-disabled")).toBe(true);
    await render(false); await new Promise(resolve=>setTimeout(resolve,0)); await host.updateComplete;
    expect(input.disabled).toBe(false); expect(host.hasAttribute("data-disabled")).toBe(false);
    expect(mount.querySelector("input")).toBe(input);
    await render(false,true); expect(host.hidden).toBe(true); expect(input.hidden).toBe(true);
  } finally { await act(async()=>root.unmount()); }
});

test("replacement, detach and reconnect use the current control", async()=>{
  const host=document.createElement("ds-file-picker"), first=document.createElement("input"); first.type="file";
  host.append(first); document.body.append(host); await host.updateComplete;
  const second=document.createElement("input"); second.type="file"; second.disabled=true;
  host.replaceChildren(second); await new Promise(resolve=>setTimeout(resolve,0)); await host.updateComplete;
  expect(host.hasAttribute("data-disabled")).toBe(true);
  host.remove(); second.disabled=false;
  await new Promise(resolve=>setTimeout(resolve,0));
  document.body.append(host); await host.updateComplete;
  expect(host.hasAttribute("data-disabled")).toBe(false); host.focus(); expect(document.activeElement).toBe(second);
});

test("file drag feedback never replaces native drop handling and clears when disabled",async()=>{
  const host=document.createElement("ds-file-picker"),input=document.createElement("input");input.type="file";
  host.append(input);document.body.append(host);await host.updateComplete;
  // happy-dom aliases DragEvent to Event; provide its missing native payload.
  const drag=(type:string)=>{const event=new Event(type,{bubbles:true,cancelable:true});Object.defineProperty(event,'dataTransfer',{value:{types:['Files']}});return event;};
  const enter=drag('dragenter');
  input.dispatchEvent(enter);expect(enter.defaultPrevented).toBe(false);expect(host.hasAttribute('data-dragging')).toBe(true);
  const drop=drag('drop');
  input.dispatchEvent(drop);expect(drop.defaultPrevented).toBe(false);expect(host.hasAttribute('data-dragging')).toBe(false);
  input.dispatchEvent(drag('dragenter'));
  input.disabled=true;await new Promise(resolve=>setTimeout(resolve,0));expect(host.hasAttribute('data-dragging')).toBe(false);
  input.dispatchEvent(drag('dragenter'));expect(host.hasAttribute('data-dragging')).toBe(false);
});
