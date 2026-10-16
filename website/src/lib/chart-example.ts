/** Also serialized as the example's copyable, self-contained JavaScript. */
export function mountChartExample(root: ParentNode): void {
  const values = [12, 15, 14, 18, 16, 21, 19, 17, 22, 20, 24, 23, 26, 24, 28, 27];
  const data = values.map((value, index) => ({ time: index * 60, value }));
  const status = root.querySelector('[data-chart-status]');
  const say = (text: string) => { if (status) status.textContent = text; };
  root.querySelectorAll<HTMLElement>('ds-chart').forEach(chart => {
    Object.assign(chart, { data, base: 18, markers: [{ time: 300, text: 'A' }], format: (value: number) => String(Math.round(value)) });
    chart.addEventListener('scrub', event => {
      const point = (event as CustomEvent).detail;
      say(point ? `Value ${point.value} at ${point.time} seconds` : chart.getAttribute('aria-label') ?? '');
    });
  });
  const spark = root.querySelector<HTMLElement>('ds-spark');
  if (spark) Object.assign(spark, { values });
  const bars = root.querySelector<HTMLElement>('ds-bars');
  if (bars) Object.assign(bars, { items: [{ label: 'A', value: 12, compare: 16 }, { label: 'B', value: 20, tone: 'up' }, { label: 'C', value: 15, tone: 'down' }, { label: 'D', value: 18 }, { label: 'E', value: 24, tone: 'up' }] });
  const ratio = root.querySelector<HTMLElement>('ds-ratio');
  if (ratio) Object.assign(ratio, { value: 0.65 });
  const range = root.querySelector<HTMLElement>('ds-range');
  if (range) Object.assign(range, { min: 0, max: 100, from: 20, to: 80, marks: [{ value: 50, kind: 'dot' }] });

  // The cycle names the chart on show. It moves on by itself every few
  // seconds until the reader clicks it, waits while the stage is pointed at
  // or focused, and stays put when reduced motion is asked for.
  const stage = root.querySelector<HTMLElement>('[data-chart-stage]');
  const cycle = root.querySelector<HTMLElement & { values: string[]; value: string }>('ds-cycle');
  const count = root.querySelector('[data-chart-count]');
  if (!stage || !cycle) return;
  const views = [...stage.querySelectorAll<HTMLElement>('[data-chart-view]')];
  const show = (name: string) => {
    views.forEach((view, index) => {
      const current = view.dataset.chartView === name;
      view.hidden = !current;
      if (!current) return;
      if (count) count.textContent = `${index + 1} of ${views.length}`;
      const chart = view.querySelector<HTMLElement & { drawKey: string }>('ds-chart');
      if (chart) requestAnimationFrame(() => { chart.drawKey = String(Date.now()); });
      say(view.firstElementChild?.getAttribute('aria-label') ?? '');
    });
  };
  let taken = false;
  let paused = false;
  cycle.addEventListener('change', event => { taken = true; show((event as CustomEvent).detail.value); });
  stage.addEventListener('pointerenter', () => { paused = true; });
  stage.addEventListener('pointerleave', () => { paused = stage.contains(document.activeElement); });
  stage.addEventListener('focusin', () => { paused = true; });
  stage.addEventListener('focusout', () => { paused = stage.matches(':hover'); });
  show(cycle.value || cycle.values[0]);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const timer = setInterval(() => {
    if (!stage.isConnected) return clearInterval(timer);
    if (taken || paused) return;
    const next = cycle.values[(cycle.values.indexOf(cycle.value || cycle.values[0]) + 1) % cycle.values.length];
    cycle.value = next;
    show(next);
  }, 3000);
}
