import { html } from "lit";
import { createPlainEditor } from "../../website/src/vendor/aa/aa.js";
import "../../website/src/vendor/aa/aa.css";
import { AppElement, defineElement } from "./lib/element";

/**
 * CSS stays exact plain text; Aa owns native editing, clipboard, undo and
 * selection. Each edit is a `stylesheet-change` with the whole text; a new
 * `value` from outside replaces it.
 */
export class AaStylesheet extends AppElement {
  static properties = { value: { type: String } };
  declare value: string;
  #editor: ReturnType<typeof createPlainEditor> | null = null;

  constructor() {
    super();
    this.value = "";
  }

  override firstUpdated() {
    const host = this.querySelector<HTMLElement>(".aa-stylesheet")!;
    const instance = createPlainEditor(host, { value: this.value, onChange: (text: string) => this.emit("stylesheet-change", text) });
    this.#editor = instance;
    const block = host.querySelector<HTMLElement>("[contenteditable]");
    block?.setAttribute("aria-label", "Editable CSS source");
    block?.setAttribute("role", "textbox");
    block?.setAttribute("aria-multiline", "true");
    instance.focus();
  }

  override updated() {
    if (this.#editor && this.#editor.value !== this.value) this.#editor.value = this.value;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#editor?.destroy();
    this.#editor = null;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Put back after a move in the page: the editor went with the last disconnection.
    if (this.hasUpdated && !this.#editor) {
      this.querySelector(".aa-stylesheet")?.replaceChildren();
      queueMicrotask(() => { if (this.isConnected && !this.#editor) this.firstUpdated(); });
    }
  }

  override render() {
    return html`<div class="aa-stylesheet" aria-label="Editable CSS source" data-testid="live-css-source"></div>`;
  }
}
defineElement("ds1-aa-stylesheet", AaStylesheet);
