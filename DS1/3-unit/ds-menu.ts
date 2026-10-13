import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import styles from "./styles/ds-menu.css?inline";

const ITEM =
  '[role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

/**
 * A floating list of choices: a picker's options or a menu's items, on Design system 1
 * paper. Compact menus use the same single-square rows as a list.
 *
 * The choices are `ds-button`s with `role="option"` (the chosen one `active`
 * and `aria-selected="true"`) or `role="menuitem"`. The arrow keys, Home and
 * End move focus between them. Where the menu sits, and when it closes, is the
 * page's to decide.
 *
 * The element is a `listbox` unless it says otherwise.
 *
 * @element ds-menu
 *
 * @example
 * <ds-menu aria-label="Font">
 *   <ds-button role="option" active aria-selected="true">GT America</ds-button>
 *   <ds-button role="option" aria-selected="false">Inter</ds-button>
 * </ds-menu>
 */
export class Menu extends LitElement {
  static styles = unsafeCSS(styles);
  static properties = { compact: { type: Boolean, reflect: true } };
  declare compact: boolean;

  constructor() {
    super();
    this.compact = false;
    this.addEventListener("keydown", this.#onKeyDown);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listbox");
  }

  /** Expose the slot before gesture-time focus in an immediately opened panel. */
  renderNow(): void { this.performUpdate(); }

  #items(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>(ITEM)).filter(
      (item) => !item.hasAttribute("disabled") && item.getAttribute("aria-disabled") !== "true" && !item.closest('[hidden], [inert]') && item.closest('ds-menu') === this,
    );
  }

  #onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.isComposing) return;
    if (event.composedPath().some(node => node instanceof HTMLElement && (node.isContentEditable || node.matches('input, textarea, select, [role="textbox"], [role="combobox"]')))) return;
    if (event.composedPath().find(node => node instanceof Menu) !== this) return;
    const items = this.#items();
    if (items.length === 0) return;
    const current = items.findIndex((item) => event.composedPath().includes(item));
    let next: number;
    switch (event.key) {
      case "ArrowDown":
        next = current < 0 ? 0 : (current + 1) % items.length;
        break;
      case "ArrowUp":
        next = current < 0 ? items.length - 1 : (current - 1 + items.length) % items.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    items[next]?.focus();
  };

  render() {
    return html`<slot></slot>`;
  }
}

define("ds-menu", Menu);

declare global {
  interface HTMLElementTagNameMap {
    "ds-menu": Menu;
  }
}
