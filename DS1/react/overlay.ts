/** Optional React composition; behavior and appearance belong to ds-overlay. */
import { createContext, createElement, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import type { Overlay as OverlayElement, OverlayCloseReason, OverlaySide, OverlayType } from "../4-page/ds-overlay";

const OverlayContext = createContext<{ open: boolean; change: (open: boolean, reason?: OverlayCloseReason) => void; title: string; description: string } | null>(null);
const useOverlay = () => {
  const context = useContext(OverlayContext);
  if (!context) throw new Error("Overlay content must be inside Overlay.");
  return context;
};

export interface OverlayProps { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean, reason?: OverlayCloseReason) => void; children?: ReactNode }
export function Overlay({ open, defaultOpen = false, onOpenChange, children }: OverlayProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const id = useId();
  return createElement(OverlayContext.Provider, { value: {
    open: open ?? internal, title: `${id}-title`, description: `${id}-description`,
    change: (next, reason) => { if (open === undefined) setInternal(next); onOpenChange?.(next, reason); },
  } }, children);
}

export interface OverlayContentProps extends HTMLAttributes<HTMLDialogElement> {
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
  /** Content supplies its own internal spacing. The shared frame stays intact. */
  flush?: boolean;
  /** Rotate a document frame while keeping it within the viewport. */
  rotated?: boolean;
  /**
   * What it is: a `"modal"` in the centre (the default), a `"sheet"` from the
   * foot of the screen, a `"drawer"` at its `side`, a `"popover"` at `anchor`,
   * or the whole `"screen"` (a document viewer; not the Fullscreen API). A
   * sheet and a drawer slide out before they leave the page, and a finger
   * swipes them away (reason `"swipe"`).
   */
  type?: OverlayType;
  /** A drawer's side: `"end"` (the default) or `"start"`. */
  side?: OverlaySide;
}

/** The longest a sliding overlay stays on the page after closing, should its transition never end. */
const LEAVING = 600;
export function OverlayContent({ children, portal = true, nonModal = false, closeOnOutside = false, blockOutside = false, holdScroll = false, anchor = null, returnFocus = null, closeLabel = "Close", showClose = true, closeOnEscape = true, closeOnBackdrop = true, flush = false, rotated = false, type = "modal", side = "end", ...props }: OverlayContentProps) {
  const context = useOverlay();
  const host = useRef<OverlayElement>(null);
  const [mounted, setMounted] = useState(false);
  // A sheet or drawer stays on the page while it slides out, then leaves.
  const sliding = type === "sheet" || type === "drawer";
  const [leaving, setLeaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(context.open);
  if (wasOpen !== context.open) {
    setWasOpen(context.open);
    setLeaving(!context.open && sliding && mounted);
  }
  useEffect(() => {
    if (!leaving) return;
    const native = host.current?.querySelector("dialog");
    const done = () => setLeaving(false);
    const ended = (event: Event) => {
      const { propertyName, pseudoElement } = event as TransitionEvent;
      if (event.target === native && !pseudoElement && (propertyName === "transform" || propertyName === "opacity")) done();
    };
    native?.addEventListener("transitionend", ended);
    native?.addEventListener("transitioncancel", ended);
    const timer = setTimeout(done, LEAVING);
    return () => { clearTimeout(timer); native?.removeEventListener("transitionend", ended); native?.removeEventListener("transitioncancel", ended); };
  }, [leaving]);
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
      context.change(false, (event as CustomEvent<{ reason: OverlayCloseReason }>).detail.reason);
    };
    element.addEventListener("ds-close-request", close);
    const native = element.querySelector("dialog")!;
    if (!("aria-labelledby" in props) && !props["aria-label"]) {
      const title = native.querySelector('[data-ds-overlay="title"]');
      if (title) native.setAttribute("aria-labelledby", title.id);
      else native.removeAttribute("aria-labelledby");
    }
    if (!("aria-describedby" in props)) {
      const description = native.querySelector('[data-ds-overlay="description"]');
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
    element.type = type;
    element.side = side;
    element.open = context.open;
    return () => element.removeEventListener("ds-close-request", close);
  });
  if (!mounted || (!context.open && !leaving)) return null;
  const content = createElement("ds-overlay", { ref: host },
    createElement("dialog", { ...props, "data-ds-overlay-flush": flush || undefined, "data-ds-overlay-rotated": rotated || undefined }, children,
      showClose && createElement("ds-button", { control: "slotted", icon: true, "data-ds-overlay": "close" },
        createElement("button", { type: "button", "aria-label": closeLabel, "data-ds-overlay-dismiss": "" },
          createElement("ds-icon", { type: "close", "aria-hidden": true }))),
    ));
  return portal ? createPortal(content, document.body) : content;
}

export function OverlayHeader(props: HTMLAttributes<HTMLDivElement>) { return createElement("div", { ...props, "data-ds-overlay": "header" }); }
export function OverlayFooter(props: HTMLAttributes<HTMLDivElement>) { return createElement("div", { ...props, "data-ds-overlay": "footer" }); }
export function OverlayTitle(props: HTMLAttributes<HTMLHeadingElement>) {
  const context = useOverlay();
  return createElement("h2", { id: context.title, ...props, "data-ds-overlay": "title" });
}
export function OverlayDescription(props: HTMLAttributes<HTMLParagraphElement>) {
  const context = useOverlay();
  return createElement("p", { id: context.description, ...props, "data-ds-overlay": "description" });
}
