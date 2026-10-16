import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { Page } from "../../DS1/4-page/ds-page";
import type { Sidebar } from "../../DS1/3-unit/ds-sidebar";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ds-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { type?: string };
      "ds-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { control?: "host"; choice?: boolean; active?: boolean };
      "ds-page": DetailedHTMLProps<HTMLAttributes<Page>, Page> & Partial<Pick<Page, "layout" | "divided" | "fill">>;
      "ds-sidebar": DetailedHTMLProps<HTMLAttributes<Sidebar>, Sidebar> & { label?: string; empty?: string };
    }
  }
}
