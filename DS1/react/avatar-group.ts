import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { AvatarGroup as AvatarGroupElement } from "../3-unit/ds-avatar-group";

export type AvatarGroupProps = HTMLAttributes<AvatarGroupElement> &
  Partial<Pick<AvatarGroupElement, "size" | "vertical">>;
/** Registration belongs to the browser runtime; React keeps identity children. */
export const AvatarGroup = forwardRef<AvatarGroupElement, AvatarGroupProps>(
  function AvatarGroup(props, ref) {
    return createElement("ds-avatar-group", { ...props, ref });
  },
);
