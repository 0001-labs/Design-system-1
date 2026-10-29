// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import "../DS1/3-unit/ds-calendar";
import type { Calendar } from "../DS1/3-unit/ds-calendar";
let reduced = false;
async function fixture() {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("reduced-motion") ? reduced : true }));
  document.body.innerHTML = '<ds-calendar compact selectable fixed week-start="monday" month="2026-12" value="2026-12-15/2026-12-18"></ds-calendar>';
  const calendar = document.querySelector("ds-calendar") as Calendar;
  await calendar.updateComplete;
  const track = calendar.shadowRoot!.querySelector<HTMLElement>(".month-track")!;
  vi.spyOn(track, "getBoundingClientRect").mockReturnValue({ width: 140 } as DOMRect);
  const grid = calendar.shadowRoot!.querySelector<HTMLElement>(".grid")!;
  const pointer = (name: string, x: number, y = 50) => {
    const event = new PointerEvent(name, { pointerId: 1, pointerType: "touch", isPrimary: true, clientX: x, clientY: y, bubbles: true, composed: true, cancelable: true });
    grid.dispatchEvent(event);
    return event;
  };
  return { calendar, track, grid, pointer };
}
afterEach(() => { document.body.replaceChildren(); reduced = false; vi.useRealTimers(); vi.unstubAllGlobals(); });
const finish = async (calendar: Calendar) => { await vi.advanceTimersByTimeAsync(200); await calendar.updateComplete; };

test("mobile drag reveals adjacent months, commits across a year, and retains selection and Monday headers", async () => {
  const { calendar, track, pointer } = await fixture(); vi.useFakeTimers();
  pointer("pointerdown", 120); expect(pointer("pointermove", 60).defaultPrevented).toBe(true);
  await vi.advanceTimersByTimeAsync(20);
  expect(track.style.transform).toBe("translateX(-60px)");
  const next = calendar.shadowRoot!.querySelector('.month-neighbour.next ds-calendar') as Calendar;
  expect(next.month).toBe("2027-01-01"); expect(next.weekStart).toBe("monday");
  expect(next.parentElement!.hasAttribute("inert")).toBe(true);
  pointer("pointerup", 60); await finish(calendar);
  expect(calendar.month).toBe("2027-01"); expect(track.style.transform).toBe("translateX(0px)");
  pointer("pointerdown", 30); pointer("pointermove", 100); pointer("pointerup", 100); await finish(calendar);
  expect(calendar.month).toBe("2026-12");
  expect(calendar.value).toBe("2026-12-15/2026-12-18");
  await vi.advanceTimersByTimeAsync(450);
  calendar.shadowRoot!.querySelector<HTMLElement>('[data-day="2026-12-20"]')!.click(); await calendar.updateComplete;
  expect(calendar.value).toContain("2026-12-20");
});

test("partial cancel and vertical movement leave month and selection alone; resize resets a held gesture", async () => {
  const { calendar, track, pointer } = await fixture(); vi.useFakeTimers();
  pointer("pointerdown", 100); pointer("pointermove", 70); pointer("pointercancel", 70); await finish(calendar);
  expect(calendar.month).toBe("2026-12"); expect(track.style.transform).toBe("translateX(0px)");
  pointer("pointerdown", 100); expect(pointer("pointermove", 95, 100).defaultPrevented).toBe(false); pointer("pointerup", 95, 100); await finish(calendar);
  expect(calendar.month).toBe("2026-12");
  pointer("pointerdown", 100); pointer("pointermove", 50); window.dispatchEvent(new Event("resize")); pointer("pointerup", 50); await finish(calendar);
  expect(calendar.month).toBe("2026-12"); expect(track.style.transform).toBe("translateX(0px)");
  expect(calendar.value).toBe("2026-12-15/2026-12-18");
});

test("bounds refuse forward movement and reduced motion changes month without translation", async () => {
  const { calendar, track, pointer } = await fixture(); vi.useFakeTimers();
  calendar.max = "2026-12-31"; await calendar.updateComplete;
  pointer("pointerdown", 100); pointer("pointermove", 30); pointer("pointerup", 30); await finish(calendar);
  expect(calendar.month).toBe("2026-12");
  reduced = true;
  pointer("pointerdown", 30); pointer("pointermove", 110); await vi.advanceTimersByTimeAsync(20);
  expect(track.style.transform).toBe("translateX(0px)");
  pointer("pointerup", 110); await finish(calendar);
  expect(calendar.month).toBe("2026-11");
  expect(track.style.transition).toBe("none");
});

for (const view of ['month', 'swimlane', 'earnings']) for (const mobile of [false, true]) {
  test(`${view} reveals the next page throughout a ${mobile ? 'phone' : 'desktop'} drag`, async () => {
    const { calendar } = await fixture();
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduced-motion') ? false : mobile }));
    calendar.compact = false; calendar.views = ['month', 'swimlane', 'earnings']; calendar.view = view;
    calendar.innerHTML = '<div slot="earnings">December</div><div slot="earnings-previous">November</div><div slot="earnings-next">January</div>';
    await calendar.updateComplete;
    const track = calendar.shadowRoot!.querySelector<HTMLElement>('.month-track');
    expect(track).not.toBeNull();
    vi.spyOn(track!, 'getBoundingClientRect').mockReturnValue({ width: 560 } as DOMRect);
    vi.useFakeTimers();
    const pointer = (name: string, x: number) => track!.dispatchEvent(new PointerEvent(name, { pointerId: 1, pointerType: mobile ? 'touch' : 'mouse', isPrimary: true, button: 0, clientX: x, clientY: 50, bubbles: true, composed: true, cancelable: true }));
    pointer('pointerdown', 300); pointer('pointermove', 200);
    await vi.advanceTimersByTimeAsync(20);
    expect(track!.style.transform).toBe('translateX(-100px)');
    if (view === 'earnings') expect(track!.querySelector('.month-neighbour.next slot')?.getAttribute('name')).toBe('earnings-next');
    else expect((track!.querySelector('.month-neighbour.next ds-calendar') as Calendar).shownView).toBe(view);
    pointer('pointerup', 200); await finish(calendar);
    expect(calendar.month).toBe('2027-01');
    expect(track!.style.transform).toBe('translateX(0px)');
  });
}

test('a desktop trackpad reveals the next page before committing, without taking vertical scrolling', async () => {
  const { calendar } = await fixture(); calendar.compact = false; await calendar.updateComplete;
  const surface = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar')!;
  const track = calendar.shadowRoot!.querySelector<HTMLElement>('.month-track'); expect(track).not.toBeNull();
  vi.spyOn(track!, 'getBoundingClientRect').mockReturnValue({ width: 560 } as DOMRect);
  vi.useFakeTimers();
  const wheel = (x: number, y = 0) => { const event = new WheelEvent('wheel', { deltaX: x, deltaY: y, bubbles: true, cancelable: true }); surface.dispatchEvent(event); return event; };
  expect(wheel(0, 80).defaultPrevented).toBe(false);
  expect(wheel(30).defaultPrevented).toBe(true); await vi.advanceTimersByTimeAsync(20);
  expect(track!.style.transform).toBe('translateX(-30px)'); expect(calendar.month).toBe('2026-12');
  wheel(40); await vi.advanceTimersByTimeAsync(350); await calendar.updateComplete;
  expect(calendar.month).toBe('2027-01'); expect(track!.style.transform).toBe('translateX(0px)');
});
