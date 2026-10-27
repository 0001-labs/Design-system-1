/** Passive hover tools may never take ownership from a pointer gesture. */
export class PointerActivity {
  private pointers = new Set<number>();
  private view: Window;
  constructor(private root: HTMLElement) {
    this.view = root.ownerDocument.defaultView!;
    this.view.addEventListener('pointerdown', this.down, true);
    this.view.addEventListener('pointerup', this.up, true);
    this.view.addEventListener('pointercancel', this.up, true);
    this.view.addEventListener('pointermove', this.move, true);
    this.view.addEventListener('blur', this.clear);
  }
  private down = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || !event.composedPath().includes(this.root)) return;
    // Pressing an existing toolbar is deliberate context interaction, not a canvas gesture.
    if (event.composedPath().some(node => (node as Element).nodeType === 1 && (node as Element).matches('.consistency-button-action,.consistency-carousel-tools,.aa-controls,.aa-menu,ds-context'))) { this.clear(); return; }
    this.pointers.add(event.pointerId);
    this.root.setAttribute('data-pointer-busy', '');
    this.root.toggleAttribute('data-pointer-additive', event.shiftKey);
  };
  private up = (event: PointerEvent) => { this.pointers.delete(event.pointerId); this.root.removeAttribute('data-pointer-additive'); };
  private move = (event: PointerEvent) => {
    // Releasing capture can synthesize pointerenter. Require a fresh idle movement.
    if (!this.pointers.size && !event.buttons) this.clear();
  };
  private clear = () => { this.pointers.clear(); this.root.removeAttribute('data-pointer-busy'); this.root.removeAttribute('data-pointer-additive'); };
  destroy() {
    this.view.removeEventListener('pointerdown', this.down, true);
    this.view.removeEventListener('pointerup', this.up, true);
    this.view.removeEventListener('pointercancel', this.up, true);
    this.view.removeEventListener('pointermove', this.move, true);
    this.view.removeEventListener('blur', this.clear); this.clear();
  }
}
