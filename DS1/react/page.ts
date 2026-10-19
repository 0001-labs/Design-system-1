import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { Page as PageElement } from "../4-page/ds-page";

export type PageProps = HTMLAttributes<PageElement> &
  Partial<Pick<PageElement, "layout" | "divided" | "measure" | "fill" | "view" | "drawer" | "drawerLabel">>;
/**
 * A standard page. Typed so a React product needs no `IntrinsicElements`
 * entry of its own for `ds-page`; `measure` is a count of squares, and
 * `drawer` folds the navigation into a drawer on a narrow page.
 * Browser-only registration stays in the product's runtime entry for SSR.
 */
export const Page = forwardRef<PageElement, PageProps>(function Page(props, ref) {
  return createElement("ds-page", { ...props, ref });
});
