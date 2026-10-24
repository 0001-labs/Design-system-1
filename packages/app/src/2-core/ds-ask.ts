// Ask: an on-page question, results and answer. Products own data and navigation.
import { LitElement, html, unsafeCSS } from "lit";
import styles from "./styles/ds-ask.css?inline";
export type AskRow = { kind: string; id: string; title: string; detail: string; icon: string };

export class Ask extends LitElement {
  static properties = {
    text: { type: String },
    open: { type: Boolean, reflect: true },
    state: { type: String, reflect: true },
    answer: { type: String },
    placeholder: { type: String },
    rows: { attribute: false },
    chosen: { type: Number },
    completion: { type: String },
  };

  static styles = [unsafeCSS(styles)];

  declare text: string;
  declare open: boolean;
  declare state: "writing" | "listening" | "thinking" | "answered" | "failed";
  declare answer: string;
  declare placeholder: string;
  declare rows: AskRow[];
  declare chosen: number;
  declare completion: string;

  constructor() {
    super();
    this.text = "";
    this.open = false;
    this.state = "writing";
    this.answer = "";
    this.placeholder = "";
    this.rows = [];
    this.chosen = 0;
    this.completion = "";
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener("pointerdown", this.dismiss);
  }

  disconnectedCallback() {
    this.removeEventListener("pointerdown", this.dismiss);
    super.disconnectedCallback();
  }

  private readonly dismiss = (event: PointerEvent) => {
    if (!this.open) return;
    // A row pressed opens it; anywhere else lets go.
    const row = event.composedPath().find((node) => node instanceof HTMLElement && node.dataset.index !== undefined) as HTMLElement | undefined;
    if (row) {
      event.preventDefault();
      event.stopPropagation();
      this.dispatchEvent(new CustomEvent("ask-choose", { detail: { index: Number(row.dataset.index) }, bubbles: true, composed: true }));
      return;
    }
    // The press is the pane's: the page under it neither opens nor selects.
    event.preventDefault();
    event.stopPropagation();
    this.dispatchEvent(new CustomEvent("ask-dismiss", { bubbles: true, composed: true }));
  };

  private line() {
    if (this.state === "listening")
      return html`<span class="dot" aria-hidden="true"></span>${this.text
        ? html`<span class="words heard">${this.text}</span>`
        : html`<span class="placeholder">${this.placeholder}</span>`}`;
    const caret = this.state === "writing" ? html`<span class="caret" aria-hidden="true"></span>` : null;
    if (!this.text && this.state === "writing")
      return html`${caret}<span class="placeholder">${this.placeholder}</span>`;
    return html`<span class="words">${this.text}</span>${this.state === "writing" && this.completion
      ? html`<span class="completion">${this.completion}</span>` : null}${caret}`;
  }

  private list() {
    if (this.state !== "writing" || !this.rows.length) return null;
    return html`<div class="rows" role="listbox">${this.rows.map((row, index) => html`
      <div class="row" role="option" data-index=${index} data-kind=${row.kind} aria-selected=${index === this.chosen ? "true" : "false"}>
        <ds-icon class="icon" type=${row.icon}></ds-icon>
        <span class="title">${row.title}</span>
        <span class="detail">${row.detail}</span>
      </div>`)}</div>`;
  }

  render() {
    const answered = this.state === "answered" || this.state === "failed";
    return html`<div class="stack">
      <div class="line" part="line">${this.line()}</div>
      ${this.list()}
      <div class="answer" part="answer" role="status" aria-live="polite">${answered ? this.answer : ""}</div>
    </div>`;
  }
}

if (!customElements.get("ds-ask")) customElements.define("ds-ask", Ask);

declare global {
  interface HTMLElementTagNameMap {
    "ds-ask": Ask;
  }
}
