import { createElement, forwardRef, type HTMLAttributes } from "react";
import { toast, type Toaster as ToasterElement, type ToastPosition } from "../2-core/ds-toast";

/**
 * Toast for React, based on Sonner (https://sonner.emilkowal.ski, MIT licence).
 * The same import as Sonner's: `import { Toaster, toast } from ".../react/toast"`,
 * then one `<Toaster />` in the app and `toast("Saved")` anywhere.
 */
export type ToasterProps = HTMLAttributes<ToasterElement> & {
  position?: ToastPosition;
  expand?: boolean;
  visibleToasts?: number;
  duration?: number;
  closeButton?: boolean;
  richColors?: boolean;
  contained?: boolean;
  label?: string;
  closeLabel?: string;
};
export const Toaster = forwardRef<ToasterElement, ToasterProps>(function Toaster({ visibleToasts, closeButton, richColors, closeLabel, expand, contained, ...props }, ref) {
  return createElement("ds-toast", {
    ...props, ref,
    "visible-toasts": visibleToasts, "close-label": closeLabel,
    expand: expand || undefined, "close-button": closeButton || undefined, "rich-colors": richColors || undefined, contained: contained || undefined,
  });
});
export { toast };
export type { ToastButton, ToastData, ToastId, ToastOptions, ToastPosition, ToastPromiseMessages, ToastType } from "../2-core/ds-toast";
