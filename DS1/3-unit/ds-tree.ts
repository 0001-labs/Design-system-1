import { LitElement, html, nothing, unsafeCSS } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "../0-face/define";
import { treeStep } from "../0-face/tree";
import "../2-core/ds-icon";
import styles from "./styles/ds-tree.css?inline";

/** A visible row of the tree. The application owns the hierarchy, expansion and selection. */
export interface TreeItem {
  id: string;
  /** Words a person reads; shown as written, never translated. */
  label: string;
  /** 0 for a row at the root; each level stands one square further in. */
  depth?: number;
  /** `true` open, `false` closed; leave it out for a leaf. */
  expanded?: boolean;
  selected?: boolean;
  disabled?: boolean;
  /** An icon from the library on its own square before the label. */
  icon?: string;
  /** Small muted words at the row's end: a count, a size. */
  meta?: string;
}

/**
 * A tree: rows one square high, each level one square further in, a
 * disclosure arrow on its own square before each label. `role="tree"` with
 * one `role="treeitem"` per row, `aria-level`, `aria-expanded` and
 * `aria-selected`; one Tab stop, the keyboard of the tree pattern (see
 * `0-face/tree.ts`). The application keeps the rows: it passes the visible
 * ones in `items`, in order, and answers the events.
 *
 * @element ds-tree
 * @attr label - The tree's accessible name.
 * @fires ds-tree-toggle - `{ id, expanded }`: a row asks to open or close.
 * @fires ds-tree-select - `{ id }`: a click, Space or Enter chose a row.
 * @fires ds-tree-activate - `{ id }`: Enter or a double click opens a row.
 */
export class Tree extends LitElement {
  static properties = {
    items: { attribute: false },
    label: { type: String },
  };

  declare items: TreeItem[];
  declare label: string;

  static styles = unsafeCSS(styles);

  /** The row that holds the Tab stop. */
  private focusId?: string;

  constructor() {
    super();
    this.items = [];
    this.label = "";
  }

  private request(name: "toggle" | "select" | "activate", detail: object): boolean {
    return this.dispatchEvent(new CustomEvent(`ds-tree-${name}`, { detail, bubbles: true, composed: true, cancelable: true }));
  }

  /** The row a pointer or keyboard event happened on, for a context menu or a drag of the application's own. */
  itemFromEvent(event: Event): TreeItem | undefined {
    const row = event.composedPath().find((node): node is HTMLElement => node instanceof HTMLElement && node.dataset.item !== undefined && this.renderRoot.contains(node));
    return row ? this.items.find(item => item.id === row.dataset.item) : undefined;
  }

  /** Moves the focus to a row after `updateComplete`. */
  focusItem(id: string) {
    const row = this.row(id);
    if (!row) return;
    this.focusId = id;
    this.requestUpdate();
    row.tabIndex = 0;
    row.focus();
  }

  /** Scrolls the selected row into view. */
  scrollToSelected() {
    this.renderRoot.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }

  private row(id: string) {
    return [...this.renderRoot.querySelectorAll<HTMLElement>("[data-item]")].find(row => row.dataset.item === id);
  }

  /** The Tab stop: the row last focused while it is still shown, else the selected row, else the first available. */
  private stop() {
    const usable = this.items.filter(item => !item.disabled);
    return usable.find(item => item.id === this.focusId)?.id ?? usable.find(item => item.selected)?.id ?? usable[0]?.id;
  }

  private toggle(item: TreeItem, expanded: boolean) {
    this.request("toggle", { id: item.id, expanded });
  }

  private press(event: MouseEvent, item: TreeItem) {
    if (item.disabled) return;
    this.focusItem(item.id);
    const disclosure = event.composedPath().some(node => node instanceof HTMLElement && node.classList.contains("disclosure"));
    if (disclosure && item.expanded !== undefined) this.toggle(item, !item.expanded);
    else this.request("select", { id: item.id });
  }

  private open(event: MouseEvent, item: TreeItem) {
    if (item.disabled || event.composedPath().some(node => node instanceof HTMLElement && node.classList.contains("disclosure"))) return;
    this.request("activate", { id: item.id });
  }

  private keydown(event: KeyboardEvent, item: TreeItem) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const index = this.items.indexOf(item);
    const step = treeStep(this.items.map(row => ({ level: Math.max(0, row.depth ?? 0) + 1, expanded: row.expanded, disabled: row.disabled, label: row.label })), index, event.key);
    if (!step) return;
    event.preventDefault();
    if (step.toggle !== undefined) this.toggle(item, step.toggle);
    if (step.select) this.request("select", { id: item.id });
    if (step.activate) this.request("activate", { id: item.id });
    const target = step.focus === undefined ? undefined : this.items[step.focus];
    if (target) this.focusItem(target.id);
  }

  render() {
    const stop = this.stop();
    // Each row's place among its siblings, for aria-setsize and aria-posinset.
    const places = new Map<string, [number, number]>();
    const open: TreeItem[][] = [];
    for (const item of this.items) {
      const depth = Math.max(0, item.depth ?? 0);
      open.length = depth + 1;
      const siblings = (open[depth] ??= []);
      siblings.push(item);
      for (const [index, sibling] of siblings.entries()) places.set(sibling.id, [index + 1, siblings.length]);
    }
    return html`<div class="tree" role="tree" aria-label=${ifDefined(this.label || undefined)} part="tree">
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
          @keydown=${(event: KeyboardEvent) => this.keydown(event, item)}
          @focus=${() => { this.focusId = item.id; }}>
          <span class="disclosure" aria-hidden="true">${item.expanded === undefined ? nothing : html`<ds-icon type="right" ?data-open=${item.expanded}></ds-icon>`}</span>
          ${item.icon ? html`<span class="icon" aria-hidden="true"><ds-icon type=${item.icon}></ds-icon></span>` : nothing}
          <span class="label">${item.label}</span>
          ${item.meta ? html`<span class="meta">${item.meta}</span>` : nothing}
        </div>`;
      })}
    </div>`;
  }
}

define("ds-tree", Tree);

declare global {
  interface HTMLElementTagNameMap {
    "ds-tree": Tree;
  }
}
