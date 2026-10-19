import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { Image as ImageElement } from "../2-core/ds-image";
export type ImageProps = HTMLAttributes<ImageElement> & {
  src?: string; alt: string; caption?: string; srcset?: string; sizes?: string;
  width?: number; height?: number; ratio?: string; fit?: "cover" | "contain";
  position?: string; loading?: "lazy" | "eager";
};
export const Image = forwardRef<ImageElement, ImageProps>(function Image(props, ref) {
  return createElement("ds-image", { ...props, ref });
});
