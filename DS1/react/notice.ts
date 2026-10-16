/** An inline notice in React: the words stay in the light DOM, so they render
 * on the server and read in tests; ds-notice draws them and is the live region.
 * Browser-only registration of ds-notice stays in the product's runtime entry. */
import { createElement as h, forwardRef, useEffect, useLayoutEffect, useRef, type HTMLAttributes, type ReactNode } from "react";
import type { Notice as NoticeElement, NoticeTone } from "../2-core/ds-notice";

export type { NoticeTone } from "../2-core/ds-notice";
export type NoticeProps = Omit<HTMLAttributes<NoticeElement>, "title"> & {
  /** The mark's colour and icon; danger also colours the words. Neutral by default. */
  tone?: NoticeTone;
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
  /** The close button was pressed. The product removes the notice; without
   * this callback the element hides itself. */
  onDismiss?: () => void;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
const title = (content: ReactNode) =>
  content == null || content === false || content === "" ? null : h("span", { slot: "heading" }, content);

export const Notice = forwardRef<NoticeElement, NoticeProps>(function Notice(
  { tone, heading, text, icon, actions, dismissible, onDismiss, children, ...props }, ref,
) {
  const host = useRef<NoticeElement | null>(null);
  useCommitEffect(() => {
    const element = host.current;
    if (!element || !onDismiss) return;
    const dismiss = (event: Event) => {
      if (event.target !== element) return;
      event.preventDefault();
      onDismiss();
    };
    element.addEventListener("ds-notice-dismiss", dismiss);
    return () => element.removeEventListener("ds-notice-dismiss", dismiss);
  });
  // The live region is in the markup from the first render, on the server too.
  return h("ds-notice", {
    role: tone === "danger" ? "alert" : "status",
    ...props, tone, icon, dismissible: (dismissible ?? Boolean(onDismiss)) || undefined,
    ref: (element: NoticeElement | null) => {
      host.current = element;
      if (typeof ref === "function") ref(element); else if (ref) ref.current = element;
    },
  },
  title(heading),
  children ?? text,
  actions == null || actions === false ? null : h("div", { slot: "actions", style: { display: "contents" } }, actions));
});
