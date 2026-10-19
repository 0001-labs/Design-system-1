/** Compatibility name. New surfaces use Message. */
import { Message, MESSAGE_ICONS } from "./ds-message";
import { define } from "../0-face/define";
export type { MessageTone as NoticeTone, MessageDismissDetail as NoticeDismissDetail } from "./ds-message";
export const NOTICE_ICONS = MESSAGE_ICONS;
export class Notice extends Message {
  protected dismissEvent = "ds-notice-dismiss";
}
define("ds-notice", Notice);
declare global { interface HTMLElementTagNameMap { "ds-notice": Notice } }
