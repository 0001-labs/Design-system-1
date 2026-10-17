import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { getText } from "../0-face/i18n";
import styles from "./styles/ds-loading.css?inline";

/** The shared word a busy indicator reads without a label of its own. */
export const LOADING_LABEL = "Loading";

/**
 * The controls a spinner can stand in: buttons and fields. Inside one, the
 * spinner is one control high, the size of the icon it stands in for.
 * `ds-loading.css` names the same controls for the light-DOM markup.
 */
export const LOADING_CONTROLS =
  "button, [role='button'], ds-button, .ds-button, ds-input, ds-textarea, ds-select, .ds-field, .ds-input, .ds-textarea, .ds-select";

/** Whether an element stands in a control, across shadow roots. */
export function inLoadingControl(element: Element): boolean {
  let node: Element | null = element.parentElement ?? hostOf(element);
  while (node) {
    if (node.closest(LOADING_CONTROLS)) return true;
    node = hostOf(node);
  }
  return false;
}

function hostOf(element: Element): Element | null {
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

/** @internal Automatic pending-state feedback, not user-insertable content.
 * Label must describe the current operation; unset, it is the shared word
 * "Loading" in the page's language. The containing app controls mounting.
 * A spinner in a button or field is one control high (16px), elsewhere one
 * square; `--ds-loading-size` sets it outright.
 * --ds-loading-width/fill/duration preserve the surrounding brand. */
export class LoadingIndicator extends LitElement {
  static properties = {
    label: { type: String },
    variant: { type: String },
    inControl: { state: true },
  };
  static styles = unsafeCSS(styles);
  label = "";
  variant = "bar";
  inControl = false;
  private readonly relabel = () => this.requestUpdate();
  connectedCallback() {
    super.connectedCallback();
    this.inControl = inLoadingControl(this);
    window.addEventListener("language-changed", this.relabel);
    window.addEventListener("translations-loaded", this.relabel);
  }
  disconnectedCallback() {
    window.removeEventListener("language-changed", this.relabel);
    window.removeEventListener("translations-loaded", this.relabel);
    super.disconnectedCallback();
  }
  render() {
    const label = this.label || getText(LOADING_LABEL) || LOADING_LABEL;
    return html`<span class="ds-loading" data-variant=${this.variant} data-context=${this.inControl ? "control" : "page"} role="status" aria-label=${label} aria-busy="true"><span class="ds-loading__fill" aria-hidden="true"></span></span>`;
  }
}
define("ds-loading", LoadingIndicator);
