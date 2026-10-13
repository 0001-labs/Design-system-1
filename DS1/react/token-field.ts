import { createElement, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import type { TokenField as TokenFieldElement, TokenCommit } from "../3-unit/ds-token-field";
import type { Token as TokenElement } from "../2-core/ds-token";
export type { TokenCommit };
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export type TokenProps = HTMLAttributes<TokenElement> & { value: string; label?: string; detail?: string; removeLabel?: string; disabled?: boolean; onRemove?: (value: string) => void };
export const Token = forwardRef<TokenElement, TokenProps>(function Token({onRemove, ...props}, ref) {
  const host = useRef<TokenElement>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const remove = (event: Event) => { if (event.target === element) onRemove?.((event as CustomEvent<{value: string}>).detail.value); };
    element.addEventListener("ds-token-remove", remove); return () => element.removeEventListener("ds-token-remove", remove);
  });
  return createElement("ds-token", {...props, ref: (element: TokenElement | null) => {host.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element;}});
});
export type TokenFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & {
  tokens?: ReactNode; suggestions?: ReactNode; chooseLabel?: string; separators?: string;
  onCommit?: (request: TokenCommit) => void;
};
/** All native field attributes, handlers and refs are passed to the native input. */
export const TokenField = forwardRef<HTMLInputElement, TokenFieldProps>(function TokenField(
  {tokens, suggestions, chooseLabel = "", separators, onCommit, className, style, ...props}, ref,
) {
  const host = useRef<TokenFieldElement>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const commit = (event: Event) => { if (event.target === element) onCommit?.((event as CustomEvent<TokenCommit>).detail); };
    element.addEventListener("ds-token-commit", commit); element.refresh();
    return () => element.removeEventListener("ds-token-commit", commit);
  });
  return createElement("ds-token-field", {ref: host, chooseLabel, ...(separators === undefined ? {} : {separators}), className, style}, tokens, createElement("input", {...props, ref}), suggestions === undefined ? null : createElement("ds-menu", {slot: "suggestions", "aria-label": chooseLabel}, suggestions));
});
