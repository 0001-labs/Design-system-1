import { describe, expect, it } from 'vite-plus/test';
import { bezier, FLICK, settleTarget } from './sidebar-edge';

describe('the sidebar edge', () => {
  it('settles to the nearer side when released slowly', () => {
    expect(settleTarget(200, 280, 0)).toBe('open');
    expect(settleTarget(140, 280, 0)).toBe('open');
    expect(settleTarget(139, 280, 0.1)).toBe('collapsed');
  });
  it('follows a flick, wherever the edge is', () => {
    expect(settleTarget(260, 280, -FLICK)).toBe('collapsed');
    expect(settleTarget(20, 280, FLICK)).toBe('open');
  });
  it('eases on the drawer curve from rest to rest', () => {
    const ease = bezier([0.32, 0.72, 0, 1]);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(0.5)).toBeGreaterThan(0.85);
    for (let t = 0.05; t < 1; t += 0.05) expect(ease(t)).toBeGreaterThan(ease(t - 0.05));
  });
});
