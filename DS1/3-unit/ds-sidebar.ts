import { LitElement, html, nothing, unsafeCSS } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "../0-face/define";
import { treeStep } from "../0-face/sidebar";
import "../0-face/tooltips";
import "../2-core/ds-button";
import "../2-core/ds-icon";
import "./ds-row";
import styles from "./styles/ds-sidebar.css?inline";

/** Visible rows. The application owns hierarchy, expansion, selection and routing. */
export interface SidebarItem {
  id: string;
  /** Words a person reads; shown as written, never translated. */
  label: string;
  /** Decorative leading icon; the label remains the accessible name. */
  icon?: string;
  /** 0 for a row at the root; each level stands further in. */
  depth?: number;
  href?: string;
  /** `true` open, `false` closed; leave it out for a leaf. */
  expanded?: boolean;
  /** The destination being shown (navigation). */
  current?: boolean;
  /** The row chosen (a tree). */
  selected?: boolean;
  disabled?: boolean;
  /** Small muted words at the row's end: a count, a size. */
  meta?: string;
  action?: { id: string; label: string };
}

/**
 * Compact navigation composed from Row, Button and Icon: the application's
 * places, each row a link or a button and its own Tab stop. A label cut
 * short by the column's width shows in full in the shared tooltip
 * (`data-tooltip`, drawn by `0-face/tooltips.ts`); a label that fits carries
 * none, and no row carries the browser's `title`.
 *
 * With `tree`, it is a tree of the things inside one place (files, groups, a
 * page's parts): rows one square high, each level one square further in, a
 * disclosure arrow on its own square before each label. `role="tree"` with
 * one `role="treeitem"` per row, `aria-level`, `aria-expanded` and
 * `aria-selected`; one Tab stop, the keyboard of the tree pattern (see
 * `0-face/sidebar.ts`). The application keeps the rows: it passes the
 * visible ones in `items`, in order, and answers the events.
 *
 * @element ds-sidebar
 * @attr label - The navigation's or the tree's accessible name.
 * @attr tree - A tree of nested things instead of navigation.
 * @fires sidebar-toggle - `{ id, expanded }`: a row asks to open or close.
 * @fires sidebar-activate - `{ id }`: a row was pressed (navigation), or Enter or a double click opened one (a tree).
 * @fires sidebar-select - `{ id }`: a click, Space or Enter chose a tree row.
 * @fires sidebar-action - `{ id, action }`: a row's own action was pressed.
 */
export class Sidebar extends LitElement {
  static properties = {
    items: { attribute: false },
    label: { type: String },
    empty: { type: String },
    expandIcon: { type: String, attribute: "expand-icon" },
    collapseIcon: { type: String, attribute: "collapse-icon" },
    tree: { type: Boolean, reflect: true },
  };
  declare items: SidebarItem[];
  declare label: string;
  declare empty: string;
  /** Optional navigation disclosure pair; tree navigation keeps its directional arrow. */
  declare expandIcon?: string;
  declare collapseIcon?: string;
  declare tree: boolean;
  static styles = unsafeCSS(styles);

  /** In a tree, the row that holds the Tab stop. */
  private focusId?: string;

  constructor() {
    super();
    this.items = [];
    this.label = "Navigation";
    this.empty = "No items";
    this.tree = false;
  }

  private resizeObserver?: ResizeObserver;
  private fontsReady = false;

  connectedCallback() {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver ??= new ResizeObserver(() => this.markCutLabels());
      this.resizeObserver.observe(this);
    }
    // Labels measured before the typeface arrives are measured again once it has.
    const fonts = this.fontsReady ? undefined : document.fonts?.ready;
    if (fonts) void fonts.then(() => { this.fontsReady = true; this.markCutLabels(); });
  }

  disconnectedCallback() {
    this.resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  updated() {
    this.markCutLabels();
  }

  /** Only a label that does not fit its row gets a tooltip, holding the whole label. */
  private markCutLabels() {
    const labels = new Map(this.items.map(item => [item.id, item.label]));
    this.renderRoot.querySelectorAll<HTMLElement>("[data-item]").forEach(control => {
      const name = control.querySelector<HTMLElement>(".name");
      const label = labels.get(control.dataset.item ?? "");
      if (label && name && name.scrollWidth > name.clientWidth) control.dataset.tooltip = label;
      else delete control.dataset.tooltip;
    });
  }

  private request(name: string, detail: object): boolean {
    return this.dispatchEvent(new CustomEvent(`sidebar-${name}`, { detail, bubbles: true, composed: true, cancelable: true }));
  }

  private toggle(item: SidebarItem) {
    this.request("toggle", { id: item.id, expanded: !item.expanded });
  }

  private activate(event: MouseEvent, item: SidebarItem) {
    if (item.disabled) { event.preventDefault(); return; }
    // Let native links retain new-tab, download and context-menu behaviour.
    if (item.href && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
    if (!item.href && item.expanded !== undefined) { this.toggle(item); return; }
    if (!this.request("activate", { id: item.id })) event.preventDefault();
  }

  /** Moves the focus to a row after `updateComplete`. */
  focusItem(id: string) {
    const row = this.row(id);
    if (!row) return;
    if (this.tree) { this.focusId = id; this.requestUpdate(); row.tabIndex = 0; }
    row.focus();
  }

  /** Scrolls the current destination, or the selected tree row, into view. */
  scrollToCurrent() {
    this.renderRoot.querySelector('[aria-current="page"], [aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }

  /** The row a pointer or keyboard event happened on, for a context menu or a drag of the application's own. */
  itemFromEvent(event: Event): SidebarItem | undefined {
    const row = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && node.dataset.item !== undefined && this.renderRoot.contains(node));
    return row ? this.items.find(item => item.id === row.dataset.item) : undefined;
  }

  private row(id: string) {
    return [...this.renderRoot.querySelectorAll<HTMLElement>("[data-item]")].find(row => row.dataset.item === id);
  }

  /** A tree's Tab stop: the row last focused while it is still shown, else the selected row, else the first available. */
  private stop() {
    const usable = this.items.filter(item => !item.disabled);
    return usable.find(item => item.id === this.focusId)?.id ?? usable.find(item => item.selected)?.id ?? usable[0]?.id;
  }

  private press(event: MouseEvent, item: SidebarItem) {
    if (item.disabled) return;
    this.focusItem(item.id);
    const disclosure = event.composedPath().some(node => node instanceof HTMLElement && node.classList.contains("disclosure"));
    if (disclosure && item.expanded !== undefined) this.request("toggle", { id: item.id, expanded: !item.expanded });
    else this.request("select", { id: item.id });
  }

  private open(event: MouseEvent, item: SidebarItem) {
    if (item.disabled || event.composedPath().some(node => node instanceof HTMLElement && node.classList.contains("disclosure"))) return;
    this.request("activate", { id: item.id });
  }

  private treeKeydown(event: KeyboardEvent, item: SidebarItem) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = this.items.indexOf(item);
    const step = treeStep(this.items.map(row => ({ level: Math.max(0, row.depth ?? 0) + 1, expanded: row.expanded, disabled: row.disabled, label: row.label })), index, event.key);
    if (!step) return;
    event.preventDefault();
    if (step.toggle !== undefined) this.request("toggle", { id: item.id, expanded: step.toggle });
    if (step.select) this.request("select", { id: item.id });
    if (step.activate) this.request("activate", { id: item.id });
    const target = step.focus === undefined ? undefined : this.items[step.focus];
    if (target) this.focusItem(target.id);
  }

  private renderTree() {
    const stop = this.stop();
    // Each row's place among its siblings, for aria-setsize and aria-posinset.
    const places = new Map<string, [number, number]>();
    const open: SidebarItem[][] = [];
    for (const item of this.items) {
      const depth = Math.max(0, item.depth ?? 0);
      open.length = depth + 1;
      const siblings = (open[depth] ??= []);
      siblings.push(item);
      for (const [index, sibling] of siblings.entries()) places.set(sibling.id, [index + 1, siblings.length]);
    }
    return html`<slot name="header"></slot><div class="tree" role="tree" aria-label=${ifDefined(this.label || undefined)} part="tree">
      ${repeat(this.items, item => item.id, item => {
        const depth = Math.max(0, item.depth ?? 0);
        const [position, size] = places.get(item.id) ?? [1, 1];
        return html`<div class="item" role="treeitem" data-item=${item.id}
          aria-level=${depth + 1} aria-setsize=${size} aria-posinset=${position}
          aria-expanded=${ifDefined(item.expanded === undefined ? undefined : String(item.expanded))}
          aria-selected=${String(Boolean(item.selected))}
          aria-disabled=${ifDefined(item.disabled ? "true" : undefined)}
          tabindex=${item.id === stop ? 0 : -1}
          style=${`--depth:${depth}`}
          @click=${(event: MouseEvent) => this.press(event, item)}
          @dblclick=${(event: MouseEvent) => this.open(event, item)}
          @keydown=${(event: KeyboardEvent) => this.treeKeydown(event, item)}
          @focus=${() => { this.focusId = item.id; }}>
          <span class="disclosure" aria-hidden="true">${item.expanded === undefined ? nothing : html`<ds-icon type="right" ?data-open=${item.expanded}></ds-icon>`}</span>
          ${item.icon ? html`<span class="icon" aria-hidden="true"><ds-icon type=${item.icon}></ds-icon></span>` : nothing}
          <span class="label">${item.label}</span>
          ${item.meta ? html`<span class="meta">${item.meta}</span>` : nothing}
        </div>`;
      })}
      ${this.items.length ? nothing : html`<p class="empty" role="status">${this.empty}</p>`}
    </div><slot name="footer"></slot>`;
  }

  private navigate(event: KeyboardEvent, item: SidebarItem) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const index = this.items.indexOf(item);
    let target: SidebarItem | undefined;
    const available = this.items.filter(row => !row.disabled);
    const position = available.indexOf(item);
    if (event.key === "ArrowDown") target = available[Math.min(position + 1, available.length - 1)];
    else if (event.key === "ArrowUp") target = available[Math.max(position - 1, 0)];
    else if (event.key === "Home") target = available[0];
    else if (event.key === "End") target = available[available.length - 1];
    else if (event.key === "ArrowRight") {
      if (item.expanded === false) this.toggle(item);
      else if (item.expanded && (this.items[index + 1]?.depth ?? 0) > (item.depth ?? 0)) target = this.items[index + 1];
    } else if (event.key === "ArrowLeft") {
      if (item.expanded) this.toggle(item);
      else target = this.items.slice(0, index).reverse().find(row => (row.depth ?? 0) < (item.depth ?? 0) && !row.disabled);
    } else return;
    event.preventDefault();
    if (target && !target.disabled) this.focusItem(target.id);
  }

  render() {
    if (this.tree) return this.renderTree();
    return html`<slot name="header"></slot><nav aria-label=${this.label}>
      ${repeat(this.items, item => item.id, item => html`
        <ds-row class="row" ?data-current=${item.current} ?data-disabled=${item.disabled}
          style=${`--depth:${Math.max(0, item.depth ?? 0)}`}>
          <ds-button control="slotted" class="choice" ?disabled=${item.disabled}>
            ${item.href && !item.disabled ? html`
              <a href=${item.href} data-item=${item.id} aria-current=${ifDefined(item.current ? "page" : undefined)}
                @click=${(event: MouseEvent) => this.activate(event, item)}
                @keydown=${(event: KeyboardEvent) => this.navigate(event, item)}><span class="name">${item.icon ? html`<ds-icon type=${item.icon} aria-hidden="true"></ds-icon>` : nothing}${item.label}</span></a>` : html`
              <button type="button" data-item=${item.id} ?disabled=${item.disabled}
                aria-expanded=${ifDefined(item.expanded === undefined ? undefined : String(item.expanded))}
                aria-current=${ifDefined(item.current ? "page" : undefined)}
                @click=${(event: MouseEvent) => this.activate(event, item)}
                @keydown=${(event: KeyboardEvent) => this.navigate(event, item)}><span class="name">${item.icon ? html`<ds-icon type=${item.icon} aria-hidden="true"></ds-icon>` : nothing}${item.label}</span></button>`}
          </ds-button>
          ${item.expanded !== undefined ? html`
            <ds-button control="slotted" icon class="disclosure">
              <button type="button" aria-label=${`${item.expanded ? "Collapse" : "Expand"} ${item.label}`}
                aria-expanded=${item.expanded} @click=${() => this.toggle(item)}>
                <ds-icon type=${(item.expanded ? this.collapseIcon : this.expandIcon) || "right"} aria-hidden="true" ?data-open=${item.expanded && !this.collapseIcon}></ds-icon>
              </button>
            </ds-button>` : nothing}
          <span class="spacer" aria-hidden="true"></span>
          ${item.meta ? html`<span class="meta">${item.meta}</span>` : nothing}
          ${item.action ? html`<ds-button control="slotted" fit class="action"><button type="button"
            aria-label=${`${item.action.label}: ${item.label}`}
            @click=${() => this.request("action", { id: item.id, action: item.action!.id })}>${item.action.label}</button></ds-button>` : nothing}
        </ds-row>`)}
      ${this.items.length ? nothing : html`<p class="empty" role="status">${this.empty}</p>`}
    </nav><slot name="footer"></slot>`;
  }
}

define("ds-sidebar", Sidebar);
declare global { interface HTMLElementTagNameMap { "ds-sidebar": Sidebar } }
