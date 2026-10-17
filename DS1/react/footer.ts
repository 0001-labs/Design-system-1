import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { Footer as FooterElement } from "../4-page/ds-footer";

export type { FooterColumn, FooterLink, FooterPreference } from "../4-page/ds-footer";
export type FooterProps = Omit<HTMLAttributes<FooterElement>, "columns"> &
  Partial<Pick<FooterElement, "brand" | "href" | "tagline" | "columns" | "label" | "owner" | "year" | "preferences" | "literal">>;
/**
 * A site footer from data: `columns` is set as a property, so React passes
 * the array as it stands. A brand, preferences or legal line of the page's own
 * take `slot="brand"`, `slot="preferences"` and `slot="legal"`. A page that
 * must render its links on the server writes the `.ds-footer` classes instead.
 * Browser-only registration stays in the product's runtime entry for SSR.
 */
export const Footer = forwardRef<FooterElement, FooterProps>(function Footer({ preferences, ...props }, ref) {
  // `preferences` present but empty means every preference, as the attribute does.
  return createElement("ds-footer", { ...props, preferences: preferences === undefined ? undefined : String(preferences), ref });
});
