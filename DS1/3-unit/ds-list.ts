import { LitElement, html, nothing, unsafeCSS } from "lit";
import styles from "./styles/ds-list.css?inline";
import { define } from "../0-face/define";

/** Children that are never items of the list. */
const NOT_ITEMS = new Set(["template", "script", "style", "slot"]);
/** Controls keep their own role: a link or a button that became a list item would no longer be announced as one. */
const CONTROLS = new Set(["a", "button", "input", "select", "textarea", "summary", "details"]);

/**
 * A vertical stack of rows.
 *
 * The element is a list (`role="list"`) and each element directly inside it an
 * item (`role="listitem"`), unless the page gives either a role of its own.
 * A link, button or other control directly inside keeps its own role: wrap it
 * in a row (or another element) to make it an item.
 *
 * `heading` names the group on the square above its rows (a day, a month),
 * the words in the muted ink: the list takes it as its accessible name, so
 * the drawn words are hidden from assistive technology and a page that
 * writes its own `aria-label` keeps it.
 *
 * @element ds-list
 * @attr columns - Lay the items out in this many equal columns.
 * @attr heading - The group's name, drawn on the square above the rows and given to the list as its name.
 * @csspart heading - The heading's line.
 */
export class List extends LitElement {
  static properties = {
    columns: { type: Number, reflect: true },
    heading: { type: String, reflect: true },
  };

  declare columns: number | undefined;
  declare heading: string | undefined;

  static styles = unsafeCSS(styles);

  /** The items this element gave a role, so roles the page wrote are left alone. */
  private ownItems = new Set<Element>();
  private ownRole = false;
  /** Whether the list's `aria-label` is its heading, so the page's own name is never replaced. */
  private ownLabel = false;

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
      if (item.hasAttribute("role") || CONTROLS.has(item.localName)) continue;
      item.setAttribute("role", "listitem");
      this.ownItems.add(item);
    }
  };

  firstUpdated(): void {
    this.syncItems();
  }

  updated(changed: Map<string, unknown>): void {
    if (typeof this.columns === "number" && Number.isInteger(this.columns) && this.columns > 0) this.style.setProperty("--ds-list-columns", String(this.columns));
    else this.style.removeProperty("--ds-list-columns");
    if (changed.has("heading")) this.nameByHeading();
  }

  /** The heading names the list, unless the page wrote a name of its own. */
  private nameByHeading() {
    const heading = this.heading?.trim();
    if (heading && (this.ownLabel || !this.hasAttribute("aria-label"))) {
      this.setAttribute("aria-label", heading);
      this.ownLabel = true;
    } else if (!heading && this.ownLabel) {
      this.removeAttribute("aria-label");
      this.ownLabel = false;
    }
  }

  render() {
    const heading = this.heading?.trim();
    return html`${heading ? html`<span class="heading" part="heading" aria-hidden="true">${heading}</span>` : nothing}<slot @slotchange=${this.syncItems}></slot>`;
  }
}

define("ds-list", List);

declare global {
  interface HTMLElementTagNameMap {
    "ds-list": List;
  }
}
