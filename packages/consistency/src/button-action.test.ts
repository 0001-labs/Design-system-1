// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vite-plus/test';
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });
import { createButtonActionControls } from './button-action';
afterEach(() => document.body.replaceChildren());

it('shares native action choices and validates a destination before committing', () => {
  const change=vi.fn(),controls=createButtonActionControls(document,undefined,()=>true,change);
  document.body.append(controls.element);
  const choice=controls.element.querySelector('select')!,target=controls.element.querySelector('ds-input')!;
  expect([...choice.options].map(option=>option.textContent)).toEqual(['No action','Open a link','Open a page']);
  expect(target.hidden).toBe(true);expect(controls.element.classList.contains('consistency-button-action')).toBe(false);
  choice.value='page';choice.dispatchEvent(new Event('change'));expect(target.placeholder).toBe('/about');expect(change).not.toHaveBeenCalled();
  target.value='javascript:bad';target.dispatchEvent(new Event('change'));expect(target.getAttribute('aria-invalid')).toBe('true');expect(change).not.toHaveBeenCalled();
  target.value=' /about ';target.dispatchEvent(new Event('change'));expect(change).toHaveBeenLastCalledWith({kind:'page',target:'/about'});
  choice.value='none';choice.dispatchEvent(new Event('change'));expect(change).toHaveBeenLastCalledWith(undefined);expect(target.hidden).toBe(true);
  controls.dispose();
});

it('respects read-only transitions and disposes change listeners', () => {
  let writable=false;const change=vi.fn(),controls=createButtonActionControls(document,{kind:'link',target:'https://example.com'},()=>writable,change);
  document.body.append(controls.element);const target=controls.element.querySelector('ds-input')!;
  target.value='https://example.org';target.dispatchEvent(new Event('change'));expect(change).not.toHaveBeenCalled();
  writable=true;target.dispatchEvent(new Event('change'));expect(change).toHaveBeenCalledOnce();
  controls.dispose();target.value='https://example.net';target.dispatchEvent(new Event('change'));expect(change).toHaveBeenCalledOnce();
});

