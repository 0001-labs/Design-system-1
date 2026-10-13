import { LitElement, html, unsafeCSS } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { define } from "../0-face/define";
import styles from "./styles/ds-composer.css?inline";
import "./styles/ds-composer-frame.css";
import frameStyles from "./styles/ds-composer-frame.css?inline";

const styledRoots = new WeakSet<ShadowRoot>();
function styleRoot(root: Node) {
  if (!(root instanceof ShadowRoot) || styledRoots.has(root)) return;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(frameStyles);
  root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
  styledRoots.add(root);
}

export type TextHighlight = { start: number; end: number; color?: string };

/** A native writing field with metric-preserving highlights. Products own the
 * text and mention data; DS1 owns its face, growth and synchronized overlay.
 * Keeping the textarea in light DOM preserves native forms and ARIA ID refs.
 */
export class Composer extends LitElement {
  static properties = {
    highlights: { attribute: false },
    autoGrow: { type: Boolean, attribute: "auto-grow", reflect: true },
    maxRows: { type: Number, attribute: "max-rows" },
    variant: { type: String, reflect: true },
    text: { state: true },
  };
  static styles = unsafeCSS(styles);
  declare highlights: TextHighlight[];
  declare autoGrow: boolean;
  declare maxRows: number;
  declare variant: "field" | "plain";
  private declare text: string;
  private control: HTMLTextAreaElement | null = null;
  private form: HTMLFormElement | null = null;
  private frame = 0;
  private width = 0;
  private observer?: ResizeObserver;
  private mutations = new MutationObserver(() => this.refresh());
  private readonly edited = () => {
    this.refresh();
    // Controlled frameworks can restore a declined edit after input bubbles.
    queueMicrotask(() => { if (this.isConnected) this.refresh(); });
  };
  private readonly scrolled = () => this.syncScroll();
  private readonly reset = () => queueMicrotask(() => this.refresh());
  private readonly fontLoaded = () => this.refresh();

  constructor() {
    super();
    this.highlights = [];
    this.autoGrow = false;
    this.maxRows = 12;
    this.variant = "field";
    this.text = "";
  }

  connectedCallback() {
    super.connectedCallback();
    styleRoot(this.getRootNode());
    document.fonts?.addEventListener("loadingdone", this.fontLoaded);
    this.bindControl();
  }
  firstUpdated() { this.bindControl(); }
  disconnectedCallback() {
    this.releaseControl();
    document.fonts?.removeEventListener("loadingdone", this.fontLoaded);
    cancelAnimationFrame(this.frame);
    super.disconnectedCallback();
  }
  private releaseControl() {
    this.control?.removeEventListener("input", this.edited);
    this.control?.removeEventListener("change", this.edited);
    this.control?.removeEventListener("scroll", this.scrolled);
    this.form?.removeEventListener("reset", this.reset);
    this.form = null;
    this.observer?.disconnect();
    this.mutations.disconnect();
  }
  private bindControl() {
    this.releaseControl();
    this.control = Array.from(this.children).find(child => child.localName === "textarea") as HTMLTextAreaElement | undefined ?? null;
    const control = this.control;
    if (!control) { this.text = ""; return; }
    control.addEventListener("input", this.edited);
    control.addEventListener("change", this.edited);
    control.addEventListener("scroll", this.scrolled);
    this.mutations.observe(control, { attributes: true, attributeFilter: ["rows", "wrap", "dir", "form"], childList: true, characterData: true, subtree: true });
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(entries => {
        this.syncScroll();
        if (control.clientWidth !== this.width || entries.some(entry => entry.target !== control)) {
          this.width = control.clientWidth;
          this.refresh();
        }
      });
      this.observer.observe(control);
      const metric = this.shadowRoot?.querySelector(".row-metric");
      if (metric) this.observer.observe(metric);
    }
    this.refresh();
  }
  /** Call after programmatic native-value changes. React's adapter does this. */
  refresh() {
    const control = this.control;
    if (!control) return;
    if (this.form !== control.form) {
      this.form?.removeEventListener("reset", this.reset);
      this.form = control.form;
      this.form?.addEventListener("reset", this.reset);
    }
    this.text = control.value;
    this.style.setProperty("--composer-rows", String(Math.max(1, control.rows || 1)));
    this.toggleAttribute("data-nowrap", control.wrap === "off");
    this.requestUpdate();
  }
  updated() {
    this.toggleAttribute("data-highlighted", this.validHighlights().length > 0);
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      const control = this.control;
      if (!this.isConnected || !control) return;
      // Browsers may run microtasks between native and framework listeners.
      // Read the settled native value before painting a controlled edit.
      if (this.text !== control.value) { this.text = control.value; return; }
      if (this.autoGrow) {
        const row = this.shadowRoot!.querySelector(".row-metric")!.getBoundingClientRect().height || 20;
        const minimum = Math.max(1, control.rows || 1) * row;
        const maximum = Math.max(minimum, Math.floor(this.maxRows || 1) * row);
        const scrollTop = control.scrollTop;
        this.style.setProperty("--composer-height", "0px");
        const css = getComputedStyle(control);
        const border = parseFloat(css.borderTopWidth) + parseFloat(css.borderBottomWidth);
        const needed = Math.ceil((control.scrollHeight + border) / row) * row;
        this.style.setProperty("--composer-height", `${Math.max(minimum, Math.min(maximum, needed))}px`);
        this.style.setProperty("--composer-overflow", needed > maximum ? "auto" : "hidden");
        control.scrollTop = scrollTop;
      } else {
        this.style.removeProperty("--composer-height");
        this.style.removeProperty("--composer-overflow");
      }
      this.syncScroll();
    });
    this.syncScroll();
  }
  private syncScroll() {
    const mirror = this.shadowRoot?.querySelector<HTMLElement>(".mirror");
    const control = this.control;
    if (!mirror || !control) return;
    // clientWidth excludes the scrollbar, so both layers wrap at the same x.
    const css = getComputedStyle(control);
    mirror.style.width = `${control.clientWidth + parseFloat(css.borderLeftWidth) + parseFloat(css.borderRightWidth)}px`;
    mirror.style.height = `${control.offsetHeight}px`;
    mirror.style.left = `${control.offsetLeft}px`;
    mirror.style.top = `${control.offsetTop}px`;
    mirror.dir = control.dir;
    mirror.scrollTop = control.scrollTop;
    mirror.scrollLeft = control.scrollLeft;
  }
  private validHighlights() {
    let end = 0;
    return [...(this.highlights ?? [])]
      .filter(range => Number.isInteger(range.start) && Number.isInteger(range.end) && range.start >= 0 && range.end > range.start && range.end <= this.text.length)
      .sort((a, b) => a.start - b.start || b.end - a.end)
      .filter(range => { if (range.start < end) return false; end = range.end; return true; });
  }
  focus(options?: FocusOptions) { this.control?.focus(options); }
  render() {
    let cursor = 0;
    const parts = this.validHighlights().map(range => {
      const before = this.text.slice(cursor, range.start);
      cursor = range.end;
      return html`${before}<mark style=${styleMap({ "--composer-highlight-color": range.color || undefined })}>${this.text.slice(range.start, range.end)}</mark>`;
    });
    return html`<span class="row-metric" aria-hidden="true"></span><slot @slotchange=${this.bindControl}></slot><div class="mirror" aria-hidden="true">${parts}${this.text.slice(cursor)}${"\n"}</div>`;
  }
}
define("ds-composer", Composer);
declare global { interface HTMLElementTagNameMap { "ds-composer": Composer } }
