/** An inline notice in React: the words stay in the light DOM, so they render
 * on the server and read in tests; ds-message draws them and is the live region.
 * Browser-only registration of ds-message stays in the product's runtime entry. */
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { Message as MessageElement, MessageTone } from "../2-core/ds-message";

export type { MessageTone } from "../2-core/ds-message";
export type MessageProps = Omit<HTMLAttributes<MessageElement>, "title"> & {
  /** The mark's colour and icon; danger also colours the words. Neutral by default. */
  expand?: boolean;
  visibleToasts?: number;
  richColors?: boolean;
  contained?: boolean;
  label?: string;
  closeLabel?: string;
  form?: "inline" | "banner" | "toast" | "assistant" | "app";
  /** (app) The app's icon. */
  src?: string;
  /** (app) The App Store id, for Apple's banner and the store address. */
  appId?: string;
  /** (app) The store address, when it is not the App Store's own. */
  appUrl?: string;
  /** (app) The address that opens the app at this page. */
  open?: string;
  /** (app) The name the close is remembered by; one per app by default. */
  remember?: string;
  /** (app) Draw it on any device, for documentation. */
  preview?: boolean;
  position?: import("../0-face/toast-queue").ToastPosition;
  duration?: number;
  closeButton?: boolean;
  tone?: MessageTone;
  /** A title on the first line. */
  heading?: ReactNode;
  /** The text; `children` take its place when given. */
  text?: ReactNode;
  /** An icon from the library in place of the tone's own. */
  icon?: string;
  /** Buttons or links on the row under the words. */
  actions?: ReactNode;
  /** Show the close button. On by default when `onDismiss` is given. */
  dismissible?: boolean;
  /** A strip across the top of its positioning context instead of a block in the flow. */
  banner?: boolean;
  /** The close button was pressed. The product removes the notice; without
   * this callback the element hides itself. */
  onDismiss?: () => void;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const title = (content: ReactNode) =>
  content == null || content === false || content === "" ? null : h("span", { slot: "heading" }, content);

export const Message = forwardRef<MessageElement, MessageProps>(function Message(
  { expand, visibleToasts, richColors, contained, label, closeLabel, form, position, duration, closeButton, tone, heading, text, icon, actions, dismissible, banner, onDismiss, src, appId, appUrl, open, remember, preview, children, ...props }, ref,
) {
  const host = useRef<MessageElement | null>(null);
  useCommitEffect(() => {
    const element = host.current;
    if (!element || !onDismiss) return;
    const dismiss = (event: Event) => {
      if (event.target !== element) return;
      event.preventDefault();
      onDismiss();
    };
    element.addEventListener("ds-message-dismiss", dismiss);
    return () => element.removeEventListener("ds-message-dismiss", dismiss);
  });
  // The live region is in the markup from the first render, on the server too.
  return h("ds-message", {
    expand: expand || undefined, "visible-toasts": visibleToasts, "rich-colors": richColors || undefined, contained: contained || undefined, label, "close-label": closeLabel,
    form, position, duration, "close-button": closeButton || undefined,
    src, "app-id": appId, "app-url": appUrl, open, remember, preview: preview || undefined,
    role: form === "toast" ? "presentation" : form === "app" ? "region" : tone === "danger" ? "alert" : "status",
    ...props, tone, icon, banner: banner || undefined, dismissible: (dismissible ?? Boolean(onDismiss)) || undefined,
    ref: (element: MessageElement | null) => {
      host.current = element;
      if (typeof ref === "function") ref(element); else if (ref) ref.current = element;
    },
  },
  title(heading),
  children ?? text,
  actions == null || actions === false ? null : h("div", { slot: "actions", style: { display: "contents" } }, actions));
});

export { toast as message } from "./toast";
