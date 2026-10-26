// Ask: an on-page question, results and answer. Products own data and navigation.
// The results stand as cards in a strip at the foot of the window, the words
// under them, over a blur that deepens towards the foot so the page above
// stays in view.
import { LitElement, html, nothing, unsafeCSS, type PropertyValues } from "lit";
import styles from "./styles/ds-ask.css?inline";

/** What a card shows of the thing it opens: a peek at that page. */
export type AskPreview =
  /** Lines of a list, one square each; done ones muted. */
  | { type: "lines"; lines: { text: string; done?: boolean }[] }
  /** A note's words, on lines of a square, fading where they are cut. */
  | { type: "text"; text: string }
  /** A picture: `cover` fills the card's middle, `contain` (a logo) stands in it. */
  | { type: "picture"; src: string; fit?: "cover" | "contain" }
  /** A month, a square a day; `marks` are days with something on them. */
  | { type: "month"; year: number; month: number; marks?: number[]; weekStart?: 0 | 1 };

export type AskRow = {
  kind: string;
  id: string;
  title: string;
  detail: string;
  icon: string;
  /** The card's head: what kind of thing it is ("List", "Client"). Without it the detail heads the card. */
  label?: string;
  /** Under the title at the card's foot: where it is, or how much is in it. */
  caption?: string;
  /** A palette colour for the head (`sharp-blue`, `apple-green`, …). */
  tone?: string;
  preview?: AskPreview;
};

const WEEKS = 6;

/** The days of a month as weeks, each day its date, or null before the first and after the last. */
export function monthWeeks(year: number, month: number, weekStart: 0 | 1 = 1): (number | null)[][] {
  const first = new Date(year, month - 1, 1).getDay();
  const lead = (first - weekStart + 7) % 7;
  const days = new Date(year, month, 0).getDate();
  const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, day) => day + 1)];
  const weeks: (number | null)[][] = [];
  for (let start = 0; start < cells.length && weeks.length < WEEKS; start += 7)
    weeks.push(Array.from({ length: 7 }, (_, day) => cells[start + day] ?? null));
  return weeks;
}

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
    this.addEventListener("wheel", this.slide, { passive: false });
  }

  disconnectedCallback() {
    this.removeEventListener("pointerdown", this.dismiss);
    this.removeEventListener("wheel", this.slide);
    super.disconnectedCallback();
  }

  private readonly dismiss = (event: PointerEvent) => {
    if (!this.open) return;
    // A card pressed opens it; anywhere else lets go.
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

  /** A wheel turned over the strip moves it sideways; elsewhere the page under the blur scrolls. */
  private readonly slide = (event: WheelEvent) => {
    const strip = this.renderRoot.querySelector<HTMLElement>(".cards");
    if (!this.open || !strip || !event.composedPath().includes(strip)) return;
    event.preventDefault();
    strip.scrollLeft += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  };

  protected updated(changed: PropertyValues) {
    super.updated(changed);
    if (changed.has("rows") || changed.has("state")) this.markCuts();
    if (changed.has("chosen") || changed.has("rows")) this.reveal();
  }

  /** Words cut by their card fade over their last square, only while cut. */
  private markCuts() {
    for (const words of this.renderRoot.querySelectorAll<HTMLElement>(".prose, .lines"))
      words.toggleAttribute("data-cut", words.scrollHeight > words.clientHeight + 1);
  }

  /** The chosen card stands whole in the strip. */
  private reveal() {
    const strip = this.renderRoot.querySelector<HTMLElement>(".cards");
    const card = strip?.querySelector<HTMLElement>(`[data-index="${this.chosen}"]`);
    if (!strip || !card) return;
    const room = parseFloat(getComputedStyle(strip).scrollPaddingInlineStart) || 0;
    const start = card.offsetLeft - room;
    const end = card.offsetLeft + card.offsetWidth + room - strip.clientWidth;
    const left = strip.scrollLeft > start ? start : strip.scrollLeft < end ? end : strip.scrollLeft;
    if (left === strip.scrollLeft) return;
    const smooth = typeof matchMedia === "function" && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo?.({ left, behavior: smooth ? "smooth" : "auto" });
  }

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

  private preview(row: AskRow) {
    const preview = row.preview;
    if (!preview) return html`<div class="prose named">${row.title}</div>`;
    if (preview.type === "lines")
      return html`<div class="lines">${preview.lines.map((line) => html`<div class="entry" ?data-done=${line.done}>${line.text}</div>`)}</div>`;
    if (preview.type === "text") return html`<div class="prose">${preview.text}</div>`;
    if (preview.type === "picture")
      return html`<img class="picture" data-fit=${preview.fit ?? "cover"} src=${preview.src} alt="" decoding="async" draggable="false" />`;
    const marks = new Set(preview.marks ?? []);
    const now = new Date();
    const today = now.getFullYear() === preview.year && now.getMonth() + 1 === preview.month ? now.getDate() : 0;
    return html`<div class="month">${monthWeeks(preview.year, preview.month, preview.weekStart ?? 1).map((week) =>
      week.map((day) => html`<span class="day" ?data-mark=${day !== null && marks.has(day)} ?data-today=${day !== null && day === today}>${day ?? ""}</span>`))}</div>`;
  }

  private cards() {
    if (this.state !== "writing" || !this.rows.length) return null;
    return html`<div class="cards" role="listbox" aria-label="Results">${this.rows.map((row, index) => html`
      <div class="card" role="option" data-index=${index} data-kind=${row.kind} data-tone=${row.tone ?? nothing}
        aria-selected=${index === this.chosen ? "true" : "false"} aria-label=${`${row.label ?? row.detail}: ${row.title}`}
        style=${`--ds-ask-distance: ${Math.abs(index - this.chosen)}`}>
        <div class="head">
          <span class="label">${row.label ?? row.detail}</span>
          <ds-icon class="icon" type=${row.icon}></ds-icon>
          <span class="detail">${row.label ? row.detail : ""}</span>
        </div>
        <div class="body" data-preview=${row.preview?.type ?? "title"}>${this.preview(row)}</div>
        <div class="foot">
          <span class="title">${row.title}</span>
          <span class="caption">${row.caption ?? ""}</span>
        </div>
      </div>`)}</div>`;
  }

  render() {
    const answered = this.state === "answered" || this.state === "failed";
    return html`<div class="veil" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <div class="dock">
        ${this.cards()}
        <div class="answer" part="answer" role="status" aria-live="polite">${answered ? this.answer : ""}</div>
        <div class="line" part="line">${this.line()}</div>
      </div>`;
  }
}

if (!customElements.get("ds-ask")) customElements.define("ds-ask", Ask);

declare global {
  interface HTMLElementTagNameMap {
    "ds-ask": Ask;
  }
}
