import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { Tag as TagElement } from "../2-core/ds-tag";
export type TagProps = HTMLAttributes<TagElement>;
export const Tag = forwardRef<TagElement, TagProps>(function Tag(props, ref) {
  return createElement("ds-tag", { ...props, ref });
});
