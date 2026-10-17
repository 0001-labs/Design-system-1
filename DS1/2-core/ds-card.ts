// ds-card.ts
// Card component for displaying content in a contained box

import { LitElement, html, css } from "lit";

export class Card extends LitElement {
  static properties = {
    variant: { type: String, reflect: true },
    elevation: { type: Number, reflect: true },
    interactive: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    padding: { type: String, reflect: true },
  };

  declare variant: "default" | "outlined" | "elevated" | "filled";
  declare elevation: number;
  declare interactive: boolean;
  declare disabled: boolean;
  declare padding: "none" | "small" | "medium" | "large";

  constructor() {
    super();
    this.variant = "default";
    this.elevation = 1;
    this.interactive = false;
    this.disabled = false;
    this.padding = "medium";
  }

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      border-radius: calc(var(--025) * var(--sf, 1));
      background-color: var(--card-background, var(--surface-color, #fff));
      color: var(--text-color-primary);
      transition:
        box-shadow 0.2s ease,
        transform 0.2s ease;
    }

    :host([hidden]) {
      display: none !important;
    }

    :host([variant="default"]) {
      background-color: var(--card-background, var(--surface-color, #fff));
      border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));
    }

    :host([variant="outlined"]) {
      background-color: transparent;
      border: 1px solid var(--border-color, rgba(0, 0, 0, 0.2));
    }

    :host([variant="elevated"]) {
      background-color: var(--card-background, var(--surface-color, #fff));
      border: none;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    :host([variant="filled"]) {
      background-color: var(
        --card-background-filled,
        var(--surface-color-secondary, #f5f5f5)
      );
      border: none;
    }

    :host([elevation="0"]) {
      box-shadow: none;
    }

    :host([elevation="1"]) {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    :host([elevation="2"]) {
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
    }

    :host([elevation="3"]) {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.16);
    }

    :host([interactive]) {
      cursor: pointer;
    }

    :host([interactive]:hover:not([disabled])) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    :host([interactive]:active:not([disabled])) {
      transform: translateY(0);
    }

    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }

    :host([padding="none"]) {
      padding: 0;
    }

    :host([padding="small"]) {
      padding: calc(var(--025) * var(--sf, 1));
    }

    :host([padding="medium"]) {
      padding: calc(var(--05) * var(--sf, 1));
    }

    :host([padding="large"]) {
      padding: calc(var(--1) * var(--sf, 1));
    }

    .card-content {
      width: 100%;
      height: 100%;
    }
  `;

  render() {
    return html`
      <div class="card-content" part="content">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define("ds-card", Card);

declare global {
  interface HTMLElementTagNameMap {
    "ds-card": Card;
  }
}
