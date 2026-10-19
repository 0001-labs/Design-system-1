/** Internal value interaction used by editor handles. No product state is stored.
 * Pointer preview is raw unless snapPreview is set; commits snap to step.
 * Cancellation restores the initial preview and never commits. Keyboard callers
 * choose immediate commits or a preview followed by one commit on keyup/blur.
 * Consumers own placement, undo snapshots and the surrounding document. */
export interface SpacingOptions {
  value: number; min?: number; max?: number; step?: number; shiftStep?: number;
  axis?: "horizontal" | "vertical"; gain?: number; disabled?: boolean;
  snapPreview?: boolean; immediateKeyboard?: boolean; threshold?: number;
  /** Disable slider keys when a native input owns keyboard editing. */
  keyboard?: boolean;
  onPointerStart?: (event: PointerEvent) => void;
  onStart?: (kind: "pointer" | "keyboard") => void;
  onPreview?: (value: number) => void;
  onCommit: (value: number) => void;
  onEnd?: (cancelled: boolean) => void;
  onTap?: (event: PointerEvent) => void;
}
export function bindSpacingHandle(target: HTMLElement, options: () => SpacingOptions): () => void {
  let cancelPointer: (() => void) | undefined;
  let keyboard: { start: number; value: number; immediate: boolean } | undefined;
  const clamp = (v: number, o: SpacingOptions) => Math.min(o.max ?? Infinity, Math.max(o.min ?? 0, v));
  const snap = (v: number, o: SpacingOptions) => clamp(Math.round(v / (o.step || 1)) * (o.step || 1), o);
  const finishKeyboard = (cancel = false) => {
    if (!keyboard) return;
    const state = keyboard; keyboard = undefined;
    const o = options();
    if (cancel) { if (!state.immediate) o.onPreview?.(state.start); }
    else if (!state.immediate) o.onCommit(state.value);
    o.onEnd?.(cancel);
  };
  const down = (e: PointerEvent) => {
    const o = options();
    if (o.disabled || !e.isPrimary || e.button !== 0 || e.detail > 1) return;
    e.preventDefault(); e.stopPropagation();
    finishKeyboard(); cancelPointer?.(); o.onPointerStart?.(e);
    const start = o.value;
    const origin = o.axis === "vertical" ? e.clientY : e.clientX;
    let value = start; let moved = false; let active = true;
    const win = target.ownerDocument.defaultView!;
    const finish = (cancel: boolean) => {
      if (!active) return;
      active = false;
      win.removeEventListener("pointermove", move); win.removeEventListener("pointerup", up);
      win.removeEventListener("pointercancel", cancelled); win.removeEventListener("blur", cancelled);
      win.removeEventListener("keydown", escape); target.removeEventListener("lostpointercapture", cancelled);
      cancelPointer = undefined;
      try { if (target.hasPointerCapture?.(e.pointerId)) target.releasePointerCapture(e.pointerId); } catch { /* capture already released */ }
      if (moved) {
        if (cancel) options().onPreview?.(start); else options().onCommit(snap(value, o));
        options().onEnd?.(cancel);
      } else if (!cancel) options().onTap?.(e);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerId !== e.pointerId) return;
      if (options().disabled) { finish(true); return; }
      const delta = (o.axis === "vertical" ? event.clientY : event.clientX) - origin;
      if (!moved && Math.abs(delta) < (o.threshold ?? 3)) return;
      if (!moved) { moved = true; options().onStart?.("pointer"); options().onPreview?.(o.snapPreview ? snap(start, o) : start); }
      value = clamp(start + delta * (o.gain ?? 1), o);
      options().onPreview?.(o.snapPreview ? snap(value, o) : value);
    };
    const up = (event: PointerEvent) => { if (event.pointerId === e.pointerId) finish(false); };
    const cancelled = (event: Event) => { if (!("pointerId" in event) || (event as PointerEvent).pointerId === e.pointerId) finish(true); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); finish(true); } };
    try { target.setPointerCapture?.(e.pointerId); } catch { /* window listeners remain available */ }
    win.addEventListener("pointermove", move); win.addEventListener("pointerup", up);
    win.addEventListener("pointercancel", cancelled); win.addEventListener("blur", cancelled);
    win.addEventListener("keydown", escape); target.addEventListener("lostpointercapture", cancelled);
    cancelPointer = () => finish(true);
  };
  const key = (e: KeyboardEvent) => {
    const o = options();
    if (o.keyboard === false) return;
    if (o.disabled) { finishKeyboard(true); return; }
    if (e.key === "Escape" && keyboard) { e.preventDefault(); e.stopPropagation(); finishKeyboard(true); return; }
    const positive = o.axis === "vertical" ? "ArrowUp" : "ArrowRight";
    const negative = o.axis === "vertical" ? "ArrowDown" : "ArrowLeft";
    if (![positive, negative, "Home", "End"].includes(e.key) || (e.key === "End" && o.max === undefined)) return;
    e.preventDefault(); e.stopPropagation();
    if (!keyboard) { keyboard = { start: o.value, value: o.value, immediate: !!o.immediateKeyboard }; o.onStart?.("keyboard"); }
    const step = e.shiftKey ? (o.shiftStep ?? (o.step || 1) * 10) : (o.step || 1);
    keyboard.value = snap(e.key === "Home" ? (o.min ?? 0) : e.key === "End" ? o.max! : (keyboard.immediate ? o.value : keyboard.value) + (e.key === positive ? step : -step), o);
    if (keyboard.immediate) o.onCommit(keyboard.value); else o.onPreview?.(keyboard.value);
  };
  const keyup = (e: KeyboardEvent) => { if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) finishKeyboard(); };
  const blur = () => finishKeyboard();
  target.addEventListener("pointerdown", down); target.addEventListener("keydown", key);
  target.addEventListener("keyup", keyup); target.addEventListener("blur", blur);
  return () => {
    cancelPointer?.(); finishKeyboard(true);
    target.removeEventListener("pointerdown", down); target.removeEventListener("keydown", key);
    target.removeEventListener("keyup", keyup); target.removeEventListener("blur", blur);
  };
}
