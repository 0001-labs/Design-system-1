// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { expect, test, vi } from 'vite-plus/test';
vi.mock('../../../website/public/examples/libraries/voyage.css?raw', () => ({ default: readFileSync('website/public/examples/libraries/voyage.css', 'utf8') }));
import { LIBRARY_PRESETS, applyLibraryTokens, libraryTokens } from './libraries';
import { LIBRARY_TOKENS } from '../../../DS1/1-root/library-tokens';
test('the original booking library and six distinct local presets use DS1 library roles and keep default styling untouched', () => {
 expect(LIBRARY_PRESETS.map(preset => preset.id)).toEqual(['original', 'voyage', 'blue', 'ink', 'soft', 'bold', 'editorial']);
 expect(libraryTokens('original')).toEqual({});
 const supported = new Set(LIBRARY_TOKENS.map(([key]) => key));
 for (const preset of LIBRARY_PRESETS.filter(preset => preset.id !== 'voyage')) for (const key of Object.keys(preset.tokens)) expect(supported.has(key as any), key).toBe(true);
 expect(libraryTokens('blue')['--ds-button-background-color-primary']).toBe('var(--ds-sharp-blue)');
 expect(libraryTokens('ink')['--ds-button-background-color-primary']).toBe('var(--ds-yellow)');
});
test('composition and slash previews receive the same roles, and returning to Original clears them', () => {
 const composition = document.createElement('div'), preview = document.createElement('div');
 applyLibraryTokens(composition, 'ink'); applyLibraryTokens(preview, composition.dataset.consistencyLibrary!);
 expect(preview.style.cssText).toBe(composition.style.cssText); expect(preview.style.colorScheme).toBe('dark');
 applyLibraryTokens(preview, 'original'); expect(preview.style.cssText).toBe('');
 expect(preview.dataset.consistencyLibrary).toBe('original');
});

test('Bold uses DS1 two-square controls while Soft and Editorial change corners and type', () => {
 expect(libraryTokens('bold')['--ds-control-size']).toBe('40px');
 expect(libraryTokens('bold')['--ds-button-inset']).toBe('20px');
 expect(libraryTokens('soft')['--ds-card-corner-size']).toBe('20px');
 expect(libraryTokens('editorial')['--ds-typeface-regular']).toBe('var(--typeface-canon)');
 const preview = document.createElement('div'); applyLibraryTokens(preview, 'bold');
 expect(preview.style.getPropertyValue('--ds-control-size')).toBe('40px');
 applyLibraryTokens(preview, 'original'); expect(preview.style.getPropertyValue('--ds-control-size')).toBe('');
});

test('Voyage reads the actual booking library, including its blue band and yellow search frame', () => {
 expect(libraryTokens('voyage')['--brand-band']).toContain('#0b3a8c');
 expect(libraryTokens('voyage')['--brand-highlight']).toContain('#fdbb2d');
 expect(libraryTokens('voyage')['--ds-card-corner-size']).toBe('8px');
});
