import { createElement, Fragment, type CSSProperties, type ReactNode } from "react";
import styles from "../2-core/styles/ds-loading.css?inline";
export const loadingStyles = styles;
/** SSR-safe automatic feedback. Decorative when a containing status owns the label.
 * Shared markup and CSS work before hydration; no DOM runtime is imported. */
export function LoadingIndicator({ label = "Loading", variant = "bar", decorative = false, className = "", style }: {
  label?: string; variant?: "bar" | "spinner"; decorative?: boolean; className?: string; style?: CSSProperties;
}): ReactNode {
  return createElement(Fragment, null, createElement("style", null, styles),
    createElement("span", { className: `ds-loading ${className}`, style, "data-variant": variant,
      role: decorative ? undefined : "status", "aria-label": decorative ? undefined : label,
      "aria-hidden": decorative || undefined, "aria-busy": decorative ? undefined : true },
      createElement("span", { className: "ds-loading__fill", "aria-hidden": true })));
}
