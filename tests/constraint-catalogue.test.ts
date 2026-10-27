import { expect, it } from 'vite-plus/test';
import { constraints } from '../DS1/0-face/constraints';
import { CONSTRAINT_CATALOGUE, FOUNDATION_CONSTRAINTS, exampleScore } from '../shared/constraint-catalogue';
it('gives every canonical constraint a unique permanent ID and readable tag', () => {
  expect(CONSTRAINT_CATALOGUE.map(rule => rule.code)).toEqual(constraints.map(rule => rule.code));
  const all = [...CONSTRAINT_CATALOGUE, ...FOUNDATION_CONSTRAINTS];
  expect(new Set(all.map(rule => rule.id)).size).toBe(all.length);
  for (const rule of all) { expect(rule.id).toMatch(/^[CF]\d{3}$/); expect(rule.tag).toBeTruthy(); expect(rule.rule).toBeTruthy(); }
  expect(CONSTRAINT_CATALOGUE.find(rule => rule.code === 'color.text-contrast')?.id).toBe('C004');
});
it('never counts absent or visually unmeasurable rules as passed checks', () => {
  const checks = (['pass', 'fail', 'review', 'absent'] as const).map(status => ({ code: 'rule', width: 320, theme: 'light', measured: 1, status, findings: [] }));
  expect(exampleScore({ id: 'shop', checks, errors: [] })).toEqual({ passed: 1, total: 3, failed: 1, review: 1 });
  expect(exampleScore({ id: 'shop', checks: [], errors: ['Page did not load'] })).toEqual({ passed: 0, total: 0, failed: 0, review: 0 });
});

it('keeps the permanent Fault lines identity', () => {
  expect(CONSTRAINT_CATALOGUE.find(rule => rule.code === 'page.fault-lines')).toMatchObject({id: 'C009', tag: 'Fault lines'});
});
