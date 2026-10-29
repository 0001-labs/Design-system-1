const modules=import.meta.glob('../../../DS1/{2-core,3-unit,4-page}/ds-*.ts');
/** Register only the components present in this page; product controls import their own dependencies. */
export async function prepareComponents(root:ParentNode){
 const names=new Set([...root.querySelectorAll('*')].map(element=>element.localName).filter(name=>name.startsWith('ds-')&&!customElements.get(name)));
 await Promise.all([...names].map(name=>{const key=Object.keys(modules).find(path=>path.endsWith(`/${name}.ts`));return key?modules[key]():undefined;}));
}
import { createSurfaceElement } from './editor-surface';
import type { NativeComponentDefinition } from '../../../shared/consistency-components';

/** Only DS1's registered implementation runs in the parent realm. Site scripts never run in a canvas. */
export function upgradeComponentTree(root: ParentNode, assetURL?: (source: string) => string, editing = false): HTMLElement[] {
  const elements = [...(root instanceof HTMLElement ? [root] : []), ...root.querySelectorAll<HTMLElement>('*')];
  const upgraded: HTMLElement[] = [];
  for (let element of elements) {
    if (!element.localName.startsWith('ds-') || !customElements.get(element.localName)) continue;
    if (editing && element.localName === 'ds-carousel' && !element.hasAttribute('no-drag')) element.setAttribute('no-drag','');
    if (assetURL) for (const name of ['asset-base','chrome-assets']) {
      const value=element.getAttribute(name);
      if(value){const mapped=assetURL(value);if(mapped!==value)element.setAttribute(name,mapped);}
    }
    // An element already created in the registered realm keeps its Lit state and focused fields.
    if (!customElements.get(element.localName)!.prototype.isPrototypeOf(element)) {
      const replacement = createSurfaceElement(element.ownerDocument,element.localName);
      for(const attribute of [...element.attributes]) replacement.setAttribute(attribute.name,attribute.value);
      replacement.append(...element.childNodes);element.replaceWith(replacement);element=replacement;
    }
    const data=element.getAttribute('data-c9y-component-data');
    if(data&&!element.hasAttribute('data-c9y-component-ready')){const value=JSON.parse(data);Object.assign(element,value.properties??{});element.setAttribute('data-c9y-component-ready','');}
    upgraded.push(element);
  }
  return upgraded;
}
export async function componentsReady(elements: HTMLElement[]) {
  await Promise.all(elements.map(element=>(element as HTMLElement&{updateComplete?:Promise<unknown>}).updateComplete));
}
export {componentWords} from '../../../shared/consistency-component-words';
const appliedValues = new WeakMap<HTMLElement,Set<string>>();
export function applyComponentValues(element:HTMLElement,definition:NativeComponentDefinition,values:Record<string,string>={}) {
  const previous=appliedValues.get(element)??new Set<string>();
  for(const field of definition.fields){if(Object.hasOwn(values,field)){if(element.getAttribute(field)!==values[field])element.setAttribute(field,values[field]);}else if(previous.has(field))element.removeAttribute(field);}
  appliedValues.set(element,new Set(Object.keys(values)));
}
