/** Register the element in the browser before hydrating this property adapter. */
import { createElement, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes } from 'react';
import type { TableOfContents as Element, TableOfContentsItem } from '../3-unit/ds-table-of-contents';
export type { TableOfContentsItem };
export type TableOfContentsProps = HTMLAttributes<Element> & {
  items?: TableOfContentsItem[]; label?: string; literal?: boolean;
  target?: HTMLElement; onSectionChange?: (href: string) => void;
};
const useCommitEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
export const TableOfContents = forwardRef<Element, TableOfContentsProps>(function TableOfContents(
  {items, label, literal, target, onSectionChange, ...props}, ref,
) {
  const host = useRef<Element>(null);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    element.items = items ?? []; element.target = target;
  }, [items, target]);
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const changed = (event: Event) => onSectionChange?.((event as CustomEvent<{href:string}>).detail.href);
    element.addEventListener('toc-change', changed);
    return () => element.removeEventListener('toc-change', changed);
  }, [onSectionChange]);
  return createElement('ds-table-of-contents', {...props, label, literal:literal ? '' : undefined, ref:(element: Element | null) => {
    host.current=element;
    if (typeof ref==='function') ref(element); else if(ref) ref.current=element;
  }});
});
