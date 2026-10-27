// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from "vite-plus/test";
import { bindContextMenuTrigger } from "../DS1/3-unit/context-trigger";
import "../DS1/3-unit/ds-menu";
const bindings: ReturnType<typeof bindContextMenuTrigger>[] = [];
afterEach(() => { bindings.splice(0).forEach(binding => binding.dispose()); document.body.replaceChildren(); vi.useRealTimers(); });
test("a title shares keyboard gestures, preserves declined native actions and restores its attributes", () => {
  const title=document.createElement('a');title.href='#note';title.textContent='Note';title.setAttribute('aria-haspopup','dialog');document.body.append(title);
  const open=vi.fn<Parameters<typeof bindContextMenuTrigger>[1]>().mockReturnValue(false);
  const binding=bindContextMenuTrigger(title,open,{selection:true});bindings.push(binding);
  const rejected=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:10,clientY:20});title.dispatchEvent(rejected);
  expect(rejected.defaultPrevented).toBe(false);expect(open).toHaveBeenLastCalledWith({x:10,y:20},title,rejected);
  open.mockReturnValue(undefined);
  const key=new KeyboardEvent('keydown',{key:'F10',shiftKey:true,bubbles:true,cancelable:true});title.dispatchEvent(key);
  expect(key.defaultPrevented).toBe(true);expect(title.classList.contains('ds-context-trigger')).toBe(true);
  binding.dispose();expect(title.getAttribute('aria-haspopup')).toBe('dialog');expect(title.classList.contains('ds-context-trigger')).toBe(false);
});
test("declined holds do not consume clicks, and accepted holds are not reopened by a native context event", () => {
  vi.useFakeTimers();const title=document.createElement('button');document.body.append(title);
  const open=vi.fn<Parameters<typeof bindContextMenuTrigger>[1]>().mockReturnValue(false);
  bindings.push(bindContextMenuTrigger(title,open,{selection:true}));
  const press=()=>title.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',button:0,bubbles:true}));
  press();vi.advanceTimersByTime(600);
  const rejectedClick=new MouseEvent('click',{bubbles:true,cancelable:true});title.dispatchEvent(rejectedClick);expect(rejectedClick.defaultPrevented).toBe(false);
  open.mockReturnValue(undefined);press();vi.advanceTimersByTime(600);expect(open).toHaveBeenCalledTimes(2);
  title.dispatchEvent(new MouseEvent('contextmenu',{button:0,bubbles:true,cancelable:true}));expect(open).toHaveBeenCalledTimes(2);
  const acceptedClick=new MouseEvent('click',{bubbles:true,cancelable:true});title.dispatchEvent(acceptedClick);expect(acceptedClick.defaultPrevented).toBe(true);
  press();document.dispatchEvent(new PointerEvent('pointermove',{clientX:30,bubbles:true}));vi.advanceTimersByTime(600);expect(open).toHaveBeenCalledTimes(2);
});
test("a manual menu opens from an external title and leaves its ordinary click alone", async () => {
  const title=document.createElement('a');title.href='#note';title.textContent='Note';
  const menu=document.createElement('ds-menu');menu.floating=true;menu.triggerMode='manual';menu.setAttribute('role','menu');menu.innerHTML='<button role="menuitem">Action</button>';
  document.body.append(title,menu);await menu.updateComplete;
  bindings.push(bindContextMenuTrigger(title,(point,control)=>{menu.openAt(point,control)}));
  title.focus();title.dispatchEvent(new KeyboardEvent('keydown',{key:'ContextMenu',bubbles:true,cancelable:true}));await menu.updateComplete;await Promise.resolve();
  expect(menu.open).toBe(true);expect(document.activeElement).toBe(menu.querySelector('button'));
  menu.requestClose('escape');await menu.updateComplete;expect(document.activeElement).toBe(title);
  const click=new MouseEvent('click',{bubbles:true,cancelable:true});title.dispatchEvent(click);expect(click.defaultPrevented).toBe(false);expect(menu.open).toBe(false);
});

test("a right press keeps its row when settling layout moves a neighbour under the pointer", () => {
  const host=document.createElement('div');
  host.innerHTML='<button id="first">First</button><button id="second">Second</button>';
  document.body.append(host);
  const first=host.children[0] as HTMLElement,second=host.children[1] as HTMLElement;
  const open=vi.fn<Parameters<typeof bindContextMenuTrigger>[1]>();
  bindings.push(bindContextMenuTrigger(host,open,{touch:false,resolve:event=>(event.target as Element).closest('button')}));
  const press=new PointerEvent('pointerdown',{pointerType:'mouse',button:2,clientX:60,clientY:30,bubbles:true});
  first.dispatchEvent(press);
  // Chromium re-hit-tests contextmenu after a pointerdown handler settles a transform.
  const context=new MouseEvent('contextmenu',{button:2,clientX:60,clientY:30,bubbles:true,cancelable:true});
  second.dispatchEvent(context);
  expect(open).toHaveBeenCalledWith({x:60,y:30},first,expect.any(PointerEvent));
  expect(context.defaultPrevented).toBe(true);
});

test("a removed pressed row cannot redirect a destructive action to its neighbour", () => {
  const host=document.createElement('div');
  host.innerHTML='<button>First</button><button>Second</button>';document.body.append(host);
  const first=host.children[0] as HTMLElement,second=host.children[1] as HTMLElement;
  const open=vi.fn<Parameters<typeof bindContextMenuTrigger>[1]>();
  bindings.push(bindContextMenuTrigger(host,open,{touch:false}));
  first.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'mouse',button:2,clientX:60,clientY:30,bubbles:true}));
  first.remove();
  second.dispatchEvent(new MouseEvent('contextmenu',{button:2,clientX:60,clientY:30,bubbles:true,cancelable:true}));
  expect(open).not.toHaveBeenCalled();
});

test("delegated context resolvers retain the initiating gesture's composed path", () => {
  const host=document.createElement('div');host.innerHTML='<button>First</button><button>Second</button>';document.body.append(host);
  const first=host.children[0] as HTMLElement,second=host.children[1] as HTMLElement;
  const open=vi.fn<Parameters<typeof bindContextMenuTrigger>[1]>();
  bindings.push(bindContextMenuTrigger(host,open,{touch:false,resolve:event=>event.composedPath().find(node=>node instanceof HTMLButtonElement) as HTMLElement ?? null}));
  const press=new PointerEvent('pointerdown',{pointerType:'mouse',button:2,clientX:60,clientY:30,bubbles:true});
  first.dispatchEvent(press);
  // Browser Event.composedPath() becomes empty when dispatch finishes.
  press.composedPath=()=>[];
  second.dispatchEvent(new MouseEvent('contextmenu',{button:2,clientX:60,clientY:30,bubbles:true,cancelable:true}));
  expect(open).toHaveBeenCalledWith({x:60,y:30},first,expect.any(PointerEvent));
});
