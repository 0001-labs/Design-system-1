import { createElement, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import type { Menu as MenuElement, MenuAnchor } from "../3-unit/ds-menu";
export type MenuProps = HTMLAttributes<MenuElement> & {
  open?: boolean; compact?: boolean; columns?: number; hover?: boolean;
  anchor?: MenuAnchor | null; placement?: "top" | "bottom"; trigger?: HTMLElement | null; controller?: HTMLElement | null; activeId?: string;
  onActiveChange?: (id: string) => void;
  onOpenChange?: (open: boolean, reason: "escape" | "outside" | "trigger") => void;
};
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export const Menu = forwardRef<MenuElement, MenuProps>(function Menu(
  {open, compact, columns, hover, anchor, placement, trigger, controller, activeId, onActiveChange, onOpenChange, children, ...props}, ref,
) {
  const host = useRef<MenuElement>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const active = (event: Event) => { if (event.target !== element) return; if (activeId !== undefined) event.preventDefault(); onActiveChange?.((event as CustomEvent<{id:string}>).detail.id); };
    const close = (event: Event) => { if (event.target !== element) return; if (open !== undefined) event.preventDefault(); onOpenChange?.(false, (event as CustomEvent<{reason: "escape" | "outside"}>).detail.reason); };
    const toggle = (event: Event) => { if (event.target !== element) return; if (open !== undefined) event.preventDefault(); onOpenChange?.((event as CustomEvent<{open: boolean}>).detail.open, "trigger"); };
    element.addEventListener("ds-menu-active", active); element.addEventListener("ds-menu-close", close); element.addEventListener("ds-menu-toggle", toggle);
    return () => { element.removeEventListener("ds-menu-active", active); element.removeEventListener("ds-menu-close", close); element.removeEventListener("ds-menu-toggle", toggle); };
  });
  return createElement("ds-menu", {...props, ref: (element: MenuElement | null) => { host.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element; }, floating: open !== undefined, open, compact, columns, hover, anchor, placement, trigger, controller, activeId}, children);
});
