import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { Sidebar } from "../../DS1/3-unit/ds-sidebar";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ds-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { type?: string };
      "ds-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { control?: "host"; choice?: boolean; active?: boolean };
      "ds-sidebar": DetailedHTMLProps<HTMLAttributes<Sidebar>, Sidebar> & { label?: string; empty?: string };
    }
  }
}
