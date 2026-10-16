/** Also serialized as the example's copyable, self-contained JavaScript. */
export function mountChartExample(root: ParentNode): void {
  const data = [12, 16, 14, 20, 18, 24, 19, 26].map((value, index) => ({ time: index * 60, value }));
  root.querySelectorAll<HTMLElement>('ds-chart').forEach(chart => {
    Object.assign(chart, { data, base: 18, markers: [{ time: 180, text: 'A' }], format: (value: number) => String(Math.round(value)) });
    chart.addEventListener('scrub', event => {
      const point = (event as CustomEvent).detail;
      const output = root.querySelector('output');
      if (output) output.textContent = point ? `Value ${point.value} at ${point.time} seconds` : 'Move over a chart to inspect a value.';
    });
  });
  const spark = root.querySelector<HTMLElement>('ds-spark');
  if (spark) Object.assign(spark, { values: data.map(point => point.value) });
  const bars = root.querySelector<HTMLElement>('ds-bars');
  if (bars) Object.assign(bars, { items: [{ label: 'A', value: 12, compare: 16 }, { label: 'B', value: 20, tone: 'up' }, { label: 'C', value: 15, tone: 'down' }] });
  const ratio = root.querySelector<HTMLElement>('ds-ratio');
  if (ratio) Object.assign(ratio, { value: 0.65 });
  const range = root.querySelector<HTMLElement>('ds-range');
  if (range) Object.assign(range, { min: 0, max: 100, from: 20, to: 80, marks: [{ value: 50, kind: 'dot' }] });
}
