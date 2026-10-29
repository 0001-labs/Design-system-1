// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
import '../DS1/3-unit/ds-calendar';
import type { Calendar, CalendarEvent } from '../DS1/3-unit/ds-calendar';
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
afterEach(() => { document.body.replaceChildren(); });
async function fixture(events: CalendarEvent[], view = 'month') {
  const calendar = document.createElement('ds-calendar') as Calendar;
  calendar.month = '2026-10'; calendar.weekStart = 'monday'; calendar.fixed = true;
  calendar.outsideDays = true; calendar.lines = 3; calendar.events = events; calendar.view = view;
  document.body.append(calendar); await calendar.updateComplete; return calendar;
}
const shape = (node: Element) => ['top-start', 'top-end', 'bottom-start', 'bottom-end'].map(corner => node.hasAttribute(`data-round-${corner}`));
const event = (calendar: Calendar, day: string, name: string) => [...calendar.shadowRoot!.querySelectorAll(`[data-day="${day}"] .event`)].find(node => node.textContent === name)!;

test('an isolated event rounds its four exposed corners', async () => {
  const calendar = await fixture([{ title: 'Alone', start: '2026-10-05', end: '2026-10-07' }]);
  expect(shape(event(calendar, '2026-10-05', 'Alone'))).toEqual([true, true, true, true]);
});
test('side-by-side events keep their touching ends square', async () => {
  const calendar = await fixture([{ title: 'A', start: '2026-10-05' }, { title: 'B', start: '2026-10-06' }]);
  expect(shape(event(calendar, '2026-10-05', 'A'))).toEqual([true, false, true, false]);
  expect(shape(event(calendar, '2026-10-06', 'B'))).toEqual([false, true, false, true]);
});
test('a stack rounds only the silhouette, keeping its shared seam square', async () => {
  const calendar = await fixture([{ title: 'A', start: '2026-10-05', end: '2026-10-07' }, { title: 'B', start: '2026-10-05', end: '2026-10-07' }]);
  expect(shape(event(calendar, '2026-10-05', 'A'))).toEqual([true, true, false, false]);
  expect(shape(event(calendar, '2026-10-05', 'B'))).toEqual([false, false, true, true]);
});
test('staggered stacks round exposed ends independently', async () => {
  const calendar = await fixture([{ title: 'A', start: '2026-10-05', end: '2026-10-07' }, { title: 'B', start: '2026-10-06', end: '2026-10-08' }]);
  expect(shape(event(calendar, '2026-10-05', 'A'))).toEqual([true, true, true, false]);
  expect(shape(event(calendar, '2026-10-06', 'B'))).toEqual([false, true, true, true]);
});
test('week continuations stay square while the actual start and end round', async () => {
  const calendar = await fixture([{ title: 'Across weeks', start: '2026-10-09', end: '2026-10-13' }]);
  expect(shape(event(calendar, '2026-10-09', 'Across weeks'))).toEqual([true, false, true, false]);
  expect(shape(event(calendar, '2026-10-12', 'Across weeks'))).toEqual([false, true, false, true]);
});
test('Swimlane uses the same exposed-corner rule for stacked bars', async () => {
  const calendar = await fixture([{ title: 'A', start: '2026-10-05', end: '2026-10-18' }, { title: 'B', start: '2026-10-05', end: '2026-10-18' }], 'swimlane');
  const bars = [...calendar.shadowRoot!.querySelectorAll('.swimlane .event')];
  expect(shape(bars[0])).toEqual([true, true, false, false]);
  expect(shape(bars[1])).toEqual([false, false, true, true]);
});
