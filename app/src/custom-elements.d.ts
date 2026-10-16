import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "ds-icon": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { type?: string };
      "ds-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { control?: "host"; choice?: boolean; active?: boolean };
    }
  }
}
