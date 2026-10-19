/** Context in React: the menu that opens where the pointer is, on the shared `ds-context`. React state and native events; no positioning or gesture code. */
import {
  Children, cloneElement, createContext, createElement as h, forwardRef,
  useCallback, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
  type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode, type Ref,
} from "react";
import { MenuHost, type MenuProps } from "./menu-engine";
import { Button, type ButtonProps } from "./button";
import { FilePicker, type FilePickerProps } from "./file-picker";
import type { Menu as MenuElement, MenuAnchor, MenuCloseReason } from "../3-unit/ds-menu";

const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
type State = {
  open: boolean;
  change: (open: boolean, reason?: MenuCloseReason | "trigger") => void;
  trigger: HTMLElement | null;
  setTrigger: (element: HTMLElement | null) => void;
  menu: { current: MenuElement | null };
  id: string;
  nested: boolean;
};
const MenuState = createContext<State | null>(null);
const useMenu = () => {
  const state = useContext(MenuState);
  if (!state) throw new Error("Context controls must be inside Context or ContextSub.");
  return state;
};
export interface ContextProps {
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}
function Scope({ children, open, defaultOpen = false, onOpenChange, nested = false }: ContextProps & { nested?: boolean }) {
  const [internal, setInternal] = useState(defaultOpen);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const menu = useRef<MenuElement>(null), id = useId();
  return h(MenuState.Provider, { value: {
    open: open ?? internal, trigger, setTrigger, menu, id, nested,
    change: next => { if (open === undefined) setInternal(next); onOpenChange?.(next); },
  } }, children);
}
export function Context(props: ContextProps) { return h(Scope, props); }
export function ContextSub(props: ContextProps) { return h(Scope, { ...props, nested: true }); }

function setRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value); else if (ref) ref.current = value;
}
export type ContextTriggerProps = HTMLAttributes<HTMLElement> & { asChild?: boolean; disabled?: boolean };
export const ContextTrigger = forwardRef<HTMLElement, ContextTriggerProps>(function ContextTrigger(
  { asChild, disabled = false, children, ...props }, ref,
) {
  const state = useMenu();
  const child = asChild ? Children.only(children) as ReactElement<HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> }> : null;
  const childRef = child?.props.ref;
  const bind = useCallback((element: HTMLElement | null) => {
    setRef(ref, element); setRef(childRef, element);
    state.setTrigger(disabled ? null : element);
  }, [ref, childRef, state.setTrigger, disabled]);
  const attributes = { ...props, ref: bind, "data-state": state.open ? "open" : "closed", "data-slot": "context-trigger" };
  if (child) {
    // The child keeps its product handlers. A supplied trigger handler runs
    // afterwards, unless the child deliberately consumed the event.
    const merged: Record<string, unknown> = { ...child.props, ...attributes };
    for (const [key, value] of Object.entries(props)) {
      const first = (child.props as Record<string, unknown>)[key];
      if (/^on[A-Z]/.test(key) && typeof first === "function" && typeof value === "function") {
        merged[key] = (event: { defaultPrevented: boolean }) => { first(event); if (!event.defaultPrevented) value(event); };
      }
    }
    return cloneElement(child, merged);
  }
  return h("span", { ...attributes, tabIndex: disabled ? -1 : 0 }, children);
});

export type ContextContentProps = Omit<MenuProps, "open" | "trigger" | "anchor" | "triggerMode" | "onOpenChange"> & {
  /** The context bar over what is selected: the rows side by side, standing over `anchor`, the focus left where it is. */
  bar?: boolean;
  /** Where a bar stands: the selection's rectangle, or an element. */
  anchor?: MenuAnchor | null;
};
export const ContextContent = forwardRef<MenuElement, ContextContentProps>(function ContextContent(
  { children, placement, bar, anchor, ...props }, ref,
) {
  const state = useMenu();
  useCommitEffect(() => { state.menu.current?.renderNow(); });
  // Render the closed host so the source can continue listening to its trigger.
  // Open descendants unmount together, including nested menu state.
  return h(MenuHost, { ...props, bar, tag: state.nested ? "ds-select" : "ds-context", id: props.id ?? state.id, role: "menu", hidden: !state.open,
    "data-slot": state.nested ? "context-sub-content" : "context-content",
    open: state.open, trigger: state.trigger, anchor: bar ? anchor ?? null : state.trigger,
    triggerMode: state.nested ? "submenu" : "context", placement: placement ?? (bar ? "top" : state.nested ? "right" : "bottom"),
    ref: (element: MenuElement | null) => { state.menu.current = element; setRef(ref, element); },
    onOpenChange: state.change,
  } as MenuProps, state.open ? children : null);
});
export const ContextSubContent = ContextContent;

export type ContextItemProps = Omit<ButtonProps, "onSelect"> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  textValue?: string;
  onSelect?: (event: Event) => void;
};
export const ContextItem = forwardRef<HTMLButtonElement, ContextItemProps>(function ContextItem(
  { inset, variant, textValue, onClick, onSelect, children, style, ...props }, ref,
) {
  const state = useMenu();
  return h(Button, { ...props, ref, menuItem: true, danger: variant === "destructive" || props.danger,
    role: props.role ?? "menuitem", "data-text-value": textValue, "data-keep-open": "",
    style: { ...style, ...(inset ? { "--ds-button-padding": "0 calc(4px * var(--ds-sf)) 0 var(--ds-unit)" } : {}) } as CSSProperties,
    onClick: event => {
      if (props.disabled) return;
      onClick?.(event);
      if (event.defaultPrevented) return;
      const select = new Event("ds-menu-select", { cancelable: true });
      onSelect?.(select);
      if (!select.defaultPrevented) state.menu.current?.select();
    },
  } as ButtonProps, children);
});

const indicatorStyle: CSSProperties = { display: "inline-flex", flex: "0 0 var(--ds-unit)", alignItems: "center" };
function mark(checked: boolean | "indeterminate") {
  return h("span", { "aria-hidden": true, style: indicatorStyle }, checked ? h("ds-icon", { type: checked === "indeterminate" ? "minus" : "check" }) : null);
}
export const ContextCheckboxItem = forwardRef<HTMLButtonElement, ContextItemProps & {
  checked?: boolean | "indeterminate"; onCheckedChange?: (checked: boolean) => void;
}>(function ContextCheckboxItem({ checked = false, onCheckedChange, onSelect, children, ...props }, ref) {
  return h(ContextItem, { ...props, ref, role: "menuitemcheckbox", "aria-checked": checked === "indeterminate" ? "mixed" : checked,
    onSelect: event => { onSelect?.(event); if (!event.defaultPrevented) onCheckedChange?.(checked !== true); },
  }, mark(checked), children);
});
const Radio = createContext<{ value?: string; change?: (value: string) => void }>({});
export function ContextRadioGroup({ value, onValueChange, children, ...props }: HTMLAttributes<HTMLDivElement> & { value?: string; onValueChange?: (value: string) => void }) {
  return h(Radio.Provider, { value: { value, change: onValueChange } }, h(ContextGroup, props, children));
}
export const ContextRadioItem = forwardRef<HTMLButtonElement, ContextItemProps & { value: string }>(function ContextRadioItem(
  { value, onSelect, children, ...props }, ref,
) {
  const radio = useContext(Radio), checked = radio.value === value;
  return h(ContextItem, { ...props, ref, role: "menuitemradio", "aria-checked": checked,
    onSelect: event => { onSelect?.(event); if (!event.defaultPrevented) radio.change?.(value); },
  }, mark(checked), children);
});
export const ContextSubTrigger = forwardRef<HTMLButtonElement, ContextItemProps>(function ContextSubTrigger(
  { children, inset, variant, textValue, onSelect: _onSelect, ...props }, ref,
) {
  const state = useMenu();
  const bind = useCallback((element: HTMLButtonElement | null) => { state.setTrigger(element); setRef(ref, element); }, [ref, state.setTrigger]);
  return h(Button, { ...props, ref: bind, role: "menuitem", menuItem: true, active: state.open, "data-keep-open": "",
    danger: variant === "destructive", "data-text-value": textValue,
    "data-state": state.open ? "open" : "closed",
  } as ButtonProps, inset ? mark(false) : null, children,
  h("ds-icon", { type: "right", "aria-hidden": true, style: { marginInlineStart: "auto", flex: "none" } }));
});
export function ContextFilePicker({ onFiles, ...props }: Omit<FilePickerProps, "onChange"> & { onFiles: (files: File[]) => void }) {
  return h(FilePicker, { ...props, role: "menuitem", onChange: event => {
    const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = "";
    if (!props.disabled && files.length) onFiles(files);
  } });
}
export function ContextGroup(props: HTMLAttributes<HTMLDivElement>): ReactElement {
  return h("div", { ...props, role: "group", style: { ...props.style, display: "contents" } });
}
export function ContextLabel({ inset, children, ...props }: HTMLAttributes<HTMLElement> & { inset?: boolean }) {
  return h("ds-text", { ...props, literal: true, tone: "muted", "data-ds-menu-label": "" }, inset ? mark(false) : null, children);
}
export function ContextSeparator(props: HTMLAttributes<HTMLHRElement>) { return h("hr", { ...props, "data-ds-menu-separator": "" }); }
export function ContextShortcut(props: HTMLAttributes<HTMLSpanElement>): ReactElement {
  return h("span", { ...props, style: { marginInlineStart: "auto", color: "var(--ds-text-color-muted)", ...props.style } });
}
