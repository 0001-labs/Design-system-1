import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { Header as HeaderElement } from "../4-page/ds-header";

export type HeaderProps = HTMLAttributes<HeaderElement> &
  Partial<Pick<HeaderElement, "variant" | "brand" | "href" | "label" | "literal" | "sticky">>;
/**
 * A site header. Its navigation is the children: `<a href>` links, in the
 * light DOM so they render on the server; actions take `slot="actions"`, a
 * brand of the page's own `slot="brand"`. Typed so a React product needs no
 * `IntrinsicElements` entry of its own for `ds-header`. Browser-only
 * registration stays in the product's runtime entry for SSR.
 */
export const Header = forwardRef<HeaderElement, HeaderProps>(function Header(props, ref) {
  return createElement("ds-header", { ...props, ref });
});
