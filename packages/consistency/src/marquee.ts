export interface SelectionRect { left: number; top: number; right: number; bottom: number }
export function selectionRect(x1: number, y1: number, x2: number, y2: number): SelectionRect {
  return { left: Math.min(x1, x2), right: Math.max(x1, x2), top: Math.min(y1, y2), bottom: Math.max(y1, y2) };
}
export function intersects(a: SelectionRect, b: SelectionRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
/** Selection owns no content, and never starts on editors or their controls. */
export function canStartMarquee(target: Element): boolean {
  return !target.closest('aa-editor, ds-card, ds-button, ds-number, ds-select, ds-switch, [role="slider"], [role="button"], [role="menu"], [role="toolbar"], [data-aa-interactive], [data-handle], .consistency-resize-edge, button, input, select, textarea, a, summary, [contenteditable]');
}
/** Empty editor lines and composition chrome are space, not authored elements. */
export function isMarqueeContent(element: HTMLElement): boolean {
  if (element.closest('.consistency-gap,.consistency-text-gap,.consistency-card-gap,.consistency-stat-gap,.ghost-surface,.consistency-resize-edge,[data-handle]')) return false;
  if (!element.classList.contains('aa-block')) return true;
  return !!element.textContent?.trim() || element.dataset.kind === 'divider' || !!element.querySelector('.aa-atom,img,hr,video,canvas,ds-card,ds-button,table');
}

/** Keep group identity for commands, but paint only authored component bounds. */
export function paintCompositionSelection(root: HTMLElement, selection: Set<string>): void {
  const elements = Array.from(root.querySelectorAll<HTMLElement>('[data-selectable]'));
  const selected = elements.filter(element => selection.has(element.dataset.selectable!));
  for (const element of elements) {
    const attribute = element.classList.contains('aa-block') ? 'data-composition-selected' : 'data-selected';
    const active = selection.has(element.dataset.selectable!);
    if (element.hasAttribute(attribute) !== active) element.toggleAttribute(attribute, active);
  }
  for (const element of root.querySelectorAll<HTMLElement>('[data-selectable], .aa-block')) {
    const leaf = !element.querySelector('[data-selectable], .aa-block');
    const active = leaf && isMarqueeContent(element) && selected.some(parent => parent === element || parent.contains(element));
    if (element.hasAttribute('data-selection-face') !== active) element.toggleAttribute('data-selection-face', active);
  }
}

/** A gesture owns its overlay and geometry cache; the composition changes only at release. */
export function beginMarquee(root: HTMLElement, event: PointerEvent, previous: Set<string>, commit: (selection: Set<string>) => void, paint?: (selection: Set<string>) => void): () => void {
  const view = root.ownerDocument.defaultView!;
  const stage = event.currentTarget as HTMLElement;
  const base = event.shiftKey ? new Set(previous) : new Set<string>();
  const overlay = root.ownerDocument.createElement('div');
  overlay.className = 'consistency-marquee'; overlay.setAttribute('aria-hidden', 'true');
  stage.append(overlay);
  let point = { x: event.clientX, y: event.clientY }, frame = 0, ended = false, dirty = true;
  let chosen = new Set(base);
  let candidates: { element: HTMLElement; id: string; rect: DOMRect }[] = [];
  const origin = { x: event.clientX, y: event.clientY };
  const stageStart = stage.getBoundingClientRect();
  const scrollOwners: { element: HTMLElement; x: number; y: number }[] = [];
  for (let element = event.target as HTMLElement | null; element && stage.contains(element); element = element.parentElement) {
    scrollOwners.push({ element, x: element.scrollLeft, y: element.scrollTop });
  }
  const observed = new WeakSet<Element>();
  const paintSelection = (selection: Set<string>) => paint ? paint(selection) : paintCompositionSelection(root, selection);
  const draw = () => {
    frame = 0;
    if (ended) return;
    if (dirty) {
      const bounds = stage.getBoundingClientRect();
      origin.x = event.clientX + bounds.left - stageStart.left - scrollOwners.reduce((sum, item) => sum + item.element.scrollLeft - item.x, 0);
      origin.y = event.clientY + bounds.top - stageStart.top - scrollOwners.reduce((sum, item) => sum + item.element.scrollTop - item.y, 0);
      candidates = Array.from(root.querySelectorAll<HTMLElement>('[data-selectable]'))
        .filter(element => !element.hidden && isMarqueeContent(element) && !element.querySelector('[data-selectable]') && element.getClientRects().length)
        .map(element => ({ element, id: element.dataset.selectable!, rect: element.getBoundingClientRect() }));
      for (const candidate of candidates) if (!observed.has(candidate.element)) { observed.add(candidate.element); resize.observe(candidate.element); }
      dirty = false;
    }
    const rect = selectionRect(origin.x, origin.y, point.x, point.y);
    Object.assign(overlay.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.right - rect.left}px`, height: `${rect.bottom - rect.top}px` });
    const next = new Set(base);
    for (const candidate of candidates) if (intersects(rect, candidate.rect)) next.add(candidate.id);
    if (next.size !== chosen.size || Array.from(next).some(id => !chosen.has(id))) { chosen = next; paintSelection(chosen); }
  };
  const schedule = () => { if (!frame) frame = view.requestAnimationFrame(draw); };
  const invalidate = () => { dirty = true; schedule(); };
  const move = (next: PointerEvent) => { if (next.pointerId === event.pointerId) { point = { x: next.clientX, y: next.clientY }; schedule(); } };
  const finish = (cancelled: boolean) => {
    if (ended) return;
    view.cancelAnimationFrame(frame); frame = 0;
    if (!cancelled) draw();
    ended = true; view.cancelAnimationFrame(frame);
    resize.disconnect(); mutation.disconnect();
    view.removeEventListener('pointermove', move); view.removeEventListener('pointerup', up);
    view.removeEventListener('pointercancel', cancelPointer); view.removeEventListener('blur', cancel);
    view.removeEventListener('scroll', invalidate, true); view.removeEventListener('resize', invalidate);
    stage.removeEventListener('lostpointercapture', cancelPointer);
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    overlay.remove(); paintSelection(cancelled ? previous : chosen); commit(cancelled ? new Set(previous) : chosen);
  };
  const cancel = () => finish(true);
  const cancelPointer = (next: PointerEvent) => { if (next.pointerId === event.pointerId) cancel(); };
  const up = (next: PointerEvent) => { if (next.pointerId === event.pointerId) { point = { x: next.clientX, y: next.clientY }; finish(false); } };
  const resize = new ResizeObserver(invalidate); resize.observe(stage);
  const mutation = new MutationObserver(invalidate);
  // Content changes invalidate geometry; selection attributes and the overlay do not.
  const sheet = root.querySelector('.consistency-sheet');
  if (sheet) mutation.observe(sheet, { subtree: true, childList: true, characterData: true });
  view.addEventListener('pointermove', move); view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', cancelPointer); view.addEventListener('blur', cancel);
  view.addEventListener('scroll', invalidate, true); view.addEventListener('resize', invalidate);
  stage.addEventListener('lostpointercapture', cancelPointer);
  stage.setPointerCapture(event.pointerId); paintSelection(base); draw();
  return cancel;
}
