/** Pointer release only: translate the final layout into place without scaling text. */
export class CompositionSettle {
  private animations: Animation[] = [];
  private generation = 0;
  cancel() { this.generation++; this.animations.forEach(animation => animation.cancel()); this.animations = []; }
  async run(elements: HTMLElement[], update: () => Promise<unknown>, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const before = elements.map(element => element.getBoundingClientRect());
    this.cancel();
    const generation = this.generation;
    await update();
    if (generation !== this.generation || reduce) return;
    elements.forEach((element, index) => {
      const after = element.getBoundingClientRect();
      const x = before[index].left - after.left, y = before[index].top - after.top;
      if ((!x && !y) || !element.animate) return;
      const base = getComputedStyle(element).transform;
      const rest = base === 'none' ? '' : base;
      this.animations.push(element.animate([
        { transform: `translate(${x}px, ${y}px) ${rest}` },
        { transform: `translate(0px, 0px) ${rest}` },
      ], { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }));
    });
  }
}
