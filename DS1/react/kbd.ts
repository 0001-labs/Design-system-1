/** A keyboard shortcut's hint in React: ds-kbd writes the shortcut as the
 * reader's platform does (⇧⌘D, Ctrl+Shift+D). Browser-only registration of
 * ds-kbd stays in the product's runtime entry; children are words of the
 * product's own, shown when there is no `shortcut`. */
import { createElement as h, forwardRef, type HTMLAttributes, type ReactNode } from "react";
import type { Kbd as KbdElement } from "../2-core/ds-kbd";
import type { KeyPlatform } from "../0-face/keys";

export type KbdProps = HTMLAttributes<KbdElement> & {
  /** The shortcut, written once for every platform: `mod+shift+d`, `escape`, `?`. */
  shortcut?: string;
  /** The words alone in the title grey, as a menu entry writes its shortcut. */
  plain?: boolean;
  /** Write it for this platform rather than the reader's own. */
  platform?: KeyPlatform;
  children?: ReactNode;
};

export const Kbd = forwardRef<KbdElement, KbdProps>(function Kbd({ shortcut, plain, platform, children, ...props }, ref) {
  return h("ds-kbd", { ...props, shortcut, plain: plain || undefined, platform, ref }, children);
});
