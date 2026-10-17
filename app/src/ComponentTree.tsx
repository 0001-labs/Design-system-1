import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "../../DS1/3-unit/ds-sidebar";
import type { Sidebar, SidebarItem } from "../../DS1/3-unit/ds-sidebar";

/** A component, or a group of them that opens and closes. */
export type TreeNode = { id: string; label: string; meta?: string; children?: TreeNode[] };

/**
 * The workbench's component trees, drawn by Design system 1's sidebar: one
 * square a row, its arrow keys, focus and cut-label tooltips. The workbench
 * owns which component is open and which groups are closed.
 */
export function ComponentTree({ label, nodes, current, onSelect, className }: {
  label: string;
  nodes: TreeNode[];
  current: string;
  onSelect: (id: string) => void;
  className?: string;
}) {
  const sidebar = useRef<Sidebar>(null);
  const [closed, setClosed] = useState<ReadonlySet<string>>(() => new Set());
  const select = useRef(onSelect);
  select.current = onSelect;
  const items = useMemo(() => {
    const rows = (list: TreeNode[], depth: number): SidebarItem[] => list.flatMap(node => {
      const item: SidebarItem = { id: node.id, label: node.label, depth, meta: node.meta, current: node.id === current };
      if (!node.children) return [item];
      item.expanded = !closed.has(node.id);
      return [item, ...(item.expanded ? rows(node.children, depth + 1) : [])];
    });
    return rows(nodes, 0);
  }, [nodes, current, closed]);
  useLayoutEffect(() => { if (sidebar.current) sidebar.current.items = items; }, [items]);
  useEffect(() => {
    const element = sidebar.current;
    if (!element) return;
    const activate = (event: Event) => select.current((event as CustomEvent<{ id: string }>).detail.id);
    const toggle = (event: Event) => {
      const { id, expanded } = (event as CustomEvent<{ id: string; expanded: boolean }>).detail;
      setClosed(previous => {
        const next = new Set(previous);
        if (expanded) next.delete(id); else next.add(id);
        return next;
      });
      void element.updateComplete.then(() => element.focusItem(id));
    };
    element.addEventListener("sidebar-activate", activate);
    element.addEventListener("sidebar-toggle", toggle);
    return () => {
      element.removeEventListener("sidebar-activate", activate);
      element.removeEventListener("sidebar-toggle", toggle);
    };
  }, []);
  return <ds-sidebar ref={sidebar} label={label} className={`component-tree${className ? ` ${className}` : ""}`} />;
}
