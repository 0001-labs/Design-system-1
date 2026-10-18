import { describe, expect, test } from 'vite-plus/test';
import codes from '../shared/component-codes.json';
import { ALL_LAYERS } from '../shared/component-directory';
describe('component glossary', () => {
  test('preserves unique compact codes for every directory entry', () => {
    expect(new Set(codes.map(entry => entry.code)).size).toBe(codes.length);
    expect(codes.every(entry => /^[A-Z0-9]{1,4}$/.test(entry.code))).toBe(true);
    for (const entry of ALL_LAYERS.flatMap(layer => layer.entries)) {
      expect(codes.some(code => code.url === `https://designsystem1.com${entry.href}`), entry.name).toBe(true);
    }
  });
});
