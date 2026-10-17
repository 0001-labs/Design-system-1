import { LitElement, html, unsafeCSS } from "lit";
import styles from "./styles/ds-list.css?inline";
import { define } from "../0-face/define";

/** Children that are never items of the list. */
const NOT_ITEMS = new Set(["template", "script", "style", "slot"]);

/**
 * A vertical stack of rows.
 *
 * The element is a list (`role="list"`) and each element directly inside it an
 * item (`role="listitem"`), unless the page gives either a role of its own.
 *
 * @element ds-list
 * @attr columns - Lay the items out in this many equal columns.
 */
export class List extends LitElement {
  static properties = {
    columns: { type: Number, reflect: true },
  };

  declare columns: number | undefined;

  static styles = unsafeCSS(styles);

  /** The items this element gave a role, so roles the page wrote are left alone. */
  private ownItems = new Set<Element>();
  private ownRole = false;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) { this.setAttribute("role", "list"); this.ownRole = true; }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.ownRole && this.getAttribute("role") === "list") this.removeAttribute("role");
    this.ownRole = false;
  }

  private syncItems = () => {
    const slot = this.shadowRoot?.querySelector("slot");
    // Items only where the element is a list: a listbox or a page's own role
    // decides its children's roles itself.
    const list = this.getAttribute("role") === "list";
    const items = new Set(list && slot ? slot.assignedElements().filter(item => !NOT_ITEMS.has(item.localName)) : []);
    for (const item of this.ownItems) {
      if (items.has(item)) continue;
      if (item.getAttribute("role") === "listitem") item.removeAttribute("role");
      this.ownItems.delete(item);
    }
    for (const item of items) {
      if (item.hasAttribute("role")) continue;
      item.setAttribute("role", "listitem");
      this.ownItems.add(item);
    }
  };

  firstUpdated(): void {
    this.syncItems();
  }

  updated(): void {
    if (typeof this.columns === "number" && Number.isInteger(this.columns) && this.columns > 0) this.style.setProperty("--ds-list-columns", String(this.columns));
    else this.style.removeProperty("--ds-list-columns");
  }

  render() {
    return html`<slot @slotchange=${this.syncItems}></slot>`;
  }
}

define("ds-list", List);

declare global {
  interface HTMLElementTagNameMap {
    "ds-list": List;
  }
}
