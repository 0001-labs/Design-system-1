import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { Sidebar } from "../../DS1/3-unit/ds-sidebar";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ds-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { type?: string };
      "ds-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { control?: "host"; choice?: boolean; active?: boolean };
      "ds-sidebar": DetailedHTMLProps<HTMLAttributes<Sidebar>, Sidebar> & { label?: string; empty?: string };
      "ds-tabs": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { fill?: boolean; wrap?: boolean };
      "ds-panel": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
      "ds-list": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { columns?: number };
      "ds-row": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { fill?: boolean; auto?: boolean; end?: boolean; centered?: boolean };
      "ds-cycle": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { type?: string; secondary?: boolean };
    }
  }
}
