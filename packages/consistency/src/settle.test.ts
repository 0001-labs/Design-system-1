// @vitest-environment happy-dom
import { expect, test, vi } from 'vite-plus/test';
import { CompositionSettle } from './settle';
test('release uses translation only and reduced motion applies layout immediately', async () => {
 const el = document.createElement('div'); document.body.append(el);
 let left = 0;
 el.getBoundingClientRect = () => ({ left, top: 0 }) as DOMRect;
 el.animate = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);
 const settle = new CompositionSettle();
 await settle.run([el], async () => { left = 8; }, false);
 expect(el.animate).toHaveBeenCalledWith([
  { transform: expect.stringContaining('translate(-8px, 0px)') },
  { transform: expect.stringContaining('translate(0px, 0px)') },
 ], { duration: 180, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
 vi.mocked(el.animate).mockClear();
 await settle.run([el], async () => { left = 20; }, true);
 expect(left).toBe(20); expect(el.animate).not.toHaveBeenCalled();
});
test('new interaction cancels a pending settlement before animation begins', async () => {
 const el = document.createElement('div'); el.animate = vi.fn();
 const settle = new CompositionSettle(); let release!: () => void;
 const done = settle.run([el], () => new Promise<void>(resolve => { release = resolve; }), false);
 settle.cancel(); release(); await done;
 expect(el.animate).not.toHaveBeenCalled();
});
