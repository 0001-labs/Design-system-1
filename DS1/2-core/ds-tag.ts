import { LitElement, html, unsafeCSS } from "lit";
import { define } from "../0-face/define";
import { CutFades } from "../0-face/cut-fade";
import styles from "./styles/ds-tag.css?inline";

/**
 * A noninteractive label whose width follows its words, without grid rounding.
 * Words that do not fit fade out over their last square, never an ellipsis,
 * while the fill stays whole.
 */
export class Tag extends LitElement {
  static styles = unsafeCSS(styles);
  /** Marks the words `data-cut="end"` while they are wider than the tag. */
  private cuts = new CutFades(this, { selector: ".words", text: true });
  render() { return html`<span class="frame" part="frame"><span class="words"><slot @slotchange=${() => this.cuts.measure()}></slot></span></span>`; }
}
define("ds-tag", Tag);
declare global { interface HTMLElementTagNameMap { "ds-tag": Tag } }
