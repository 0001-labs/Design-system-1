/** Controlled state for Button's split mode. The shared Button owns its face. */
import { createElement, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type Ref } from "react";
import type { Button as ButtonElement, SplitSegment } from "../2-core/ds-button";
export type { SplitSegment };
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export interface SplitButtonProps<T extends string> {
  split: true; segments: ReadonlyArray<SplitSegment<T>>; value?: T;
  onPress: (value: T) => void; label: string; className?: string; style?: CSSProperties;
  disabled?: boolean; compact?: boolean;
}
export function SplitButton<T extends string>({ segments, value, onPress, label, className, style, disabled = false, compact = false, forwardedRef, tag = "ds-button" }: SplitButtonProps<T> & { forwardedRef?: Ref<ButtonElement>; tag?: "ds-button" | "ds-split" }): ReactNode {
  const ref = useRef<ButtonElement | null>(null);
  useCommitEffect(() => {
    const element = ref.current; if (!element) return;
    element.split = true; element.segments = segments; element.value = value ?? "";
    element.actions = value === undefined; element.disabled = disabled; element.compact = compact; element.literal = true;
    const press = (event: Event) => {
      if (event.target !== element) return;
      if (event.type === "change") event.preventDefault();
      onPress((event as CustomEvent<{ value: T }>).detail.value);
    };
    element.addEventListener("change", press); element.addEventListener("press", press);
    return () => { element.removeEventListener("change", press); element.removeEventListener("press", press); };
  });
  return createElement(tag, { ref: (element: ButtonElement | null) => {
    ref.current = element;
    if (typeof forwardedRef === "function") forwardedRef(element); else if (forwardedRef) forwardedRef.current = element;
  }, split: true, "aria-label": label, className, style });
}
