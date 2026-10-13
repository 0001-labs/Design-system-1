/** Optional React composition; behavior and appearance belong to ds-dialog. */
import { createContext, createElement, useContext, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import type { Dialog as DialogElement, DialogCloseReason } from "../4-page/ds-dialog";

const DialogContext = createContext<{ open: boolean; change: (open: boolean, reason?: DialogCloseReason) => void; title: string; description: string } | null>(null);
const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("Dialog content must be inside Dialog.");
  return context;
};

export interface DialogProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean, reason?: DialogCloseReason) => void; children: ReactNode }
export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const id = useId();
  return createElement(DialogContext.Provider, { value: {
    open: open ?? internal, title: `${id}-title`, description: `${id}-description`,
    change: (next, reason) => { if (open === undefined) setInternal(next); onOpenChange?.(next, reason); },
  } }, children);
}

export interface DialogContentProps extends HTMLAttributes<HTMLDialogElement> {
  ref?: Ref<HTMLDialogElement>;
  /** Keep floating panels within their product layout or containing modal. */
  portal?: boolean;
  nonModal?: boolean;
  closeOnOutside?: boolean;
  blockOutside?: boolean;
  holdScroll?: boolean;
  anchor?: { x: number; y: number } | null;
  returnFocus?: (() => HTMLElement | null) | null;
  closeLabel?: string;
  showClose?: boolean;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  /** Fill the viewport for document viewers; this is not the Fullscreen API. */
  fullScreen?: boolean;
  /** Content supplies its own internal spacing. The shared frame stays intact. */
  flush?: boolean;
  /** Rotate a document frame while keeping it within the viewport. */
  rotated?: boolean;
}
export function DialogContent({ children, portal = true, nonModal = false, closeOnOutside = false, blockOutside = false, holdScroll = false, anchor = null, returnFocus = null, closeLabel = "Close", showClose = true, closeOnEscape = true, closeOnBackdrop = true, fullScreen = false, flush = false, rotated = false, ...props }: DialogContentProps) {
  const context = useDialog();
  const host = useRef<DialogElement>(null);
  const [mounted, setMounted] = useState(false);
  // A portal has no server location. Keep the server and first client render
  // identical, including when the application initially requests an open modal.
  useLayoutEffect(() => { setMounted(true); }, []);
  // Install the request handler before opening, and keep the app's decision authoritative.
  useLayoutEffect(() => {
    const element = host.current;
    if (!element) return;
    const close = (event: Event) => {
      if (event.target !== element) return;
      event.preventDefault();
      context.change(false, (event as CustomEvent<{ reason: DialogCloseReason }>).detail.reason);
    };
    element.addEventListener("ds-close-request", close);
    const native = element.querySelector("dialog")!;
    if (!("aria-labelledby" in props) && !props["aria-label"]) {
      const title = native.querySelector('[data-ds-dialog="title"]');
      if (title) native.setAttribute("aria-labelledby", title.id);
      else native.removeAttribute("aria-labelledby");
    }
    if (!("aria-describedby" in props)) {
      const description = native.querySelector('[data-ds-dialog="description"]');
      if (description) native.setAttribute("aria-describedby", description.id);
      else native.removeAttribute("aria-describedby");
    }
    element.closeOnEscape = closeOnEscape;
    element.closeOnBackdrop = closeOnBackdrop;
    element.nonModal = nonModal;
    element.closeOnOutside = closeOnOutside;
    element.blockOutside = blockOutside;
    element.holdScroll = holdScroll;
    element.anchor = anchor;
    element.returnFocus = returnFocus;
    element.open = context.open;
    return () => element.removeEventListener("ds-close-request", close);
  });
  if (!mounted || !context.open) return null;
  const content = createElement("ds-dialog", { ref: host },
    createElement("dialog", { ...props, "data-ds-dialog-fullscreen": fullScreen || undefined, "data-ds-dialog-flush": flush || undefined, "data-ds-dialog-rotated": rotated || undefined }, children,
      showClose && createElement("ds-button", { control: "slotted", icon: true, "data-ds-dialog": "close" },
        createElement("button", { type: "button", "aria-label": closeLabel, "data-ds-dialog-dismiss": "" },
          createElement("ds-icon", { type: "close", "aria-hidden": true }))),
    ));
  return portal ? createPortal(content, document.body) : content;
}

export function DialogHeader(props: HTMLAttributes<HTMLDivElement>) { return createElement("div", { ...props, "data-ds-dialog": "header" }); }
export function DialogFooter(props: HTMLAttributes<HTMLDivElement>) { return createElement("div", { ...props, "data-ds-dialog": "footer" }); }
export function DialogTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  const context = useDialog();
  return createElement("h2", { id: context.title, ...props, "data-ds-dialog": "title" });
}
export function DialogDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  const context = useDialog();
  return createElement("p", { id: context.description, ...props, "data-ds-dialog": "description" });
}
