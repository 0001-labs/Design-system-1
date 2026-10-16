import { Button } from "./ds-button";
import { define } from "../0-face/define";
export type { SplitSegment } from "./button-split";
/** Compatibility name for Button's split mode. New usage is <ds-button split>. */
export class Split extends Button {
  constructor() { super(); this.split = true; }
}
define("ds-split", Split);
declare global { interface HTMLElementTagNameMap { "ds-split": Split } }
