import { createElement, useEffect, useLayoutEffect, useRef, type CSSProperties, type ReactNode, type MouseEvent } from "react";
import { bindSpacingHandle, type SpacingOptions } from "../2-core/spacing-handle";
import styles from "../2-core/styles/ds-spacing-handle.css?inline";
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export interface SpacingHandleProps extends SpacingOptions {
  label: string; valueText?: string; className?: string; style?: CSSProperties;
  children?: ReactNode; onDoubleClick?: (event: MouseEvent<HTMLSpanElement>) => void;
}
/** Internal app chrome. Shared native target, keyboard/pointer controller and face. */
export function SpacingHandle(props: SpacingHandleProps): ReactNode {
  const ref = useRef<HTMLSpanElement>(null);
  const latest = useRef(props); latest.current = props;
  useCommitEffect(() => ref.current ? bindSpacingHandle(ref.current, () => latest.current) : undefined, []);
  return createElement("span", { ref, className: `ds-spacing-control ${props.className ?? ""}`, style: props.style,
    role: "slider", tabIndex: props.disabled ? -1 : 0, "aria-label": props.label,
    "aria-orientation": props.axis ?? "horizontal", "aria-valuemin": props.min ?? 0,
    "aria-valuemax": props.max ?? 1000000, "aria-valuenow": props.value,
    "aria-valuetext": props.valueText ?? String(props.value), "aria-disabled": !!props.disabled,
    onDoubleClick: props.onDoubleClick, onClick: (e: MouseEvent) => e.stopPropagation(),
  }, createElement("style", null, styles), props.children ?? createElement("span", { className: "ds-spacing-label", "aria-hidden": true }, props.value));
}
