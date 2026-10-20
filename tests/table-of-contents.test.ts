// @vitest-environment happy-dom
import { afterEach, expect, test, vi } from 'vite-plus/test';
vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')));
const { TableOfContents } = await import('../DS1/3-unit/ds-table-of-contents');
const { componentGraph } = await import('../scripts/component-graph.mjs');
afterEach(() => { document.body.replaceChildren(); history.replaceState(null,'','/'); });
const frame = () => new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
async function setup() {
  history.replaceState(null,'','/?view=reference');
  const article=document.createElement('article');article.style.overflowY='auto';
  article.innerHTML='<h2 id="first">First</h2><h2 id="second">Second</h2><h3 id="third">Third</h3>';
  document.body.append(article);
  const positions=[100,400,650];
  const headings=[...article.children] as HTMLElement[];
  headings.forEach((heading,index)=>{heading.getBoundingClientRect=()=>new DOMRect(0,positions[index],100,20);heading.scrollIntoView=vi.fn();});
  article.getBoundingClientRect=()=>new DOMRect(0,100,400,200);
  Object.defineProperties(article,{clientHeight:{value:200},scrollHeight:{value:1000}});
  const toc=new TableOfContents();toc.items=[{href:'#first',label:'First'},{href:'#second',label:'Second'},{href:'#third',label:'Third',depth:1}];
  document.body.append(toc);await toc.updateComplete;toc.refresh();await frame();
  return {toc,article,headings,positions,links:[...toc.shadowRoot!.querySelectorAll('a')]};
}
test('tracks the actual article scroll container, including the final short section', async()=>{
 const {toc,article,positions,links}=await setup();expect(toc.current).toBe('#first');
 article.scrollTop=350;positions.splice(0,3,-250,100,350);article.dispatchEvent(new Event('scroll'));await frame();
 expect(toc.current).toBe('#second');expect(links[1].getAttribute('aria-current')).toBe('location');expect(links[0].hasAttribute('aria-current')).toBe(false);
 article.scrollTop=800;positions.splice(0,3,-700,-350,250);article.dispatchEvent(new Event('scroll'));await frame();
 expect(toc.current).toBe('#third');expect(links[2].style.getPropertyValue('--toc-depth')).toBe('1');
});
test('following a section focuses it and retains query state; modified links stay native',async()=>{
 const {links,headings,toc}=await setup();
 const modified=new MouseEvent('click',{button:0,ctrlKey:true,bubbles:true,composed:true,cancelable:true});links[1].dispatchEvent(modified);
 expect(modified.defaultPrevented).toBe(false);expect(headings[1].scrollIntoView).not.toHaveBeenCalled();
 const click=new MouseEvent('click',{button:0,bubbles:true,composed:true,cancelable:true});links[1].dispatchEvent(click);
 expect(click.defaultPrevented).toBe(true);expect(headings[1].scrollIntoView).toHaveBeenCalled();expect(document.activeElement).toBe(headings[1]);
 expect(location.search).toBe('?view=reference');expect(location.hash).toBe('#second');expect(toc.current).toBe('#second');
});
test('the current-section threshold follows the rendered row at a changed surface scale',async()=>{
 const {toc,article,positions}=await setup();
 toc.shadowRoot!.querySelector<HTMLElement>('.title')!.getBoundingClientRect=()=>new DOMRect(0,0,400,40);
 positions.splice(0,3,80,130,500);article.dispatchEvent(new Event('scroll'));await frame();
 expect(toc.current).toBe('#second');
});
test('slotted links retain their text and external destinations; reconnect restores tracking',async()=>{
 const {toc,article,positions}=await setup();toc.items=[];toc.innerHTML='<a href="#first">Authored first</a><a href="/another-page/#section">Another page</a>';
 await toc.updateComplete;toc.refresh();await frame();expect(toc.querySelector('a')?.getAttribute('aria-current')).toBe('location');
 let prevented=false;toc.addEventListener('click',event=>{prevented=event.defaultPrevented;event.preventDefault();},{once:true});
 const other=toc.querySelectorAll('a')[1];const click=new MouseEvent('click',{button:0,bubbles:true,composed:true,cancelable:true});other.dispatchEvent(click);expect(prevented).toBe(false);
 toc.remove();positions[0]=-100;article.dispatchEvent(new Event('scroll'));await frame();expect(toc.current).toBe('#first');
 document.body.append(toc);await toc.updateComplete;toc.refresh();await frame();expect(toc.querySelector('a')?.textContent).toBe('Authored first');
});
test('same-root shadow headings and the explicit content target resolve without document-wide IDs',async()=>{
 const outer=document.createElement('div');document.body.append(outer);const root=outer.attachShadow({mode:'open'});root.innerHTML='<h2 id="local">Local</h2>';
 const toc=new TableOfContents();toc.items=[{href:'#local',label:'Local'}];root.append(toc);await toc.updateComplete;toc.refresh();await frame();expect(toc.current).toBe('#local');
 toc.target=document.createElement('article');toc.target.innerHTML='<h2 id="target">Target</h2>';document.body.append(toc.target);toc.items=[{href:'#target',label:'Target'}];await toc.updateComplete;await frame();expect(toc.current).toBe('#target');
});
test('Sync 1 collects the Unit, its shared styles and optional React adapter',()=>{
 const {files}=componentGraph('DS1',['table-of-contents']);expect(files.has('3-unit/ds-table-of-contents.ts')).toBe(true);expect(files.has('react/table-of-contents.ts')).toBe(true);expect(files.has('2-core/ds-text.ts')).toBe(true);
});
