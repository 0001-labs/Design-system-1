/** Evaluate repository-authored demo seeds at build time in an isolated DOM. Demo scripts never ship in the editor. */
import { Window } from 'happy-dom';
import { Script, createContext } from 'node:vm';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { initialComposition } from '../packages/consistency/src/model';
import { studioMarkup } from '../shared/consistency-studio';
import { importComponentPage } from '../shared/consistency-import';
import { SITE_TEMPLATES } from '../packages/consistency/src/template-catalogue';
const properties = ['items', 'data', 'columns', 'values', 'value', 'figure', 'caption', 'label', 'segments', 'series', 'nodes', 'edges'];
const snapshots: Record<string, unknown> = {};
const pages: Record<string, unknown> = {};
for (const template of SITE_TEMPLATES) {
  const window = new Window({ url: 'https://example.invalid/' });
  window.document.body.innerHTML = template.html;
  const document = window.document;
  document.querySelectorAll('ds-input,ds-select,ds-calendar').forEach(element => {
    (element as unknown as { value: string }).value = element.getAttribute('value') ?? '';
  });
  const sandbox = createContext({ ResizeObserver: class { observe() {} disconnect() {} }, getComputedStyle: window.getComputedStyle.bind(window), document, window: { document }, customElements: { whenDefined: async () => undefined }, console, setTimeout: () => 0, clearTimeout: () => {}, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {} });
  if (template.script) await new Script(`(async () => { ${template.script}\n })()`, { filename: `template-${template.id}` }).runInContext(sandbox, { timeout: 2000 });
  const components: Record<string, Record<string, unknown>> = {};
  let index = 0;
  document.body.querySelectorAll('*').forEach(element => {
    element.setAttribute('data-template-node', `n${index++}`);
    const data: Record<string, unknown> = {};
    if (element.localName.startsWith('ds-')) for (const key of properties) {
      const value = (element as unknown as Record<string, unknown>)[key];
      if (value !== undefined && typeof value !== 'function') {
        try { data[key] = JSON.parse(JSON.stringify(value)); } catch { /* non-data DOM property */ }
      }
    }
    if (Object.keys(data).length) components[element.getAttribute('data-template-node')!] = data;
  });
  const library = template.library ? template.library.href.startsWith('https:') ? await fetch(template.library.href).then(response => { if (!response.ok) throw new Error('Template library unavailable'); return response.text(); }) : await readFile(`website/public${template.library.href}`, 'utf8') : '';
  const imported=importComponentPage(document.body as never,{namespace:`template_${template.id.replaceAll('-','_')}`,properties:components,origin:'https://designsystem1.com'});
  const bookingKeys:string[]=[];
  if(template.id==='booking'){
    const textIds=new Map<Node,string>();let index=0;const walker=document.createTreeWalker(document.body,window.NodeFilter.SHOW_TEXT);while(walker.nextNode()){const node=walker.currentNode;if(node.textContent?.trim()&&!node.parentElement?.closest('style,script,svg,option,textarea'))textIds.set(node,imported.textKeys[`template:page:${index++}`]);}
    const visit=(element:Element)=>{if(element.matches('ds-text:not(:empty),span[slot="title"],span[slot="label"]'))bookingKeys.push(imported.sourceIds[element.getAttribute('data-template-node')!]);for(const child of element.childNodes){if(child.nodeType===1)visit(child as Element);else if(element.localName==='ds-button'&&child.nodeType===3&&child.textContent?.trim())bookingKeys.push(textIds.get(child)!);}};visit(document.body);
  }
  pages[template.id] = {id:template.id,label:template.label,description:template.description,href:template.href,...imported,bookingKeys,library};
  snapshots[template.id] = { id: template.id, label: template.label, description: template.description, href: template.href, html: document.body.innerHTML, components, library };
  await window.happyDOM.close();
}
const studioWindow=new Window();studioWindow.document.body.innerHTML=studioMarkup;const studio=importComponentPage(studioWindow.document.body as never,{namespace:'studio'});pages.studio={...studio,seed:initialComposition,library:await readFile('packages/consistency/src/style.css','utf8')};await studioWindow.happyDOM.close();
await mkdir('packages/consistency/generated', { recursive: true });
await writeFile('packages/consistency/generated/templates.json', JSON.stringify(snapshots));
await writeFile('shared/consistency-template-pages.json', JSON.stringify(pages));
console.log(`Prepared ${SITE_TEMPLATES.length} editable site templates from the DS1 catalogue.`);
