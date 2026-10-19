/** A sidebar in React: the rows go to ds-sidebar as a property, its events come
 * back as callbacks; `tree` makes it a tree of nested things. Browser-only
 * registration of ds-sidebar stays in the product's runtime entry; on the
 * server the element renders empty and fills on load. */
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import type { Sidebar as SidebarElement, SidebarItem, SidebarMoveDetail } from "../3-unit/ds-sidebar";

export type { SidebarItem, SidebarMoveDetail };

export type SidebarProps = Omit<HTMLAttributes<SidebarElement>, "onSelect" | "onToggle"> & {
  /** The visible rows, in order; leave out the children of a closed row. */
  items: SidebarItem[];
  /** The navigation's or the tree's accessible name. */
  label?: string;
  /** The empty state's words. */
  empty?: string;
  /** A tree of nested things instead of navigation. */
  tree?: boolean;
  expandIcon?: string;
  collapseIcon?: string;
  reorderable?: boolean;
  onMove?: (move: SidebarMoveDetail) => void;
  /** A row asks to open (`true`) or close. */
  onToggle?: (id: string, expanded: boolean) => void;
  /** A click, Space or Enter chose a tree row. */
  onSelect?: (id: string) => void;
  /** A row was pressed (navigation), or Enter or a double click opened one (a tree). */
  onActivate?: (id: string) => void;
  /** A row's own action was pressed. */
  onAction?: (id: string, action: string) => void;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const Sidebar = forwardRef<SidebarElement, SidebarProps>(function Sidebar(
  { items, label, empty, tree, expandIcon, collapseIcon, reorderable, onMove, onToggle, onSelect, onActivate, onAction, ...props }, ref,
) {
  const host = useRef<SidebarElement>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    element.items = items;
    element.expandIcon = expandIcon;
    element.collapseIcon = collapseIcon;
    element.reorderable = Boolean(reorderable);
  }, [items, expandIcon, collapseIcon, reorderable]);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const detail = (event: Event) => (event as CustomEvent<{ id: string; expanded?: boolean; action?: string }>).detail;
    const toggle = (event: Event) => { const d = detail(event); onToggle?.(d.id, Boolean(d.expanded)); };
    const select = (event: Event) => onSelect?.(detail(event).id);
    const activate = (event: Event) => onActivate?.(detail(event).id);
    const action = (event: Event) => { const d = detail(event); onAction?.(d.id, d.action ?? ""); };
    const move = (event: Event) => onMove?.((event as CustomEvent<SidebarMoveDetail>).detail);
    element.addEventListener("sidebar-move", move);
    element.addEventListener("sidebar-toggle", toggle);
    element.addEventListener("sidebar-select", select);
    element.addEventListener("sidebar-activate", activate);
    element.addEventListener("sidebar-action", action);
    return () => {
      element.removeEventListener("sidebar-move", move);
      element.removeEventListener("sidebar-toggle", toggle);
      element.removeEventListener("sidebar-select", select);
      element.removeEventListener("sidebar-activate", activate);
      element.removeEventListener("sidebar-action", action);
    };
  });
  return h("ds-sidebar", { ...props, label, empty, tree: tree || undefined,
    ref: (element: SidebarElement | null) => { host.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element; },
  });
});
