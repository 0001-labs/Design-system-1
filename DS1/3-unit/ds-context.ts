import { unsafeCSS, type PropertyValues } from "lit";
import { define } from "../0-face/define";
import menuStyles from "./styles/ds-menu.css?inline";
import styles from "./styles/ds-context.css?inline";
import { Menu, type MenuAnchor, type MenuCloseReason } from "./ds-menu";

const ROW = '[role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';
/** A refused change shows on its row this long, as Ezo shows it. */
const REFUSED = 1400;

/**
 * Context: the menu that opens where the pointer is. A right click, the
 * ContextMenu key or Shift+F10, or a touch held half a second on the element
 * `for` names (or `trigger`) opens it at that point, or at the control's foot
 * from the keyboard. `context-selector` delegates one menu to many rows of a
 * long list, and focus returns to the row that opened it.
 *
 * It wears Ezo's gap face: each row is black with white words in both themes
 * (the slate in dark, darker than the page), rows a pixel apart and groups two (an
 * `hr data-ds-menu-separator` between them, never a line), the page showing
 * through the gaps, the outer corners rounded as one silhouette, and an icon
 * at a row's end. A group left empty leaves no gap. A row hovered or focused
 * lightens, and the keyboard's focus rings it; a danger row (`data-danger`, or
 * a `ds-button danger`) is red. Choosing a row closes the menu unless the row
 * says `data-keep-open` or its click was prevented. `pending` holds every row
 * and the menu open while an answer is awaited; `refuse(row)` shows a refused
 * change on its row.
 *
 * `bar` lays the same rows side by side, the context bar over what is
 * selected: one row high, the cells a pixel apart and groups two, a cell
 * holding only an icon one square, a cell with words 4px in. It stands half a
 * square above its anchor (below when there is no room), its start at the
 * anchor's, and opens without taking the focus, so the writing keeps the
 * caret: `openOver(rect)`. ← and → move along it.
 */
export class Context extends Menu {
  static properties = {
    ...Menu.properties,
    pending: { type: Boolean, reflect: true },
    bar: { type: Boolean, reflect: true },
  };
  static styles = [unsafeCSS(menuStyles), unsafeCSS(styles)];
  /** Hold every row and keep the menu open while a chosen change is awaited. */
  declare pending: boolean;
  /** The context bar: the rows side by side, over what is selected. */
  declare bar: boolean;
  private quietObserver = new MutationObserver(() => this.quietSeparators());

  constructor() {
    super();
    this.pending = false;
    this.bar = false;
    this.triggerMode = "context";
    this.floating = true;
    this.closesOnChoice = true;
  }
  connectedCallback() {
    if (!this.hasAttribute("role")) this.setAttribute("role", "menu");
    super.connectedCallback();
    this.quietObserver.observe(this, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    this.quietSeparators();
  }
  disconnectedCallback() {
    this.quietObserver.disconnect();
    super.disconnectedCallback();
  }
  protected willUpdate(changed: PropertyValues) {
    // Always a context menu, always floating.
    this.triggerMode = "context";
    this.floating = true;
    // A menu hugs its words in whole squares; a bar is as long as its cells.
    this.toggleAttribute("data-ds-hug", !this.bar);
    if (this.bar) {
      this.setAttribute("aria-orientation", "horizontal");
      this.placement = "top";
      // The writing under a bar keeps the caret; the page moves the focus in with a key of its own.
      this.focusOnOpen = false;
    } else if (changed.has("bar")) {
      this.removeAttribute("aria-orientation");
      this.placement = "bottom";
      this.focusOnOpen = true;
    }
    super.willUpdate(changed);
  }
  updated() {
    super.updated();
    this.markIcons();
    // Pending holds the rows that were free, and frees only those again.
    for (const row of this.querySelectorAll<HTMLElement>(ROW)) {
      if (this.pending && row.getAttribute("aria-disabled") !== "true") { row.setAttribute("aria-disabled", "true"); row.dataset.dsContextHeld = ""; }
      else if (!this.pending && row.dataset.dsContextHeld !== undefined) { row.removeAttribute("aria-disabled"); delete row.dataset.dsContextHeld; }
    }
    this.toggleAttribute("aria-busy", this.pending);
  }

  /** While pending, the menu stays open; otherwise as any menu. */
  requestClose(reason: MenuCloseReason) {
    if (this.pending && reason !== "parent") return;
    super.requestClose(reason);
  }
  /** While pending, a chosen row does not close it either. */
  select() { if (!this.pending) super.select(); }

  /** Show that a chosen change was refused: its row turns red a moment. */
  refuse(row: HTMLElement) {
    row.setAttribute("data-ds-refused", "");
    setTimeout(() => row.removeAttribute("data-ds-refused"), REFUSED);
  }

  /** Open the bar over what is selected (a rectangle, or an element), keeping the focus where it is. */
  openOver(anchor: MenuAnchor) {
    this.anchor = anchor;
    this.open = true;
  }

  /** In a bar, a cell holding only an icon is one square. */
  private markIcons() {
    for (const row of this.querySelectorAll<HTMLElement>(ROW)) {
      if (row.closest("ds-context") !== this) continue;
      row.toggleAttribute("data-ds-context-icon", this.bar && !(row.textContent ?? "").trim() && !!row.querySelector("ds-icon, svg, img"));
    }
  }

  /** Groups without rows leave no gap: a separator first, last or after another is quiet. */
  private quietSeparators() {
    this.markIcons();
    let previousWasGap = true;
    const children = [...this.children] as HTMLElement[];
    const visible = children.filter(child => !child.hidden);
    for (const child of children) child.removeAttribute("data-ds-quiet");
    visible.forEach((child, index) => {
      const gap = child.matches("hr, [data-ds-menu-separator]");
      if (gap && (previousWasGap || index === visible.length - 1)) child.setAttribute("data-ds-quiet", "");
      if (!gap || !child.hasAttribute("data-ds-quiet")) previousWasGap = gap;
    });
  }
}

define("ds-context", Context);
declare global { interface HTMLElementTagNameMap { "ds-context": Context } }
