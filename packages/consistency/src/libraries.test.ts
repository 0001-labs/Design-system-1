// @vitest-environment happy-dom
import { expect, test } from 'vite-plus/test';
import { LIBRARY_PRESETS, applyLibraryTokens, libraryTokens } from './libraries';
import { LIBRARY_TOKENS } from '../../../DS1/1-root/library-tokens';
test('three local presets use DS1 library roles and keep default styling untouched', () => {
 expect(LIBRARY_PRESETS.map(preset => preset.id)).toEqual(['original', 'blue', 'ink']);
 expect(libraryTokens('original')).toEqual({});
 const supported = new Set(LIBRARY_TOKENS.map(([key]) => key));
 for (const preset of LIBRARY_PRESETS) for (const key of Object.keys(preset.tokens)) expect(supported.has(key as any), key).toBe(true);
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
