import { Switch } from "./ds-switch";
import { define } from "../0-face/define";

/** Rounded on/off control. The native button owns activation and controlled state. */
export class Toggle extends Switch {
  connectedCallback() {
    this.setAttribute("rounded", "");
    super.connectedCallback();
  }
}
define("ds-toggle", Toggle);
declare global { interface HTMLElementTagNameMap { "ds-toggle": Toggle } }
