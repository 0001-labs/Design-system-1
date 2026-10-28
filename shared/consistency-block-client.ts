import '../DS1/index';
import {defineAaDiagram} from '../website/src/vendor/aa/diagram.js';
import {componentWords} from './consistency-component-words';
defineAaDiagram();
/** Build-owned properties and document-owned text slots hydrate after the same DS1 implementation
 * used by the editor. No site script, expression or event handler is accepted from a page document. */
async function hydrate(){
 for(const element of document.querySelectorAll<HTMLElement>('[data-c9y-component-data]')){
  if(element.dataset.c9yHydrated!==undefined)continue;const value=JSON.parse(element.dataset.c9yComponentData!);
  Object.assign(element,value.properties??{});element.dataset.c9yHydrated='';
  await (element as HTMLElement&{updateComplete?:Promise<unknown>}).updateComplete;
  componentWords(element,(text,key)=>{if(Object.hasOwn(value.words??{},key))text.textContent=value.words[key];});
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void hydrate(),{once:true});else void hydrate();
