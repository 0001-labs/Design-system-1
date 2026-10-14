import { createElement, forwardRef, useEffect, useLayoutEffect, useRef, type InputHTMLAttributes, type ReactNode } from "react";

export type FilePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "children"> & {
  label: string;
  icon?: boolean;
  preview?: boolean;
  area?: boolean;
  dragging?: boolean;
  compact?: boolean;
  primary?: boolean;
  secondary?: boolean;
  /** Native chooser cancellation is not exposed on React input props. */
  onCancel?: (event: Event) => void;
  children?: ReactNode;
};

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The ref and events belong to the native input; classes only place the host. */
export const FilePicker = forwardRef<HTMLInputElement, FilePickerProps>(function FilePicker(
  { label, icon, preview, area, dragging, compact, primary, secondary, children, className, style, hidden, onCancel, ...props }, ref,
) {
  const input = useRef<HTMLInputElement>(null);
  useCommitEffect(() => {
    const element = input.current;
    if (!element || !onCancel) return;
    element.addEventListener("cancel", onCancel);
    return () => element.removeEventListener("cancel", onCancel);
  }, [onCancel]);
  return createElement("ds-file-picker", { label, icon: Boolean(icon), preview: Boolean(preview), area: Boolean(area), dragging: Boolean(dragging), compact: Boolean(compact), primary: Boolean(primary), secondary: Boolean(secondary), className, style, hidden },
    createElement("input", { ...props, type: "file", "aria-label": props["aria-label"] ?? label, ref: (element: HTMLInputElement | null) => { input.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element; }, hidden }),
    children != null ? createElement("span", {slot: "content", "aria-hidden": true}, children) : null,
  );
});
