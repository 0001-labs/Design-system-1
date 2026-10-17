/** A tree in React: the rows go to ds-tree as a property, its events come back
 * as callbacks. Browser-only registration of ds-tree stays in the product's
 * runtime entry; on the server the element renders empty and fills on load. */
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes } from "react";
import type { Tree as TreeElement, TreeItem } from "../3-unit/ds-tree";

export type { TreeItem };

export type TreeProps = Omit<HTMLAttributes<TreeElement>, "onSelect" | "onToggle"> & {
  /** The visible rows, in order; leave out the children of a closed row. */
  items: TreeItem[];
  /** The tree's accessible name. */
  label?: string;
  /** A row asks to open (`true`) or close. */
  onToggle?: (id: string, expanded: boolean) => void;
  /** A click, Space or Enter chose a row. */
  onSelect?: (id: string) => void;
  /** Enter or a double click opens a row. */
  onActivate?: (id: string) => void;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const Tree = forwardRef<TreeElement, TreeProps>(function Tree(
  { items, label, onToggle, onSelect, onActivate, ...props }, ref,
) {
  const host = useRef<TreeElement>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    element.items = items;
  }, [items]);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const id = (event: Event) => (event as CustomEvent<{ id: string; expanded?: boolean }>).detail;
    const toggle = (event: Event) => { const detail = id(event); onToggle?.(detail.id, Boolean(detail.expanded)); };
    const select = (event: Event) => onSelect?.(id(event).id);
    const activate = (event: Event) => onActivate?.(id(event).id);
    element.addEventListener("ds-tree-toggle", toggle);
    element.addEventListener("ds-tree-select", select);
    element.addEventListener("ds-tree-activate", activate);
    return () => {
      element.removeEventListener("ds-tree-toggle", toggle);
      element.removeEventListener("ds-tree-select", select);
      element.removeEventListener("ds-tree-activate", activate);
    };
  });
  return h("ds-tree", { ...props, label,
    ref: (element: TreeElement | null) => { host.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element; },
  });
});
