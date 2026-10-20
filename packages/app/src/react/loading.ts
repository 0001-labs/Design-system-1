import { createElement, Fragment, type CSSProperties, type ReactNode } from "react";
import { getText } from "../../../../DS1/0-face/i18n";
import styles from "../2-core/styles/ds-loading.css?inline";
export const loadingStyles = styles;
/** SSR-safe automatic feedback. Decorative when a containing status owns the label.
 * Shared markup and CSS work before hydration; no DOM runtime is imported.
 * Unset, the label is the shared word "Loading" in the page's language. A
 * spinner in a button or field is one control high, elsewhere one square. */
export function LoadingIndicator({ label, variant = "bar", gradient = false, decorative = false, className = "", style }: {
  label?: string; gradient?: boolean; variant?: "bar" | "spinner"; decorative?: boolean; className?: string; style?: CSSProperties;
}): ReactNode {
  const name = decorative ? undefined : label || getText("Loading") || "Loading";
  return createElement(Fragment, null, createElement("style", null, styles),
    createElement("span", { className: `ds-loading ${className}`, style, "data-variant": variant, "data-gradient": gradient ? "" : undefined,
      role: decorative ? undefined : "status", "aria-label": name,
      "aria-hidden": decorative || undefined, "aria-busy": decorative ? undefined : true },
      createElement("span", { className: "ds-loading__fill", "aria-hidden": true })));
}
