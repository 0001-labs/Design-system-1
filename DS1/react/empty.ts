/** An empty state in React: the words stay in the light DOM, so they render on
 * the server and read in tests; ds-empty draws them. Browser-only registration
 * of ds-empty stays in the product's runtime entry. */
import { createElement as h, forwardRef, type HTMLAttributes, type ReactNode } from "react";
import type { Empty as EmptyElement } from "../2-core/ds-empty";

export type EmptyProps = Omit<HTMLAttributes<EmptyElement>, "title"> & {
  /** The title. Unset, the shared words' "Nothing here yet" in the current language. */
  heading?: ReactNode;
  /** The line under the title; `children` take its place when given. */
  text?: ReactNode;
  /** An icon from the library inline before the title. */
  icon?: string;
  /** The buttons or links that fill the place, on one row. */
  actions?: ReactNode;
  /** Centre the words in the space the element stands in. */
  centered?: boolean;
  /** Make the title a heading of this level (1–6). */
  level?: number;
  /** `done`: empty because everything is finished, the check on the success green. */
  tone?: "done";
};

const title = (content: ReactNode) =>
  content == null || content === false || content === "" ? null : h("span", { slot: "heading" }, content);

export const Empty = forwardRef<EmptyElement, EmptyProps>(function Empty(
  { heading, text, icon, actions, centered, level, tone, children, ...props }, ref,
) {
  return h("ds-empty", { ...props, icon, centered: centered ?? true, level, tone, ref },
    title(heading),
    children ?? text,
    actions == null || actions === false ? null : h("div", { slot: "actions", style: { display: "contents" } }, actions));
});
