import { LitElement, html, nothing, unsafeCSS } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { define } from "../0-face/define";
import "../2-core/ds-button";
import "../2-core/ds-icon";
import "./ds-row";
import styles from "./styles/ds-sidebar.css?inline";

/** Visible navigation rows. The application owns hierarchy, expansion and routing. */
export interface SidebarItem {
  id: string;
  label: string;
  depth?: number;
  href?: string;
  expanded?: boolean;
  current?: boolean;
  disabled?: boolean;
  meta?: string;
  action?: { id: string; label: string };
}

/** Compact navigation composed from Row, Button and Icon. */
export class Sidebar extends LitElement {
  static properties = {
    items: { attribute: false },
    label: { type: String },
    empty: { type: String },
  };
  declare items: SidebarItem[];
  declare label: string;
  declare empty: string;
  static styles = unsafeCSS(styles);

  constructor() {
    super();
    this.items = [];
    this.label = "Navigation";
    this.empty = "No items";
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

  focusItem(id: string) {
    this.renderRoot.querySelectorAll<HTMLElement>("[data-item]").forEach(control => {
      if (control.dataset.item === id) control.focus();
    });
  }

  scrollToCurrent() {
    this.renderRoot.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest" });
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
    return html`<slot name="header"></slot><nav aria-label=${this.label}>
      ${repeat(this.items, item => item.id, item => html`
        <ds-row class="row" ?data-current=${item.current} ?data-disabled=${item.disabled}
          style=${`--depth:${Math.max(0, item.depth ?? 0)}`}>
          ${item.expanded !== undefined ? html`
            <ds-button control="slotted" icon class="disclosure">
              <button type="button" aria-label=${`${item.expanded ? "Collapse" : "Expand"} ${item.label}`}
                aria-expanded=${item.expanded} @click=${() => this.toggle(item)}>
                <ds-icon type="right" aria-hidden="true" ?data-open=${item.expanded}></ds-icon>
              </button>
            </ds-button>` : html`<span class="spacer" aria-hidden="true"></span>`}
          <ds-button control="slotted" class="choice" ?disabled=${item.disabled}>
            ${item.href && !item.disabled ? html`
              <a href=${item.href} data-item=${item.id} aria-current=${ifDefined(item.current ? "page" : undefined)}
                title=${item.label} @click=${(event: MouseEvent) => this.activate(event, item)}
                @keydown=${(event: KeyboardEvent) => this.navigate(event, item)}><span class="name">${item.label}</span></a>` : html`
              <button type="button" data-item=${item.id} ?disabled=${item.disabled}
                aria-expanded=${ifDefined(item.expanded === undefined ? undefined : String(item.expanded))}
                aria-current=${ifDefined(item.current ? "page" : undefined)} title=${item.label}
                @click=${(event: MouseEvent) => this.activate(event, item)}
                @keydown=${(event: KeyboardEvent) => this.navigate(event, item)}><span class="name">${item.label}</span></button>`}
          </ds-button>
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
