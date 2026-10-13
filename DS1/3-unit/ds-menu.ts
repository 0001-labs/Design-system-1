import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import styles from "./styles/ds-menu.css?inline";

const ITEM =
  '[role="option"], [role="menuitem"], [role="menuitemradio"], [role="menuitemcheckbox"]';

/**
 * A floating list of choices: a picker's options or a menu's items, on Design system 1
 * paper with a border and a shadow.
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

  constructor() {
    super();
    this.addEventListener("keydown", this.#onKeyDown);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute("role")) this.setAttribute("role", "listbox");
  }

  #items(): HTMLElement[] {
    return Array.from(this.querySelectorAll<HTMLElement>(ITEM)).filter(
      (item) => !item.hasAttribute("disabled"),
    );
  }

  #onKeyDown = (event: KeyboardEvent): void => {
    const items = this.#items();
    if (items.length === 0) return;
    const current = items.findIndex((item) => item.contains(document.activeElement));
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
