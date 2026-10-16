// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import { GridChart, GridLineChart, GridRatio } from '../DS1/2-core/ds-chart';
let context: CanvasRenderingContext2D;
beforeEach(() => {
  context = { setTransform: vi.fn(), clearRect: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(), measureText: () => ({width: 20}) } as unknown as CanvasRenderingContext2D;
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({width: 240, height: 160, left: 0, top: 0} as DOMRect);
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
test('series, visible range and crosshair subscriptions preserve source data', () => {
  const canvas = document.createElement('canvas'); document.body.append(canvas);
  const chart = new GridChart(canvas, {grid: 'none'});
  chart.resize(240, 160);
  const series = chart.addSeries({kind: 'baseline', baseValue: 5});
  series.setData([{time: 0, value: 1}, {time: 10, value: 9}]);
  series.setMarkers([{time: 10, text: 'A'}]);
  const listener = vi.fn(); chart.subscribeCrosshairMove(listener);
  chart.setCrosshair(239);
  expect(listener.mock.calls[0][0].point).toEqual({time: 10, value: 9});
  chart.setTimeRange([0, 20]); chart.setCrosshair(239);
  expect(listener.mock.calls[1][0].point).toBeNull();
  series.update({time: 10, value: 7}); expect(series.data).toHaveLength(2);
  chart.unsubscribeCrosshairMove(listener); chart.setCrosshair(null);
  expect(listener).toHaveBeenCalledTimes(2);
  chart.resize(10, 160); chart.applyOptions({scaleLabels: true});
  expect(() => chart.draw()).not.toThrow();
  chart.destroy();
});
test('independent units and grid modes survive detach and reconnect', async () => {
  const first = document.createElement('ds-chart') as GridLineChart;
  const second = document.createElement('ds-chart') as GridLineChart;
  first.unit = 30; first.grid = 'none'; second.unit = 20;
  first.data = second.data = [{time: 0, value: 1}, {time: 1, value: 2}];
  document.body.append(first, second);
  await first.updateComplete; await second.updateComplete;
  expect(first.shadowRoot!.querySelector('canvas')!.style.height).toBe('240px');
  expect(second.shadowRoot!.querySelector('canvas')!.style.height).toBe('160px');
  first.remove(); document.body.append(first); await first.updateComplete;
  first.unit = 25; await first.updateComplete;
  expect(first.shadowRoot!.querySelector('canvas')!.style.height).toBe('200px');
  expect(second.unit).toBe(20);
});
test('ratio clips out of range values instead of producing negative widths', async () => {
  const ratio = document.createElement('ds-ratio') as GridRatio;
  ratio.value = -5; document.body.append(ratio); await ratio.updateComplete;
  expect((ratio.shadowRoot!.querySelector('.ratio-buy') as HTMLElement).style.width).toBe('0px');
});
