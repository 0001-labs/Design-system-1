import { createElement, forwardRef, useEffect, useLayoutEffect, useRef, type TextareaHTMLAttributes } from "react";
import type { Composer as ComposerElement, TextHighlight } from "../2-core/ds-composer";
export type { TextHighlight };
export type ComposerProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  highlights?: TextHighlight[];
  autoGrow?: boolean;
  maxRows?: number;
  variant?: "field" | "plain";
};
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
/** Native React values, events, refs and forms; DS1 owns the entire visual. */
export const Composer = forwardRef<HTMLTextAreaElement, ComposerProps>(function Composer(
  { highlights = [], autoGrow, maxRows = 12, variant = "field", className, style, ...props }, ref,
) {
  const host = useRef<ComposerElement>(null);
  useCommitEffect(() => { host.current?.refresh(); });
  return createElement("ds-composer", { ref: host, highlights, "auto-grow": autoGrow, "max-rows": maxRows, variant, className, style }, createElement("textarea", { ...props, ref }));
});
