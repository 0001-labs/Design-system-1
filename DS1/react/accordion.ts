import { createElement as h, forwardRef, useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import type { Accordion as AccordionElement } from "../3-unit/ds-accordion";

export type AccordionProps = Omit<HTMLAttributes<AccordionElement>, "onToggle"> & {
  summary: ReactNode; actions?: ReactNode; open?: boolean; defaultOpen?: boolean; disabled?: boolean;
  triggerRole?: string; onOpenChange?: (open: boolean) => void;
};
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export const Accordion = forwardRef<AccordionElement, AccordionProps>(function Accordion(
  {summary, actions, open, defaultOpen = false, disabled, triggerRole, onOpenChange, children, ...props}, ref,
) {
  const host = useRef<AccordionElement>(null), id = useId();
  const [localOpen, setLocalOpen] = useState(defaultOpen), expanded = open ?? localOpen;
  useCommitEffect(() => {
    const element = host.current; if (!element) return;
    const toggle = (event: Event) => {
      if (event.target !== element) return;
      event.preventDefault(); if (disabled) return;
      const next = (event as CustomEvent<{open: boolean}>).detail.open;
      if (open === undefined) setLocalOpen(next);
      onOpenChange?.(next);
    };
    element.addEventListener("ds-accordion-toggle", toggle);
    return () => element.removeEventListener("ds-accordion-toggle", toggle);
  });
  return h("ds-accordion", {...props, control: "slotted", open: expanded,
    ref: (element: AccordionElement | null) => {host.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element;},
  }, h("ds-button", {slot: "trigger", control: "slotted", choice: true, disabled},
    h("button", {type: "button", role: triggerRole, disabled, "aria-expanded": expanded, "aria-controls": id}, summary,
      h("ds-icon", {type: expanded ? "up" : "down", "aria-hidden": "true", style: {marginInlineStart: "auto", flex: "0 0 auto"}}))),
    actions == null ? null : h("div", {slot: "actions"}, actions),
    h("div", {slot: "details", id, hidden: !expanded}, children));
});
