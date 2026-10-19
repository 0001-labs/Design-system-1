// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { bindSpacingHandle, type SpacingOptions } from '../packages/app/src/2-core/spacing-handle';
import { LoadingIndicator } from '../packages/app/src/2-core/ds-loading';
import { LAYERS, ALL_LAYERS } from '../shared/component-directory';
import { componentGraph } from '../scripts/component-graph.mjs';
import { isPublicComponent } from '../DS1/0-face/component-visibility';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { LoadingIndicator as Loading } from '../packages/app/src/react/loading';
// The language runtime asks for a translations file as it loads.
vi.hoisted(() => { globalThis.fetch = async () => new Response('{}'); });
let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); document.body.replaceChildren(); });
function setup(extra: Partial<SpacingOptions> = {}) {
 const target = document.createElement('span'); document.body.append(target);
 const o = {value:20,step:20,gain:2,axis:'vertical' as const,onPreview:vi.fn(),onCommit:vi.fn(),onEnd:vi.fn(),...extra};
 dispose = bindSpacingHandle(target,()=>o);
 return {target,o};
}
const pointer = (target: EventTarget, type: string, y = 0, id = 1) => target.dispatchEvent(new PointerEvent(type,{pointerId:id,isPrimary:true,button:0,clientY:y,bubbles:true}));
test('raw preview, snapped commit, foreign pointers and cancelled preview',()=>{
 const {target,o}=setup(); pointer(target,'pointerdown'); pointer(window,'pointermove',23,2); expect(o.onPreview).not.toHaveBeenCalled();
 pointer(window,'pointermove',23); expect(o.onPreview).toHaveBeenLastCalledWith(66); pointer(window,'pointerup'); expect(o.onCommit).toHaveBeenCalledExactlyOnceWith(60);
 pointer(target,'pointerdown'); pointer(window,'pointermove',30); pointer(window,'pointercancel'); expect(o.onPreview).toHaveBeenLastCalledWith(20); expect(o.onCommit).toHaveBeenCalledTimes(1); expect(o.onEnd).toHaveBeenLastCalledWith(true);
});
test.each(['lostpointercapture','blur','unmount','Escape'])('cancel on %s without saving',reason=>{
 const {target,o}=setup(); pointer(target,'pointerdown'); pointer(window,'pointermove',20);
 if(reason==='unmount') dispose?.(); else if(reason==='Escape') window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'})); else (reason==='blur'?window:target).dispatchEvent(new Event(reason));
 expect(o.onCommit).not.toHaveBeenCalled(); expect(o.onPreview).toHaveBeenLastCalledWith(20);
 pointer(window,'pointerup'); expect(o.onCommit).not.toHaveBeenCalled();
});
test('keyboard accumulates without accepted rerender, clamps, commits once and supports disabled state',()=>{
 const {target,o}=setup({axis:'horizontal',step:1,max:40,shiftStep:10});
 target.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true})); target.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true}));
 expect(o.onPreview).toHaveBeenLastCalledWith(40); expect(o.onCommit).not.toHaveBeenCalled(); target.dispatchEvent(new Event('blur')); expect(o.onCommit).toHaveBeenCalledExactlyOnceWith(40);
 o.disabled=true; pointer(target,'pointerdown'); pointer(window,'pointermove',30); pointer(window,'pointerup'); expect(o.onCommit).toHaveBeenCalledTimes(1);
});
test('loading has an accessible automatic busy state and SSR markup before hydration',async()=>{
 const el = new LoadingIndicator(); el.label='Opening document'; document.body.append(el); await el.updateComplete;
 expect(el.shadowRoot!.querySelector('[role=status]')!.getAttribute('aria-label')).toBe('Opening document');
 const html=renderToStaticMarkup(createElement(Loading,{label:'Opening document'}));
 expect(html).toContain('aria-busy="true"'); expect(readFileSync('packages/app/src/2-core/styles/ds-loading.css','utf8')).toContain('prefers-reduced-motion'); expect(html).not.toContain('progressbar');
});
test('internal components remain exportable but are absent from public choices; ordinary components and charts stay public',()=>{
 const tags=LAYERS.flatMap(l=>l.entries).map(e=>e.tag);
 expect(tags).not.toContain('ds-kbd'); expect(tags).not.toContain('ds-loading'); expect(tags).not.toContain('ds-spacing-handle'); expect(tags).toContain('ds-button');
 expect(ALL_LAYERS.flatMap(l=>l.entries).some(e=>e.tag==='ds-loading')).toBe(true);
 expect(isPublicComponent('chart')).toBe(true);
 const graph=componentGraph('DS1',['loading','spacing-handle']);
 expect(graph.files.has('react/loading.ts')).toBe(true); expect(graph.files.has('react/spacing-handle.ts')).toBe(true);
});

test('unmount never reverses an already committed immediate keyboard edit', () => {
 const {target,o}=setup({immediateKeyboard:true});
 target.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp'}));
 expect(o.onCommit).toHaveBeenCalledExactlyOnceWith(40);
 dispose?.(); expect(o.onCommit).toHaveBeenCalledTimes(1);
});
