/** Compatibility adapter for Button's split mode; new callers use <Button split>. */
import { createElement, type ReactNode } from "react";
import { SplitButton, type SplitButtonProps } from "./button-split";
export type { SplitSegment } from "./button-split";
export type SplitProps<T extends string> = Omit<SplitButtonProps<T>, "split">;
export function Split<T extends string>(props: SplitProps<T>): ReactNode {
  return createElement(SplitButton<T>, { ...props, split: true, tag: "ds-split" });
}
