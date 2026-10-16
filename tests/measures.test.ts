import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vite-plus/test';
import { deviceScale, measures } from '../DS1/1-root/measures';
import { calculateScalingFactor, defaultScalingConfig } from '../DS1/0-face/scaling';

const css = (file: string) => readFileSync(new URL(`../DS1/1-root/${file}`, import.meta.url), 'utf8');
/** The value a stylesheet gives a custom property, as written. */
const declared = (file: string, name: string) => {
  const match = new RegExp(`^\\s*${name.replace(/[-]/g, '\\-')}:\\s*([^;]+);`, 'm').exec(css(file));
  if (!match) throw new Error(`${name} is not declared in ${file}`);
  return match[1].trim();
};
const px = (n: number) => `${n}px`;
/** `calc(Npx * var(--sf))`, the way one.css scales a length. */
const scaled = (n: number) => `calc(${px(n)} * var(--sf))`;
/** `calc(var(--ds-name, Npx) * var(--ds-sf, 1))`, the way component-metrics.css does. */
const metric = (fallback: string) => `calc(var(${fallback}) * var(--ds-sf, 1))`;

describe('Measures', () => {
  test('the square and half a square match grid.css and the component tokens', () => {
    expect(declared('grid.css', '--1')).toMatch(new RegExp(`^${px(measures.square)}\\b`));
    expect(declared('grid.css', '--05')).toBe('calc(var(--1) * 0.5)');
    expect(measures.half).toBe(measures.square / 2);
    expect(declared('component-tokens.css', '--ds-1')).toBe(px(measures.square));
    expect(declared('component-tokens.css', '--ds-08')).toBe('calc(var(--ds-1) * 0.8)');
    expect(measures.control).toBe(measures.square * 0.8);
  });

  test('one.css carries the same type, lines and items', () => {
    expect(declared('one.css', '--type-size-default')).toBe(scaled(measures.type.default));
    expect(declared('one.css', '--type-size-small')).toBe(scaled(measures.type.small));
    expect(declared('one.css', '--type-size-heading')).toBe(scaled(measures.type.heading));
    expect(declared('one.css', '--type-lineheight-default')).toBe(scaled(measures.leading));
    expect(declared('one.css', '--type-letterspacing-default')).toBe(scaled(measures.tracking));
    expect(declared('one.css', '--type-weight-default')).toBe(String(measures.weight.default));
    expect(declared('one.css', '--type-weight-bold')).toBe(String(measures.weight.bold));
    expect(declared('one.css', '--item-width')).toBe(scaled(measures.item.width));
    expect(declared('one.css', '--item-height')).toBe(scaled(measures.item.height));
    expect(declared('one.css', '--margin-correction')).toBe(scaled(measures.item.correction));
    expect(measures.item.height + measures.item.correction).toBe(measures.row);
  });

  test('component-metrics.css resolves the same defaults', () => {
    expect(declared('component-metrics.css', '--ds-control-height')).toBe(metric(`--ds-control-size, var(--ds-08, ${px(measures.control)})`));
    expect(declared('component-metrics.css', '--ds-row-height')).toBe(metric(`--ds-row-size, var(--ds-1, ${px(measures.row)})`));
    expect(declared('component-metrics.css', '--ds-type-size-default')).toBe(metric(`--ds-text-size, ${px(measures.type.default)}`));
    expect(declared('component-metrics.css', '--ds-type-size-small')).toBe(metric(`--ds-small-text-size, ${px(measures.type.small)}`));
    expect(declared('component-metrics.css', '--ds-type-size-heading')).toBe(metric(`--ds-heading-text-size, ${px(measures.type.heading)}`));
    expect(declared('component-metrics.css', '--ds-type-size-display')).toBe(metric(`--ds-display-text-size, ${px(measures.type.display)}`));
    expect(declared('component-metrics.css', '--ds-type-lineheight-default')).toBe(metric(`--ds-text-leading, ${px(measures.leading)}`));
    expect(declared('component-metrics.css', '--ds-type-letterspacing-default')).toBe(metric(`--ds-text-tracking, ${px(measures.tracking)}`));
    expect(declared('component-metrics.css', '--ds-radius')).toBe(metric(`--ds-corner-size, ${px(measures.radius)}`));
  });

  test('a display title tracks as text.css sets it', () => {
    expect(css('text.css')).toContain(`letter-spacing: calc(var(--ds-display-text-tracking, ${px(measures.displayTracking)}) * var(--ds-sf, 1));`);
  });

  test('the scale is the one scaling.ts computes', () => {
    expect(defaultScalingConfig.baseWidth).toBe(measures.scale.base);
    expect(defaultScalingConfig.minScale).toBe(measures.scale.min);
    expect(defaultScalingConfig.maxScale).toBe(measures.scale.max);
    for (const width of [200, 280, 375, 393, 402, 430, 744, 1024, 2000]) expect(deviceScale(width)).toBe(calculateScalingFactor(width));
  });
});
