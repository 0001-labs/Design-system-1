// @vitest-environment happy-dom
import { expect, it } from 'vite-plus/test';
import { editableSurface } from './surface-context';
it('routes static component menus while keeping Aa atoms and native text independent', () => {
 const root = document.createElement('div'); root.className = 'consistency-sheet';
 root.innerHTML = '<ds-card data-selectable="bookshop"><p>Words</p></ds-card><ds-stat data-selectable="stat"></ds-stat><ds-button data-selectable="action">Go</ds-button><aa-editor><p>Native text</p><span class="aa-atom"><ds-card data-selectable="atom"></ds-card></span></aa-editor>';
 expect(editableSurface(root.querySelector('ds-card p')!)).toBe(root.querySelector('ds-card'));
 expect(editableSurface(root.querySelector('ds-stat')!)).toBe(root.querySelector('ds-stat'));
 expect(editableSurface(root.querySelector('ds-button')!)).toBe(root.querySelector('ds-button'));
 expect(editableSurface(root.querySelector('aa-editor p')!)).toBeNull();
 expect(editableSurface(root.querySelector('.aa-atom ds-card')!)).toBeNull();
});
