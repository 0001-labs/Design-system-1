/** Native semantics and React events; the shared Lit element owns the face. */
import { createElement, forwardRef, type AnchorHTMLAttributes, type ReactElement, type RefAttributes, type Ref, type ButtonHTMLAttributes } from "react";
import { SplitButton, type SplitButtonProps } from "./button-split";
export type { SplitButtonProps, SplitSegment } from "./button-split";
import type { Button as ButtonElement } from "../2-core/ds-button";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  Partial<Pick<ButtonElement, "primary" | "secondary" | "active" | "choice" | "icon" | "wide" | "fixed" | "fit" | "danger" | "menuItem">>;

const ButtonControl = forwardRef<HTMLButtonElement, ButtonProps | SplitButtonProps<string>>(function Button(
  props, ref,
) {
  if ("split" in props && props.split) return createElement(SplitButton, { ...props, forwardedRef: ref as unknown as Ref<ButtonElement> });
  const {
    children,
    className,
    style,
    primary,
    secondary,
    active,
    choice,
    icon,
    wide,
    fixed,
    fit,
    danger,
    menuItem,
    disabled,
    hidden,
    type = "button",
    ...nativeProps
  } = props as ButtonProps;
  return createElement(
    "ds-button",
    {
      control: "slotted",
      primary,
      secondary,
      active,
      choice,
      icon,
      wide,
      fixed,
      fit,
      danger,
      menuItem,
      disabled,
      hidden,
      className,
      style,
    },
    createElement("button", { ...nativeProps, ref, type, disabled, hidden }, children),
  );
});

export const Button = ButtonControl as unknown as {
  <const T extends string>(props: SplitButtonProps<T> & RefAttributes<ButtonElement>): ReactElement | null;
  (props: ButtonProps & RefAttributes<HTMLButtonElement>): ReactElement | null;
  displayName?: string;
};

/** A real link: browser navigation, context menus and modifier clicks survive. */
export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> &
  Partial<Pick<ButtonElement, "primary" | "secondary" | "active" | "choice" | "icon" | "wide" | "fixed" | "fit" | "danger" | "menuItem">> & {disabled?: boolean};
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {children, className, style, primary, secondary, active, choice, icon, wide, fixed, fit, danger, menuItem, disabled, hidden, href, onClick, onAuxClick, tabIndex, ...props}, ref,
) {
  return createElement("ds-button", {control: "slotted", primary, secondary, active, choice, icon, wide, fixed, fit, danger, menuItem, disabled, hidden, className, style},
    createElement("a", {...props, ref, href: disabled ? undefined : href, hidden,
      "aria-disabled": disabled || undefined, tabIndex: disabled ? -1 : tabIndex,
      onClick: event => { if (disabled) { event.preventDefault(); event.stopPropagation(); } else onClick?.(event); },
      onAuxClick: event => { if (disabled) { event.preventDefault(); event.stopPropagation(); } else onAuxClick?.(event); },
    }, children));
});
