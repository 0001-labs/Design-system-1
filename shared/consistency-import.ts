import type { NativeBlock, NativePageDocument } from './consistency-native-page';
import { COMPONENT_FIELDS, type NativeComponentDefinition } from './consistency-components';
export interface ImportedPage { document: NativePageDocument; components: Record<string,NativeComponentDefinition>; textKeys: Record<string,string>; sourceIds: Record<string,string> }
/** A one-way build/migration importer. Its result is an ordinary native page tree; no source
 * placement graph is retained, and both publication and editing read that tree thereafter. */
export function importComponentPage(body: HTMLElement, options: {namespace:string;properties?:Record<string,Record<string,unknown>>;origin?:string;title?:string;description?:string;lang?:string}): ImportedPage {
  const components: Record<string,NativeComponentDefinition>={},textKeys:Record<string,string>={},sourceIds:Record<string,string>={};
  let serial=0,words=0;
  const id=()=>`node_${serial++}`;
  const ancestors=(node:any,tags:string[])=>{for(let parent=node.parentElement??node.parentNode;parent;parent=parent.parentElement??parent.parentNode)if(tags.includes(('rawTagName'in parent?parent.rawTagName??'':parent.localName??'').toLowerCase()))return true;return false;};
  const convert=(node:Node):NativeBlock[]=>{
    if(node.nodeType===3){const text=node.textContent??'',key=id();if(text.trim()&&!ancestors(node,['style','script','svg','option','textarea']))textKeys[`template:page:${words++}`]=key;return[{id:key,kind:'text',text,...(ancestors(node,['option','textarea'])?{editable:false}:{})}];}
    if(node.nodeType!==1)return[];
    const element=node as HTMLElement,tag=(element.localName??(element as unknown as {rawTagName:string}).rawTagName).toLowerCase();
    if(['script','iframe','object','embed','base','noscript'].includes(tag))return[];
    const key=id(),name=`${options.namespace}_${key}`,attributes:Record<string,string>={},values:Record<string,string>={};
    const attrs=element.attributes;
    for(const attribute of (typeof attrs.length==='number'?Array.from(attrs):Object.entries(attrs).map(([name,value])=>({name,value:String(value)})))){
      if(/^on/i.test(attribute.name)||attribute.name==='srcdoc')continue;
      let value=attribute.value;
      if(options.origin&&['src','poster','href'].includes(attribute.name)&&value.startsWith('/'))value=new URL(value,options.origin).href;
      if((COMPONENT_FIELDS as readonly string[]).includes(attribute.name))values[attribute.name]=value;else attributes[attribute.name]=value;
    }
    const hidden=Object.hasOwn(attributes,'hidden');delete attributes.hidden;
    const original=element.getAttribute('data-template-node');if(original&&!['style','svg','option'].includes(tag))sourceIds[original]=key;const alias=element.getAttribute('data-legacy-id')??(element.hasAttribute('data-space')?'gap:'+element.getAttribute('data-space'):element.hasAttribute('data-writing')?'writing:'+element.getAttribute('data-writing'):null);if(alias)sourceIds[alias]=key;
    const properties=original?structuredClone(options.properties?.[original]):undefined;
    if(properties)for(const[field,value]of Object.entries(properties))if((COMPONENT_FIELDS as readonly string[]).includes(field)&&['string','number','boolean'].includes(typeof value)){values[field]=String(value);delete properties[field];}
    const definition:NativeComponentDefinition={tag,attributes,fields:[...COMPONENT_FIELDS],...(properties?{properties}:{} )};
    if(['svg','style'].includes(tag)){definition.markup=element.outerHTML;components[name]=definition;return[{id:key,kind:'component',name,...(hidden?{hidden:true}:{}),children:[]}];}
    components[name]=definition;
    return[{id:key,kind:'component',name,values,...(hidden?{hidden:true}:{}),children:[...element.childNodes].flatMap(convert)}];
  };
  const document:NativePageDocument={schema:1,kind:'native-page',layout:{mode:'document',padding:0,gap:0},blocks:[...body.childNodes].flatMap(convert)};
  if(options.title!==undefined)document.title=options.title;if(options.description!==undefined)document.description=options.description;if(options.lang)document.lang=options.lang;
  return{document,components,textKeys,sourceIds};
}
