/** React state binding only. ds-input owns the field and all of its behavior. */
import {
  createElement,
  forwardRef,
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  type ChangeEvent,
  type InputEvent as ReactInputEvent,
  type InputHTMLAttributes,
  type Ref,
} from "react";
import type { Input as InputElement } from "../2-core/ds-input";
export type { InputElement };
export type InputProps = Omit<
  InputHTMLAttributes<InputElement>,
  "value" | "defaultValue" | "type" | "size"
> & {
  value?: string | number;
  defaultValue?: string | number;
  type?: InputElement["type"];
  variant?: InputElement["variant"];
  revealable?: boolean;
  quietFocus?: boolean;
  /** The label on the row above the field, as written. */
  label?: string;
  /** The label as a translation key, shown in the page's language. */
  labelText?: string;
  /** The placeholder as a translation key; `placeholder` is as written. */
  placeholderKey?: string;
  /** The error under the field, as written, in the danger colour. */
  error?: string;
  /** The error as a translation key. */
  errorText?: string;
  /** Suggestions offered while typing; `list` names a `<datalist>` instead. */
  suggestions?: InputElement["suggestions"];
};
const useCommitEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
/** Native listeners cross Lit's shadow boundary without React's input tracker.
 * Keep the familiar React event methods while exposing the shared element.
 */
function reactEvent(event: Event, field: InputElement) {
  return new Proxy(event, {
    get(native, key) {
      if (key === "target" || key === "currentTarget") return field;
      if (key === "nativeEvent") return native;
      if (key === "persist") return () => {};
      if (key === "isDefaultPrevented") return () => native.defaultPrevented;
      if (key === "isPropagationStopped") return () => native.cancelBubble;
      const value = Reflect.get(native, key, native);
      return typeof value === "function" ? value.bind(native) : value;
    },
  });
}
function setRef(ref: Ref<InputElement> | undefined, field: InputElement | null) {
  if (typeof ref === "function") return ref(field);
  if (ref) ref.current = field;
}

type FieldProps = InputProps & {
  rows?: number;
  wrap?: "soft" | "hard" | "off";
  autoGrow?: boolean;
  maxRows?: number;
};
export type TextareaProps = Omit<
  FieldProps,
  "type" | "revealable" | "min" | "max" | "step" | "pattern" | "suggestions" | "list"
> & { variant?: "field" | "plain" };
function fieldAdapter<Props extends FieldProps>(tag: "ds-input" | "ds-textarea") {
  return forwardRef<InputElement, Props>(function Field(
    {
      value,
      defaultValue,
      onChange,
      onInput,
      autoFocus,
      autoComplete,
      inputMode,
      readOnly,
      minLength,
      maxLength,
      min,
      max,
      step,
      spellCheck,
      form,
      type = "text",
      variant = "field",
      quietFocus,
      autoGrow,
      maxRows,
      labelText,
      placeholderKey,
      errorText,
      ...props
    },
    forwardedRef,
  ) {
    const field = useRef<InputElement | null>(null);
    const initial = useRef(String(defaultValue ?? ""));
    const [, refresh] = useReducer((version: number) => version + 1, 0);
    const controlled = value !== undefined;
    const ref = useCallback(
      (element: InputElement | null) => {
        field.current = element;
        return setRef(forwardedRef, element);
      },
      [forwardedRef],
    );
    // React does not restore controlled values on custom elements. Reconcile
    // after every commit, including when an application rejects an edit.
    useCommitEffect(() => {
      if (controlled && field.current) field.current.value = String(value);
      // form is a read-only ElementInternals getter, not a writable property.
      if (form !== undefined) field.current?.setAttribute("form", form);
      else field.current?.removeAttribute("form");
    });
    useEffect(() => {
      const element = field.current;
      if (!element || !controlled) return;
      const reset = () => refresh();
      element.addEventListener("input-reset", reset);
      return () => element.removeEventListener("input-reset", reset);
    }, [controlled]);
    const attributes: Record<string, unknown> = { ...props };
    const listeners: Array<{ name: string; capture: boolean; callback: EventListener }> = [];
    for (const key of Object.keys(attributes)) {
      if (key.startsWith("aria-") && typeof attributes[key] === "boolean")
        attributes[key] = String(attributes[key]);
      if (/^on[A-Z]/.test(key) && typeof attributes[key] === "function") {
        const callback = attributes[key] as (event: Event) => void;
        const capture = key.endsWith("Capture");
        const name = key.slice(2, capture ? -7 : undefined);
        const native =
          (
            { Focus: "focusin", Blur: "focusout", DoubleClick: "dblclick" } as Record<
              string,
              string
            >
          )[name] ?? name.toLowerCase();
        listeners.push({
          name: native,
          capture,
          callback: (event: Event) => {
            if (field.current) callback(reactEvent(event, field.current));
          },
        });
        delete attributes[key];
      }
    }
    listeners.push({
      name: "input",
      capture: false,
      callback: (native: Event) => {
        if (!field.current) return;
        const event = reactEvent(native, field.current);
        onInput?.(event as unknown as ReactInputEvent<InputElement>);
        onChange?.(event as unknown as ChangeEvent<InputElement>);
        if (controlled) refresh();
      },
    });
    useCommitEffect(() => {
      const element = field.current;
      if (!element) return;
      for (const { name, callback, capture } of listeners)
        element.addEventListener(name, callback, capture);
      return () => {
        for (const { name, callback, capture } of listeners)
          element.removeEventListener(name, callback, capture);
      };
    });
    return createElement(tag, {
      ...attributes,
      ref,
      type,
      variant,
      value: controlled ? String(value) : initial.current,
      autofocus: autoFocus,
      autocomplete: autoComplete,
      inputmode: inputMode,
      readonly: readOnly,
      minlength: minLength,
      maxlength: maxLength,
      min: min == null ? undefined : String(min),
      max: max == null ? undefined : String(max),
      step: step == null ? undefined : String(step),
      spellcheck: spellCheck === undefined ? undefined : String(spellCheck),
      "quiet-focus": quietFocus,
      "label-text": labelText,
      "placeholder-key": placeholderKey,
      "error-text": errorText,
      "auto-grow": autoGrow,
      "max-rows": maxRows,
    });
  });
}
export const Input = fieldAdapter<InputProps>("ds-input");
export const Textarea = fieldAdapter<TextareaProps>("ds-textarea");
