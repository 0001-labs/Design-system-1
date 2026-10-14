import { createElement, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import type { Menu as MenuElement, MenuAnchor, MenuCloseReason, MenuTriggerMode, MenuToggleDetail } from "../3-unit/ds-menu";
export type MenuProps = HTMLAttributes<MenuElement> & {
  open?: boolean; compact?: boolean; columns?: number; hover?: boolean; disabled?: boolean;
  contextSelector?: string;
  anchor?: MenuAnchor | null; placement?: "top" | "bottom" | "right" | "left"; triggerMode?: MenuTriggerMode; trigger?: HTMLElement | null; controller?: HTMLElement | null; activeId?: string;
  onActiveChange?: (id: string) => void;
  onOpenChange?: (open: boolean, reason: MenuCloseReason | "trigger", context?: MenuToggleDetail) => void;
  onCloseAutoFocus?: (event: Event) => void;
};
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export const Menu = forwardRef<MenuElement, MenuProps>(function Menu(
  {open, compact, columns, hover, disabled, anchor, placement, triggerMode, contextSelector, trigger, controller, activeId, onActiveChange, onOpenChange, onCloseAutoFocus, children, ...props}, ref,
) {
  const host = useRef<MenuElement>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const active = (event: Event) => { if (event.target !== element) return; if (activeId !== undefined) event.preventDefault(); onActiveChange?.((event as CustomEvent<{id:string}>).detail.id); };
    const close = (event: Event) => { if (event.target !== element) return; if (open !== undefined) event.preventDefault(); onOpenChange?.(false, (event as CustomEvent<{reason: MenuCloseReason}>).detail.reason); };
    const toggle = (event: Event) => { if (event.target !== element) return; if (open !== undefined) event.preventDefault(); const detail = (event as CustomEvent<MenuToggleDetail>).detail; onOpenChange?.(detail.open, "trigger", detail); };
    const focus = (event: Event) => { if (event.target === element) onCloseAutoFocus?.(event); };
    element.addEventListener("ds-menu-close-focus", focus);
    element.addEventListener("ds-menu-active", active); element.addEventListener("ds-menu-close", close); element.addEventListener("ds-menu-toggle", toggle);
    element.renderNow?.();
    return () => { element.removeEventListener("ds-menu-close-focus", focus); element.removeEventListener("ds-menu-active", active); element.removeEventListener("ds-menu-close", close); element.removeEventListener("ds-menu-toggle", toggle); };
  });
  return createElement("ds-menu", {...props, ref: (element: MenuElement | null) => { host.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element; }, floating: open !== undefined, open, compact, columns, hover, disabled, anchor, placement, triggerMode, contextSelector, trigger, controller, activeId}, children);
});
