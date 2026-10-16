// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
const { toast, configureToaster, pageToaster, confirm, prompt, alert, copyText } = await import("../DS1/0-face/feedback");
const { configureI18n, loadSharedWords, setLanguage } = await import("../DS1/0-face/i18n");

afterEach(async () => {
  toast.dismiss();
  await vi.advanceTimersByTimeAsync?.(500).catch(() => undefined);
  configureToaster({ position: "bottom-right", closeButton: false, richColors: false, expand: false });
  for (const dialog of document.querySelectorAll("dialog")) dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
  document.body.replaceChildren();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
  setLanguage("en");
});

const host = () => document.querySelector<HTMLElement>("[data-ds-toaster]")!;
const toasts = () => [...host().shadowRoot!.querySelectorAll<HTMLElement>("li.toast:not([data-removed='true'])")];
const titles = () => toasts().map(item => item.querySelector(".title")?.textContent);
const settle = (ms = 0) => vi.advanceTimersByTimeAsync(ms);

test("the page toaster is a polite live region in the page before the first toast", () => {
  const element = pageToaster()!;
  expect(element.isConnected).toBe(true);
  const region = element.shadowRoot!.querySelector("section")!;
  expect(region.getAttribute("aria-live")).toBe("polite");
  expect(region.getAttribute("aria-label")).toBe("Notifications alt+T");
  expect(customElements.get("ds-toast")).toBeUndefined();
});

test("draws a toast with no framework, as Sonner does, and closes it after four seconds", async () => {
  vi.useFakeTimers();
  const onAutoClose = vi.fn();
  toast("Event created", { description: "Monday at 9:00", onAutoClose });
  await settle(20);
  const [item] = toasts();
  expect(item!.querySelector(".title")?.textContent).toBe("Event created");
  expect(item!.querySelector(".description")?.textContent).toBe("Monday at 9:00");
  expect(item!.getAttribute("role")).toBe("status");
  expect(item!.getAttribute("aria-live")).toBe("polite");
  expect(item!.dataset.mounted).toBe("true");
  // The element's own stylesheet, in the toaster's shadow root.
  expect(host().shadowRoot!.firstElementChild?.localName).toBe("style");
  await settle(3900);
  expect(toasts()).toHaveLength(1);
  await settle(200);
  expect(toasts()).toHaveLength(0);
  expect(onAutoClose).toHaveBeenCalledOnce();
});

test("an error is announced assertively unless it says otherwise", async () => {
  vi.useFakeTimers();
  toast.error("Could not save");
  toast.error("Quiet", { important: false });
  toast.success("Saved");
  await settle(20);
  const [saved, quiet, error] = toasts();
  expect(error!.getAttribute("aria-live")).toBe("assertive");
  expect(quiet!.getAttribute("aria-live")).toBe("polite");
  expect(saved!.getAttribute("aria-live")).toBe("polite");
  expect(error!.querySelector(".icon svg")).not.toBeNull();
  expect(error!.querySelector(".icon svg")?.innerHTML).not.toContain("#1E1E1E");
});

test("queues the newest in front, shows three, and pauses while hovered", async () => {
  vi.useFakeTimers();
  for (const title of ["One", "Two", "Three", "Four"]) toast(title);
  await settle(20);
  expect(titles()).toEqual(["Four", "Three", "Two", "One"]);
  expect(toasts().map(item => item.dataset.front)).toEqual(["true", "false", "false", "false"]);
  expect(toasts().map(item => item.dataset.visible)).toEqual(["true", "true", "true", "false"]);
  const list = host().shadowRoot!.querySelector("ol")!;
  list.dispatchEvent(new PointerEvent("pointerenter"));
  expect(list.dataset.expanded).toBe("true");
  await settle(10000);
  expect(toasts()).toHaveLength(4);
  list.dispatchEvent(new PointerEvent("pointerleave"));
  await settle(4300);
  expect(toasts()).toHaveLength(0);
});

test("the same id updates in place, a promise settles it, and dismiss removes it", async () => {
  vi.useFakeTimers();
  let resolve!: (value: string) => void;
  const id = toast.promise(new Promise<string>(done => { resolve = done; }), { loading: "Saving", success: name => `Saved ${name}`, error: "Could not save" });
  await settle(20);
  expect(toasts()[0]!.dataset.type).toBe("loading");
  expect(toasts()[0]!.querySelector(".spinner")).not.toBeNull();
  await settle(10000);
  expect(toasts()).toHaveLength(1);
  resolve("draft");
  await settle();
  expect(toasts()).toHaveLength(1);
  expect(toasts()[0]!.dataset.type).toBe("success");
  expect(titles()).toEqual(["Saved draft"]);
  toast.dismiss(id);
  await settle(300);
  expect(toasts()).toHaveLength(0);
});

test("an action runs and closes the toast, and the toaster takes Sonner's props", async () => {
  vi.useFakeTimers();
  configureToaster({ position: "top-center", closeButton: true, richColors: true });
  const onClick = vi.fn();
  toast("Item archived", { action: { label: "Undo", onClick } });
  await settle(20);
  const list = host().shadowRoot!.querySelector("ol")!;
  expect([list.dataset.y, list.dataset.x]).toEqual(["top", "center"]);
  expect(host().hasAttribute("rich-colors")).toBe(true);
  expect(toasts()[0]!.querySelector("button.close")?.getAttribute("aria-label")).toBe("Close");
  toasts()[0]!.querySelector<HTMLButtonElement>("button.action")!.click();
  await settle();
  expect(onClick).toHaveBeenCalledOnce();
  expect(toasts()).toHaveLength(0);
});

test("a toast taken out of the page brings the toaster back", async () => {
  vi.useFakeTimers();
  document.body.replaceChildren();
  toast("Back again");
  await settle(20);
  expect(host().isConnected).toBe(true);
  expect(titles()).toEqual(["Back again"]);
});

const opened = () => document.querySelector<HTMLDialogElement>("dialog.ds-dialog")!;
const button = (value: string) => opened().querySelector<HTMLButtonElement>(`button[value="${value}"]`)!;

test("confirm opens the native frame, moves focus in and back, and answers", async () => {
  const opener = document.createElement("button");
  document.body.append(opener);
  opener.focus();
  const answer = confirm({ title: "Archive this list?", text: "It can be restored." });
  const dialog = opened();
  expect(dialog.open).toBe(true);
  expect(dialog.getAttribute("role")).toBe("alertdialog");
  expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe("Archive this list?");
  expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toBe("It can be restored.");
  expect(button("confirm").className).toBe("ds-button ds-button--primary");
  expect(button("cancel").className).toBe("ds-button ds-button--secondary");
  expect([button("cancel").textContent, button("confirm").textContent]).toEqual(["Cancel", "OK"]);
  expect(document.activeElement).toBe(button("confirm"));
  button("confirm").click();
  expect(await answer).toBe(true);
  expect(document.querySelector("dialog")).toBeNull();
  expect(document.activeElement).toBe(opener);
});

test("Escape and a click on the backdrop cancel; a destructive confirmation takes an answer", async () => {
  const escaped = confirm("Leave without saving?");
  opened().dispatchEvent(new Event("cancel", { cancelable: true }));
  expect(await escaped).toBe(false);

  const outside = { button: 0, clientX: 5, clientY: 5, bubbles: true };
  const backdrop = confirm("Leave without saving?");
  vi.spyOn(opened(), "getBoundingClientRect").mockReturnValue({ left: 100, right: 500, top: 100, bottom: 300 } as DOMRect);
  opened().dispatchEvent(new PointerEvent("pointerdown", outside));
  opened().dispatchEvent(new MouseEvent("click", outside));
  expect(await backdrop).toBe(false);

  const destructive = confirm({ title: "Delete this track?", confirm: "Delete", danger: true });
  const dialog = opened();
  vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 100, right: 500, top: 100, bottom: 300 } as DOMRect);
  expect(button("confirm").classList.contains("ds-button--danger")).toBe(true);
  expect(button("confirm").textContent).toBe("Delete");
  expect(document.activeElement).toBe(button("cancel"));
  dialog.dispatchEvent(new PointerEvent("pointerdown", outside));
  dialog.dispatchEvent(new MouseEvent("click", outside));
  expect(dialog.isConnected).toBe(true);
  button("confirm").click();
  expect(await destructive).toBe(true);
});

test("prompt answers its text on Enter and null when cancelled", async () => {
  const named = prompt({ title: "Rename", label: "Name", value: "Untitled", placeholder: "A name" });
  const input = opened().querySelector<HTMLInputElement>("input.ds-input")!;
  expect(opened().getAttribute("role")).toBe("dialog");
  expect(document.activeElement).toBe(input);
  expect(input.value).toBe("Untitled");
  expect(input.placeholder).toBe("A name");
  expect(opened().querySelector(`label[for="${input.id}"]`)?.textContent).toBe("Name");
  input.value = "Draft";
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
  expect(await named).toBe("Draft");

  const cancelled = prompt("Rename");
  expect(opened().querySelector("input")!.getAttribute("aria-labelledby")).toBe(opened().getAttribute("aria-labelledby"));
  button("cancel").click();
  expect(await cancelled).toBeNull();
});

test("alert resolves when it is dismissed, and two dialogs never open at once", async () => {
  const first = alert({ title: "Saved", text: "Your changes are in." });
  const second = confirm("And then?");
  expect(document.querySelectorAll("dialog")).toHaveLength(1);
  expect(button("confirm").textContent).toBe("OK");
  expect(opened().querySelector("button[value='cancel']")).toBeNull();
  button("confirm").click();
  await first;
  await Promise.resolve();
  expect(document.querySelectorAll("dialog")).toHaveLength(1);
  expect(opened().textContent).toContain("And then?");
  button("cancel").click();
  expect(await second).toBe(false);
});

test("default words are the shared words in the page's language", async () => {
  configureI18n({ languages: ["en", "da"], sharedWords: true });
  await loadSharedWords();
  setLanguage("da");
  const answer = confirm("Slet?");
  expect([button("cancel").textContent, button("confirm").textContent]).toEqual(["Annuller", "OK"]);
  button("cancel").click();
  await answer;
  vi.useFakeTimers();
  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => undefined) } });
  await copyText("https://example.com");
  await settle(20);
  expect(titles()).toEqual(["Kopieret"]);
});

test("copyText writes with the Clipboard API and confirms with a toast", async () => {
  vi.useFakeTimers();
  const writeText = vi.fn(async () => undefined);
  vi.stubGlobal("navigator", { clipboard: { writeText } });
  expect(await copyText("abc")).toBe(true);
  expect(writeText).toHaveBeenCalledWith("abc");
  await settle(20);
  expect(titles()).toEqual(["Copied"]);
  expect(toasts()[0]!.dataset.type).toBe("success");
  expect(await copyText("def", { toast: "Link copied" })).toBe(true);
  await settle(20);
  expect(titles()[0]).toBe("Link copied");
  toast.dismiss();
  await settle(300);
  expect(await copyText("ghi", { toast: false })).toBe(true);
  await settle(20);
  expect(toasts()).toHaveLength(0);
});

test("copyText falls back to a hidden field where the Clipboard API is missing or refused", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("navigator", {});
  const execCommand = vi.fn(() => true);
  Object.defineProperty(document, "execCommand", { value: execCommand, configurable: true });
  const opener = document.createElement("input");
  document.body.append(opener);
  opener.focus();
  expect(await copyText("plain http")).toBe(true);
  expect(execCommand).toHaveBeenCalledWith("copy");
  expect(document.querySelector("textarea")).toBeNull();
  expect(document.activeElement).toBe(opener);

  vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => { throw new Error("denied"); }) } });
  execCommand.mockReturnValue(false);
  expect(await copyText("nowhere")).toBe(false);
  await settle(20);
  expect(titles()[0]).toBe("Could not copy");
  expect(toasts()[0]!.dataset.type).toBe("error");
});
