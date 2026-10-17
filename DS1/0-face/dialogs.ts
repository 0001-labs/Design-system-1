/**
 * Dialogs that answer with a promise, in place of the browser's `alert()`,
 * `confirm()` and `prompt()`, for pages without Lit or any other framework.
 *
 * Each is drawn on the native `dialog.ds-dialog` frame from `1-root/controls.css`
 * (which the page loads) with its native buttons, `.ds-button--primary`,
 * `--secondary` and `--danger`, and opened with `showModal()`, so the browser
 * keeps the rest of the page inert behind it. Their words default to the
 * shared words (OK, Cancel) in the page's language where the page loads the
 * language module, and English otherwise (`./feedback-words.ts`).
 *
 * - Focus moves into the dialog when it opens, and back to what had it when it
 *   closes.
 * - Escape cancels; Enter in a prompt's field confirms it.
 * - A click on the backdrop cancels, except on a destructive confirmation
 *   (`danger`), which takes an answer.
 * - Two never open at once: a dialog asked for while another is open waits
 *   for it to close.
 * - A dialog asked for in a click opens within that click, so a phone shows
 *   its keyboard for a prompt's field.
 */
import { feedbackWord } from "./feedback-words";

export interface AlertOptions {
  title: string;
  text?: string;
  /** The button's words; the shared word "OK" by default. */
  confirm?: string;
}

export interface ConfirmOptions {
  title: string;
  text?: string;
  /** The confirming button's words; the shared word "OK" by default. Name the action when it has one ("Delete"). */
  confirm?: string;
  /** The cancelling button's words; the shared word "Cancel" by default. */
  cancel?: string;
  /** A destructive action: the confirming button in the danger colour, Cancel focused, and no backdrop dismissal. */
  danger?: boolean;
}

export interface PromptOptions {
  title: string;
  text?: string;
  /** The field's label, shown above it; without one, the title names the field. */
  label?: string;
  value?: string;
  placeholder?: string;
  confirm?: string;
  cancel?: string;
}

type Kind = "alert" | "confirm" | "prompt";
interface Spec {
  kind: Kind;
  title: string;
  text?: string;
  confirm: string;
  cancel?: string;
  danger?: boolean;
  field?: { label?: string; value: string; placeholder?: string };
}

/* One dialog at a time; the next waits in line. */
const waiting: Array<() => void> = [];
let open = false;
let count = 0;

function inLine<T>(show: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      open = true;
      show().then(resolve, reject).finally(() => {
        open = false;
        waiting.shift()?.();
      });
    };
    if (open) waiting.push(start);
    else start();
  });
}

/** The element with focus, inside open shadow roots too. */
function focused(): HTMLElement | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active instanceof HTMLElement ? active : null;
}

function element<K extends keyof HTMLElementTagNameMap>(name: K, attributes: Record<string, string> = {}, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Answers `true` for the confirming button, `false` for Cancel, Escape and the backdrop; a prompt answers its text. */
function show(spec: Spec): Promise<boolean | string | null> {
  return new Promise(resolve => {
    const id = `ds-feedback-${++count}`;
    const opener = focused();
    const dialog = element("dialog", {
      class: "ds-dialog",
      role: spec.kind === "prompt" ? "dialog" : "alertdialog",
      "aria-labelledby": `${id}-title`,
      "data-ds-feedback": spec.kind,
    });
    const header = element("div", { "data-ds-dialog": "header" });
    header.appendChild(element("h2", { id: `${id}-title`, "data-ds-dialog": "title" }, spec.title));
    if (spec.text) {
      header.appendChild(element("p", { id: `${id}-text`, "data-ds-dialog": "description" }, spec.text));
      dialog.setAttribute("aria-describedby", `${id}-text`);
    }
    dialog.appendChild(header);

    let input: HTMLInputElement | undefined;
    if (spec.field) {
      const field = element("div", { "data-ds-dialog": "field" });
      input = element("input", { id: `${id}-field`, class: "ds-input", type: "text", autocomplete: "off" });
      input.value = spec.field.value;
      if (spec.field.placeholder) input.placeholder = spec.field.placeholder;
      if (spec.field.label) field.appendChild(element("label", { for: input.id, "data-ds-dialog": "label" }, spec.field.label));
      else input.setAttribute("aria-labelledby", `${id}-title`);
      field.appendChild(input);
      dialog.appendChild(field);
    }

    const footer = element("div", { "data-ds-dialog": "footer" });
    const cancel = spec.cancel === undefined ? undefined : element("button", { type: "button", class: "ds-button ds-button--secondary", value: "cancel" }, spec.cancel);
    const confirm = element("button", { type: "button", class: spec.danger ? "ds-button ds-button--secondary ds-button--danger" : "ds-button ds-button--primary", value: "confirm" }, spec.confirm);
    if (cancel) footer.appendChild(cancel);
    footer.appendChild(confirm);
    dialog.appendChild(footer);

    const declined = spec.kind === "prompt" ? null : false;
    let settled = false;
    const finish = (confirmed: boolean) => {
      if (settled) return;
      settled = true;
      if (dialog.open) dialog.close();
      dialog.remove();
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      resolve(spec.kind === "alert" ? true : confirmed ? (input ? input.value : true) : declined);
    };

    confirm.addEventListener("click", () => finish(true));
    cancel?.addEventListener("click", () => finish(false));
    input?.addEventListener("keydown", event => {
      if (event.key !== "Enter" || event.isComposing || event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) return;
      event.preventDefault();
      finish(true);
    });
    dialog.addEventListener("cancel", event => { event.preventDefault(); finish(false); });
    // The browser can still close it (a second Escape): that is a cancel too.
    dialog.addEventListener("close", () => finish(false));

    // The backdrop is the dialog itself, outside its box; a press must start and end there.
    const outside = (event: MouseEvent) => {
      if (event.target !== dialog) return false;
      const box = dialog.getBoundingClientRect();
      return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
    };
    let pressedOutside = false;
    if (!spec.danger) {
      dialog.addEventListener("pointerdown", event => { pressedOutside = event.button === 0 && outside(event); });
      dialog.addEventListener("click", event => {
        if (pressedOutside && outside(event)) finish(false);
        pressedOutside = false;
      });
    }

    const first = input ?? (spec.danger ? cancel : undefined) ?? confirm;
    first.setAttribute("autofocus", "");
    document.body.appendChild(dialog);
    try {
      dialog.showModal();
    } catch {
      dialog.setAttribute("open", "");
    }
    first.focus();
    input?.select();
  });
}

/** In place of `alert()`: a message with one button. Resolves when it is dismissed. */
export function alert(options: AlertOptions | string): Promise<void> {
  const { title, text, confirm } = typeof options === "string" ? { title: options } as AlertOptions : options;
  if (typeof document === "undefined") return Promise.resolve();
  return inLine(() => show({ kind: "alert", title, text, confirm: confirm ?? feedbackWord("OK") })).then(() => undefined);
}

/** In place of `confirm()`: resolves to `true` when confirmed, `false` otherwise. */
export function confirm(options: ConfirmOptions | string): Promise<boolean> {
  const { title, text, confirm: yes, cancel, danger } = typeof options === "string" ? { title: options } as ConfirmOptions : options;
  if (typeof document === "undefined") return Promise.resolve(false);
  return inLine(() => show({ kind: "confirm", title, text, confirm: yes ?? feedbackWord("OK"), cancel: cancel ?? feedbackWord("Cancel"), danger })).then(answer => answer === true);
}

/** In place of `prompt()`: resolves to the text written, or `null` when cancelled. */
export function prompt(options: PromptOptions | string): Promise<string | null> {
  const { title, text, label, value = "", placeholder, confirm: yes, cancel } = typeof options === "string" ? { title: options } as PromptOptions : options;
  if (typeof document === "undefined") return Promise.resolve(null);
  return inLine(() => show({
    kind: "prompt", title, text,
    confirm: yes ?? feedbackWord("OK"), cancel: cancel ?? feedbackWord("Cancel"),
    field: { label, value, placeholder },
  })).then(answer => typeof answer === "string" ? answer : null);
}
