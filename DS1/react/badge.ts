import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { Badge as BadgeElement } from "../2-core/ds-badge";

export type BadgeProps = HTMLAttributes<BadgeElement> & { icon?: string; iconOnly?: boolean };
export const Badge = forwardRef<BadgeElement, BadgeProps>(function Badge(props, ref) {
  return createElement("ds-badge", {...props, ref});
});
