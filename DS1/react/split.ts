/** Product state binding. The Lit split owns the controls and their face. */
import { createElement, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { Split as SplitElement, SplitSegment } from "../2-core/ds-split";
export type { SplitSegment };

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export interface SplitProps<T extends string> {
  segments: ReadonlyArray<SplitSegment<T>>;
  value?: T;
  onPress: (value: T) => void;
  label: string;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
}

export function Split<T extends string>({ segments, value, onPress, label, className, style, disabled = false }: SplitProps<T>): ReactNode {
  const ref = useRef<SplitElement | null>(null);
  useCommitEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.segments = segments;
    element.value = value ?? "";
    element.actions = value === undefined;
    element.disabled = disabled;
    element.literal = true;
    const press = (event: Event) => {
      if (event.target !== element) return;
      // A controlled choice changes only when the product accepts it and
      // sends back a value. A rejected request must never become selected.
      if (event.type === "change") event.preventDefault();
      onPress((event as CustomEvent<{ value: T }>).detail.value);
    };
    element.addEventListener("change", press);
    element.addEventListener("press", press);
    return () => {
      element.removeEventListener("change", press);
      element.removeEventListener("press", press);
    };
  });
  return createElement("ds-split", { ref, "aria-label": label, className, style });
}
