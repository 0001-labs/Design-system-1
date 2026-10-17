import { createElement, forwardRef, type HTMLAttributes } from "react";
import type { DocumentPage as DocumentElement } from "../4-page/ds-document";

export type DocumentPageProps = HTMLAttributes<DocumentElement> &
  Partial<Pick<DocumentElement, "levels" | "label" | "literal" | "hideContents">>;
/**
 * A document page: the children are the writing (native headings,
 * paragraphs and a `<dl className="ds-definitions">`), in the light DOM so
 * they render on the server; the element builds the contents from them.
 * Browser-only registration stays in the product's runtime entry for SSR.
 */
export const DocumentPage = forwardRef<DocumentElement, DocumentPageProps>(function DocumentPage({ hideContents, ...props }, ref) {
  return createElement("ds-document", { ...props, "hide-contents": hideContents || undefined, "data-ds-prose": "", ref });
});
