import templates from './consistency-template-pages.json';
import {validateWorkspacePage,type WorkspacePage} from './consistency-workspace-page';
import {importEarlierLayout} from './consistency-layout-import';
import type {NativeBlock,NativeComponent,NativeContent,NativePageDocument} from './consistency-native-page';
interface EarlierComposition {text:string;sections:Record<string,string>;order:string[];hidden:string[];gaps:Record<string,number>;width:number;padding:number;gap:number;wrap:boolean;pageTone?:string;sizes:Record<string,{width:number;height:number}>;cardDesigns:Record<string,Record<string,unknown>>;cardGaps:Record<string,Record<string,number>>;statDesigns:Record<string,{color?:string}>;buttonDesigns:Record<string,{appearance?:'plain'|'primary'|'secondary'}>}
interface Template {document:NativePageDocument;components:Record<string,{attributes:Record<string,string>}>;textKeys:Record<string,string>;sourceIds:Record<string,string>;bookingKeys?:string[];seed?:EarlierComposition}
const catalogue=templates as unknown as Record<string,Template>;
const walk=(blocks:NativeBlock[],visit:(block:NativeBlock)=>void)=>{for(const block of blocks){visit(block);if('children'in block)walk(block.children,visit);}};
const index=(page:NativePageDocument)=>{const result=new Map<string,NativeBlock>();walk(page.blocks,block=>result.set(block.id,block));return result;};
const safeId=(id:string)=>id.replace(/[^a-zA-Z0-9_-]/g,'_').replace(/^[^a-zA-Z]/,'section_').slice(0,70);
const gaps=(c:EarlierComposition,id:string)=>Object.fromEntries(Object.entries(c.gaps??{}).filter(([key])=>key.startsWith(`${id}-text-`)||key.startsWith(`${id}-nested-`)||key.startsWith(`columns:${id}:`)));
function writing(c:EarlierComposition,id:string):NativeContent{return{id:safeId(id),kind:'content',source:id==='intro'?c.text:c.sections[id]??'',gaps:gaps(c,id),wrap:c.wrap!==false};}
/** All earlier versions enter the same native page model. The source revision is left in database
 * history; this importer has no editing operations or alternate renderer. */
export function migrateWorkspacePage(value:unknown):WorkspacePage {
 const v=value as Record<string,unknown>;
 if(v?.schema===2)return validateWorkspacePage(value);
 if(!v||v.schema!==1||typeof v.example!=='string'||!v.composition)throw Error('unsupported-page-document');
 const c=v.composition as EarlierComposition,template=catalogue[v.example];let page:NativePageDocument;
 if(c.sections?.__authored==='1'||v.example==='booking'){
  if(!template)throw Error('missing-template-migration');page=structuredClone(template.document);const nodes=index(page);
  for(const[key,text]of Object.entries(c.sections??{})){
   if(key==='__authored'||key==='__layout')continue;
   const direct=template.textKeys[key];
   if(direct){const block=nodes.get(direct);if(block?.kind!=='text')throw Error('missing-text-migration');block.text=text;continue;}
   if(key.startsWith('template:')){const field=key.slice('template:'.length),prefix=field.split(':')[0],owner=template.sourceIds[/^n\d+/.exec(prefix)?.[0]??prefix],block=nodes.get(owner);if(block?.kind!=='component')throw Error(`missing-component-field: ${key}`);block.words={...block.words,[field]:text};continue;}
   if(/^booking:\d+$/.test(key)){const block=nodes.get(template.bookingKeys?.[Number(key.slice(8))]??'');if(block?.kind==='text')block.text=text;else if(block?.kind==='component'){const first=block.children.find(child=>child.kind==='text');block.children=[{id:first?.id??block.id+'_words',kind:'text',text}];if(block.values?.text!==undefined)block.values.text=text;}else throw Error(`missing-booking-field: ${key}`);continue;}
   if(text)throw Error(`unknown-template-field: ${key}`);
  }
  if(c.sections.__layout)page=importEarlierLayout(page,template.sourceIds,JSON.parse(c.sections.__layout));
 }else if(v.example==='studio'){
  const studio=catalogue.studio;page=structuredClone(studio.document);const nodes=index(page);
  for(const name of ['intro','work','approach','contact']){const target=nodes.get(studio.sourceIds['writing:'+name]);if(target&&'children'in target)target.children=[writing(c,name)];}
  const sheet=nodes.get(studio.sourceIds.sheet);if(sheet?.kind==='component')sheet.padding=c.padding;
  for(const[id,size]of Object.entries(c.sizes??{})){const block=nodes.get(studio.sourceIds[id]);if(block){block.width=size.width;if(block.kind==='component')block.height=size.height;}}
  for(const[id,design]of Object.entries(c.cardDesigns??{})){const block=nodes.get(studio.sourceIds[id]);if(block?.kind==='component'){const{width,height,gaps,...appearance}=design;block.design={...block.design,...appearance,...(gaps?{gaps:gaps as Record<string,number>}:{})};if(width!==undefined)block.width=width as number;if(height!==undefined)block.height=height as number;}}
  for(const[id,inner]of Object.entries(c.cardGaps??{})){const block=nodes.get(studio.sourceIds[id]);if(block?.kind==='component')block.design={...block.design,gaps:{...block.design?.gaps,...inner}};}
  for(const[id,design]of Object.entries({...c.statDesigns,...c.buttonDesigns})){const block=nodes.get(studio.sourceIds[id]);if(block?.kind==='component')block.design={...block.design,...design};}
  for(const[key,size]of Object.entries(c.gaps??{})){const block=nodes.get(studio.sourceIds['gap:'+key]);if(block?.kind==='component'){block.gap=size;}else if(key.startsWith('stat:')){const[,id,part]=key.split(':'),stat=nodes.get(studio.sourceIds[id]);if(stat?.kind==='component')stat.design={...stat.design,gaps:{...stat.design?.gaps,[part]:size}};}}
  for(const hidden of c.hidden??[]){const block=nodes.get(studio.sourceIds[hidden]??studio.sourceIds['group-'+hidden]);if(block)block.hidden=true;}
  const container=nodes.get(studio.sourceIds.sheet) as NativeComponent|undefined;
  if(container){const groups=new Map(container.children.filter(block=>Object.values(studio.sourceIds).includes(block.id)).map(block=>[block.id,block]));const ordered=(c.order??[]).map(id=>groups.get(studio.sourceIds['group-'+id])).filter((block):block is NativeBlock=>!!block);for(const name of ['intro','work','approach','contact']){const block=groups.get(studio.sourceIds['group-'+name]);if(block&&!ordered.includes(block)){block.hidden=true;ordered.push(block);}}container.children=ordered;}
  if(c.pageTone)page.layout.tone=c.pageTone;
 }else{
  page={schema:1,kind:'native-page',layout:{maxWidth:c.width,padding:c.padding,gap:0,...(c.pageTone?{tone:c.pageTone}:{})},blocks:[]};
  const names=[...new Set([...(c.order??[]),...Object.keys(c.sections??{}).filter(key=>!key.startsWith('__'))])];if(!names.includes('intro'))names.unshift('intro');
  for(const name of names){const block=writing(c,name),hidden=!(c.order??[]).includes(name)||(c.hidden??[]).includes(name)||(c.hidden??[]).includes('group-'+name);page.blocks.push({id:'section_'+safeId(name),kind:'flow',direction:'column',padding:0,gap:c.gaps?.['section-'+name]??20,hidden,children:[block,{id:'space_'+safeId(name),kind:'flow',direction:'column',padding:0,gap:0,children:[]}]});}
 }
 return validateWorkspacePage({schema:2,kind:'page',example:v.example,library:v.library??'original',fonts:v.fonts??{},page});
}
export function studioSeed():WorkspacePage {const c=catalogue.studio.seed;if(!c)throw Error('missing-studio-seed');return migrateWorkspacePage({schema:1,example:'studio',library:'original',fonts:{},composition:c});}
