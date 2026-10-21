// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vite-plus/test';
vi.mock('../../../../DS1/0-face/i18n', () => ({ getText: (value: string) => value, translate: (value: string) => value, currentLanguage: { value: 'en', subscribe: () => () => {} } }));
import { isApplePlatform } from '../../../../DS1/0-face/keys';
import { SOURCE_CHARACTERS, validateSource } from '../../../../shared/font-source';
import './Workbench';
import type { FontWorkbench } from './Workbench';

// Resolve the fixture from this file so root and app test runs use the same face.
const america = readFileSync(resolve(__dirname, '../../../../DS1/1-root/fonts/GT-America-Standard-Regular.woff2'));
type Props = { face: { id: string; name: string }; request: FontWorkbench['request']; onMessage: Mock<(value: string) => void>; onError: Mock<(value: string) => void>; onBuildSaved: Mock<(value: string) => void>; onDirtyChange: Mock<(value: boolean) => void> };
let host: HTMLDivElement;
let request: ReturnType<typeof vi.fn>;
let props: Props;
const settle = async () => { for (let tick = 0; tick < 4; tick++) await new Promise(resolve => setTimeout(resolve, 5)); };
/** Waits for the element's updates after a change made outside it. */
const act = async (run: () => unknown) => { await run(); await settle(); };
/** The workbench as the font workspace puts it in: its face and request in, its events out. */
async function render(hidden = false) {
  const element = document.createElement('ds1-font-workbench') as FontWorkbench;
  element.face = props.face;
  element.request = props.request;
  element.hidden = hidden;
  element.addEventListener('workbench-message', event => props.onMessage((event as CustomEvent).detail));
  element.addEventListener('workbench-error', event => props.onError((event as CustomEvent).detail));
  element.addEventListener('build-saved', event => props.onBuildSaved((event as CustomEvent).detail));
  element.addEventListener('dirty-change', event => props.onDirtyChange((event as CustomEvent).detail));
  host.append(element);
  await settle();
}
const button = (label: string) => [...host.querySelectorAll<HTMLButtonElement>('button')].find(element => element.textContent === label)!;
const outline = () => host.querySelector('.workbench-outline')!.getAttribute('d');
const points = () => host.querySelectorAll('.workbench-canvas [data-point]');
const press = (key: string, modifiers: { shift?: boolean; mod?: boolean } = {}) => act(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, shiftKey: Boolean(modifiers.shift), metaKey: Boolean(modifiers.mod && isApplePlatform()), ctrlKey: Boolean(modifiers.mod && !isApplePlatform()) }));
});

beforeEach(() => {
  vi.stubGlobal('FontFace', class { family: string; constructor(family: string) { this.family = family; } async load() { return this; } });
  Object.defineProperty(document, 'fonts', { configurable: true, value: new Set() });
  request = vi.fn(async (path: string, init: RequestInit = {}) => {
    if (path === '/api/fonts/0001-sans/source' && !init.method) throw Object.assign(new Error('Nothing has been drawn yet.'), { status: 404 });
    if (path === '/api/fonts/file/america') return new Response(new Uint8Array(america));
    return Response.json({ saved: true });
  });
  props = { face: { id: '0001-sans', name: '0001 Sans' }, request: request as unknown as FontWorkbench['request'], onMessage: vi.fn(), onError: vi.fn(), onBuildSaved: vi.fn(), onDirtyChange: vi.fn() };
  host = document.createElement('div'); document.body.append(host);
});
afterEach(() => { host.remove(); vi.unstubAllGlobals(); });

describe('font workbench', () => {
  it('starts an empty drawing on the face’s characters, with the reference face behind the glyph', async () => {
    await render();
    expect(props.onError).not.toHaveBeenCalled();
    const cells = host.querySelectorAll('.workbench-glyph');
    expect(cells).toHaveLength(SOURCE_CHARACTERS.length);
    expect(host.querySelector('.workbench-glyph[aria-pressed="true"]')!.getAttribute('aria-label')).toBe('H, U+0048, not drawn');
    expect(host.querySelector('.workbench-reference')!.getAttribute('d')).toMatch(/^M/);
    expect(host.textContent).toContain('GT America 718');
    expect(points()).toHaveLength(0);
    expect(button('Save drawing').disabled).toBe(true);
  });
  it('adds shapes, moves points by keys and by dragging, deletes them and undoes each step', async () => {
    await render();
    await act(() => button('Rectangle').click());
    expect(outline()).toBe('M255 0L345 0L345 710L255 710Z');
    expect(host.querySelectorAll('.workbench-canvas [data-selected]')).toHaveLength(4);
    await press('ArrowRight', { shift: true });
    expect(outline()).toBe('M265 0L355 0L355 710L265 710Z');
    await press('ArrowUp');
    expect(outline()).toBe('M265 1L355 1L355 711L265 711Z');
    await press('z', { mod: true });
    await press('z', { mod: true });
    expect(outline()).toBe('M255 0L345 0L345 710L255 710Z');
    await press('z', { mod: true, shift: true });
    expect(outline()).toBe('M265 0L355 0L355 710L265 710Z');
    // Drag one corner: a click chooses it alone, and the drag moves it in whole units (0.4 pixels a unit here).
    const corner = host.querySelector<SVGElement>('[data-point="0:0"]')!;
    const canvas = host.querySelector<SVGSVGElement>('.workbench-canvas')!;
    await act(() => { corner.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: 100, clientY: 100, pointerId: 1 })); });
    expect(host.querySelectorAll('.workbench-canvas [data-selected]')).toHaveLength(1);
    await act(() => { canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: 110, clientY: 100, pointerId: 1 })); });
    await act(() => { canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: 110, clientY: 100, pointerId: 1 })); });
    expect(outline()).toBe('M290 0L355 0L355 710L265 710Z');
    await act(() => button('Delete').click());
    expect(outline()).toBe('M355 0L355 710L265 710Z');
    await press('a', { mod: true });
    await press('Backspace');
    expect(outline()).toBe('');
    await press('z', { mod: true });
    await press('z', { mod: true });
    expect(outline()).toBe('M290 0L355 0L355 710L265 710Z');
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(true);
  });
  it('draws rounds, splits and reverses them, and moves between characters', async () => {
    await render();
    const o = [...host.querySelectorAll<HTMLButtonElement>('.workbench-glyph')].find(cell => cell.getAttribute('aria-label')?.startsWith('o,'))!;
    await act(() => o.click());
    expect(host.querySelector('.workbench-glyph-name')!.textContent).toBe('o');
    await act(() => button('Oval').click());
    expect(points()).toHaveLength(12);
    expect(outline()!.match(/C/g)).toHaveLength(4);
    const before = outline();
    await act(() => button('Reverse').click());
    expect(outline()).not.toBe(before);
    expect(points()).toHaveLength(12);
    await press('a', { mod: true });
    await press('c', { mod: true });
    await press('v', { mod: true });
    expect(points()).toHaveLength(24);
    expect(o.getAttribute('aria-label')).toBe('o, U+006F');
    expect(o.querySelector('path')!.getAttribute('d')).toMatch(/^M/);
  });
  it('saves the drawing privately and writes a build from it', async () => {
    await render();
    await act(() => button('Rectangle').click());
    await act(() => button('Save drawing').click()); await settle();
    const save = request.mock.calls.find(([path, init]) => path === '/api/fonts/0001-sans/source' && init?.method === 'PUT')!;
    const saved = validateSource(JSON.parse(String(save[1].body)));
    expect(saved.family).toBe('0001 Sans');
    expect(saved.glyphs).toEqual([expect.objectContaining({ unicode: 0x48, advance: 600, contours: [expect.any(Array)] })]);
    expect(props.onMessage).toHaveBeenCalledWith('Drawing saved privately. Earlier drawings are kept.');
    expect(props.onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(button('Save drawing').disabled).toBe(true);
    await act(() => button('Save as build').click()); await settle();
    const build = request.mock.calls.find(([path, init]) => path === '/api/fonts/0001-sans' && init?.method === 'PUT')!;
    expect(build[1].headers['X-Font-Name']).toBe('0001-Sans-Regular.otf');
    expect(String.fromCharCode(...new Uint8Array(build[1].body as ArrayBuffer).slice(0, 4))).toBe('OTTO');
    expect(props.onBuildSaved).toHaveBeenCalledWith('0001-Sans-Regular.otf');
  });
  it('drops a contour the pen left with too few points to draw anything', async () => {
    await render();
    await act(() => button('Pen').click());
    const canvas = host.querySelector<SVGSVGElement>('.workbench-canvas')!;
    const click = async (x: number, y: number) => {
      await act(() => { canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: x, clientY: y, pointerId: 1 })); });
      await act(() => { canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 1 })); });
    };
    await click(100, 100);
    expect(points()).toHaveLength(1);
    await press('Escape');
    expect(points()).toHaveLength(0);
    await click(100, 100); await click(140, 100); await click(140, 60);
    await press('Escape');
    expect(points()).toHaveLength(3);
  });
  it('rests its shortcuts while hidden', async () => {
    await render(true);
    expect(host.querySelector('.workbench')!.hasAttribute('hidden')).toBe(true);
    await act(() => button('Rectangle').click());
    const drawn = outline();
    await press('a', { mod: true });
    await press('Backspace');
    expect(outline()).toBe(drawn);
  });
});
