export interface SelectionRect { left: number; top: number; right: number; bottom: number }
export function selectionRect(x1: number, y1: number, x2: number, y2: number): SelectionRect {
  return { left: Math.min(x1, x2), right: Math.max(x1, x2), top: Math.min(y1, y2), bottom: Math.max(y1, y2) };
}
export function intersects(a: SelectionRect, b: SelectionRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
/** Selection owns no content, and never starts on editors or their controls. */
export function canStartMarquee(target: Element): boolean {
  return !target.closest('aa-editor, ds-card, ds-button, ds-number, ds-select, ds-switch, [role="slider"], button, input, select, textarea, a, [contenteditable]');
}
