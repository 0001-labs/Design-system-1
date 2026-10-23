/** Temporary interaction mode; never writes the user's saved layer preferences. */
export class ContextActivity {
  private observer: MutationObserver;
  private queued = false;
  private destroyed = false;
  private current = false;
  constructor(private root: HTMLElement, private changed: (active: boolean) => void) {
    this.observer = new MutationObserver(this.schedule);
    this.observer.observe(root.ownerDocument.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'open', 'data-open', 'aria-hidden', 'data-tools-dismissed', 'data-pointer-busy'] });
    for (const name of ['focusin', 'focusout', 'pointerover', 'pointerout']) root.ownerDocument.addEventListener(name, this.schedule, true);
    this.refresh();
  }
  private schedule = () => {
    if (this.queued) return;
    this.queued = true;
    queueMicrotask(() => { this.queued = false; this.refresh(); });
  };
  refresh() {
    if (this.destroyed) return;
    const visible = (node: HTMLElement) => !node.hidden && node.getAttribute('aria-hidden') !== 'true' && getComputedStyle(node).display !== 'none' && getComputedStyle(node).visibility !== 'hidden';
    const menus = this.root.ownerDocument.querySelectorAll<HTMLElement>('.aa-controls:not([hidden]),.aa-menu:not([hidden]),.aa-sheet[open],ds-context[data-consistency-context][open]');
    const passiveHover = !this.root.hasAttribute('data-pointer-busy');
    const active = Array.from(menus).some(visible) || !!this.root.querySelector(passiveHover ? '.consistency-button-action[data-open]' : '.consistency-button-action[data-open]:is(:focus-within,[data-keyboard])') || Array.from(this.root.querySelectorAll<HTMLElement>('.consistency-carousel-tools')).some(node => visible(node) && (passiveHover && node.matches(':hover') || node.matches(':focus-within')));
    if (active !== this.current) { this.current = active; this.changed(active); }
  }
  destroy() {
    this.destroyed = true;
    this.observer.disconnect();
    for (const name of ['focusin', 'focusout', 'pointerover', 'pointerout']) this.root.ownerDocument.removeEventListener(name, this.schedule, true);
  }
}
