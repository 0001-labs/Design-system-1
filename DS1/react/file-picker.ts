import { createElement, forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export type FilePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "defaultValue" | "children"> & {
  label: string;
  icon?: boolean;
  preview?: boolean;
  compact?: boolean;
  primary?: boolean;
  secondary?: boolean;
  children?: ReactNode;
};

/** The ref and events belong to the native input; classes only place the host. */
export const FilePicker = forwardRef<HTMLInputElement, FilePickerProps>(function FilePicker(
  { label, icon, preview, compact, primary, secondary, children, className, style, hidden, ...props }, ref,
) {
  return createElement("ds-file-picker", { label, icon: Boolean(icon), preview: Boolean(preview), compact: Boolean(compact), primary: Boolean(primary), secondary: Boolean(secondary), className, style, hidden },
    createElement("input", { ...props, type: "file", "aria-label": props["aria-label"] ?? label, ref, hidden }),
    children != null ? createElement("span", {slot: "content", "aria-hidden": true}, children) : null,
  );
});
