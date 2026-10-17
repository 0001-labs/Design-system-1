import { LitElement, html, unsafeCSS, type PropertyValues } from "lit";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "../0-face/define";
import { attachDrawer, type Drawer } from "../0-face/drawer";
import { getText } from "../0-face/i18n";
import "../2-core/ds-icon";
import controls from "../1-root/controls.css?inline";
import styles from "./styles/ds-page.css?inline";

export type PageLayout = "sidebar" | "split" | "inspector" | "column" | "centered" | "tiles";
export const PAGE_LAYOUTS: readonly PageLayout[] = ["sidebar", "split", "inspector", "column", "centered", "tiles"];

/**
 * A standard page: where units stand on the grid. Every layout uses the same
 * five areas, so content can move between layouts without being rewritten.
 *
 * - `slot="header"` runs along the top of the main area
 * - `slot="nav"` is the leading column: navigation, or the list in `split`
 * - the default slot is the main area
 * - `slot="aside"` is the trailing column, shown by `inspector`
 * - `slot="footer"` runs along the bottom of the main area
 *
 * Columns are whole squares: `sidebar` and `inspector` lead with 12, `split`
 * with 16; `column` is 32 wide and `centered` 16, and `measure` sets either in
 * whole squares. A centred column stands on a whole square: the room beside it
 * is rounded down to squares, so the column never straddles a grid line.
 * `tiles` places each main child in a 12-square tile. Below 30 squares of
 * width every layout stacks.
 *
 * With `drawer`, the navigation folds away below 30 squares instead of
 * standing above the work: a menu button one square wide stands before the
 * header and opens it in a drawer over the page (0-face/drawer.ts, the
 * header's), with focus kept inside, closed by Escape, its close button, a
 * link or the page widening, and the page's scroll held behind it.
 *
 * @element ds-page
 * @attr layout - `sidebar`, `split`, `inspector`, `column`, `centered` or `tiles`.
 * @attr divided - Draws a hairline between the columns.
 * @attr measure - Width of the `column` or `centered` column in whole squares.
 * @attr fill - Takes its container's height; each column scrolls on its own.
 * @attr view - Labels each area with its slot name, for inspection.
 * @attr drawer - Folds the navigation into a drawer on a narrow page.
 * @attr drawer-label - The menu button's and drawer's name: a translation key, the shared word "Menu" by default.
 * @fires ds-page-drawer - The drawer opened or closed; `detail.open` says which.
 *
 * @example
 * <ds-page layout="sidebar">
 *   <ds-sidebar slot="nav" label="Projects"></ds-sidebar>
 *   <ds-row slot="header" fill>…</ds-row>
 *   <ds-list>…</ds-list>
 * </ds-page>
 */
export class Page extends LitElement {
  static properties = {
    layout: { type: String, reflect: true },
    divided: { type: Boolean, reflect: true },
    measure: { type: Number, reflect: true },
    fill: { type: Boolean, reflect: true },
    view: { type: Boolean, reflect: true },
    drawer: { type: Boolean, reflect: true },
    drawerLabel: { type: String, attribute: "drawer-label" },
  };

  declare layout: PageLayout;
  declare divided: boolean;
  declare measure: number | undefined;
  declare fill: boolean;
  declare view: boolean;
  declare drawer: boolean;
  declare drawerLabel: string | undefined;

  static styles = [unsafeCSS(controls), unsafeCSS(styles)];

  private navigationDrawer: Drawer | null = null;
  private readonly relabel = () => this.requestUpdate();

  constructor() {
    super();
    this.layout = "sidebar";
    this.divided = false;
    this.fill = false;
    this.view = false;
    this.drawer = false;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }

  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    this.navigationDrawer?.destroy();
    this.navigationDrawer = null;
    super.disconnectedCallback();
  }

  /** Whether the navigation drawer is open. */
  get drawerOpen(): boolean {
    return this.navigationDrawer?.isOpen ?? false;
  }

  /** Open the navigation drawer (on a narrow page with `drawer`). */
  openDrawer(): void { this.navigationDrawer?.open(); }

  /** Close the navigation drawer. */
  closeDrawer(): void { this.navigationDrawer?.close(); }

  protected updated(changed: PropertyValues<this>) {
    super.updated(changed);
    if (!changed.has("drawer")) return;
    if (!this.drawer) {
      this.navigationDrawer?.destroy();
      this.navigationDrawer = null;
      return;
    }
    const root = this.renderRoot;
    const toggle = root.querySelector<HTMLElement>('[part="drawer-toggle"]');
    const panel = root.querySelector<HTMLDialogElement>('[part="drawer"]');
    const nav = root.querySelector('[part="nav"]');
    if (!toggle || !panel || !nav || this.navigationDrawer) return;
    this.navigationDrawer = attachDrawer({
      toggle, panel, content: [nav],
      onToggle: open => this.dispatchEvent(new CustomEvent("ds-page-drawer", { bubbles: true, composed: true, detail: { open } })),
    });
  }

  render() {
    const label = getText(this.drawerLabel || "Menu") || this.drawerLabel || "Menu";
    const close = getText("Close") || "Close";
    return html`
      <div class="page" part="page" style=${ifDefined(measureStyle(this.measure))}>
        <div class="bar" part="bar" ?hidden=${!this.drawer}>
          <button class="ds-button ds-button--icon" part="drawer-toggle" type="button" aria-label=${label} aria-controls="drawer">
            <ds-icon type="menu" size="large" aria-hidden="true"></ds-icon><ds-icon type="close" size="large" aria-hidden="true"></ds-icon>
          </button>
        </div>
        <dialog class="ds-dialog ds-drawer" part="drawer" id="drawer" aria-label=${label}>
          <div class="ds-drawer__bar"><button class="ds-button ds-button--icon ds-drawer__close" part="drawer-close" type="button" aria-label=${close}>
            <ds-icon type="close" size="large" aria-hidden="true"></ds-icon>
          </button></div>
        </dialog>
        <div class="area nav" part="nav" data-area="nav"><slot name="nav"></slot></div>
        <div class="area header" part="header" data-area="header"><slot name="header"></slot></div>
        <div class="area main" part="main" data-area="main"><slot></slot></div>
        <div class="area aside" part="aside" data-area="aside"><slot name="aside"></slot></div>
        <div class="area footer" part="footer" data-area="footer"><slot name="footer"></slot></div>
      </div>
    `;
  }

  firstUpdated() {
    // An area with nothing in it takes no room, so a header or footer is optional.
    this.renderRoot.querySelectorAll("slot").forEach(slot => {
      const sync = () => slot.parentElement?.toggleAttribute("data-empty", slot.assignedNodes({ flatten: true }).every(empty));
      slot.addEventListener("slotchange", sync);
      sync();
    });
  }
}

/**
 * A measure is a count of squares: 28 is 28 squares, never 28.5 or 28px. A
 * fraction rounds to the nearest square, and anything that is not a positive
 * number is ignored so the layout keeps its own width.
 */
export function measureStyle(measure: number | null | undefined): string | undefined {
  const squares = Math.round(Number(measure));
  return Number.isFinite(squares) && squares >= 1 ? `--ds-page-measure: calc(${squares} * var(--ds-unit))` : undefined;
}

function empty(node: Node): boolean {
  return node.nodeType === Node.TEXT_NODE ? !node.textContent?.trim() : node.nodeType !== Node.ELEMENT_NODE;
}

define("ds-page", Page);

declare global {
  interface HTMLElementTagNameMap {
    "ds-page": Page;
  }
}
