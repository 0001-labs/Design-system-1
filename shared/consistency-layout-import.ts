import type {NativeBlock,NativeComponent,NativePageDocument} from './consistency-native-page';
/** Read-only description of the retired placement format, confined to its importer. */
interface EarlierLayout {schema:1;nodes:Record<string,Record<string,unknown>>;order:Record<string,string[]>;groups?:{id:string;kind:'flow'|'columns'|'column'}[];insertions?:{id:string;parent:string;before?:string;kind:string;text?:string;source?:string;gaps?:Record<string,number>;src?:string;alt?:string;href?:string}[];pageTone?:string}
export function importEarlierLayout(document:NativePageDocument,sourceIds:Record<string,string>,input:unknown):NativePageDocument {
 const layout=input as EarlierLayout;if(!layout||layout.schema!==1||!layout.nodes||!layout.order)throw Error('invalid-earlier-layout');
 const page=structuredClone(document),nodes=new Map<string,NativeBlock>(),aliases={...sourceIds,root:'page'};
 const walk=(blocks:NativeBlock[])=>{for(const block of blocks){nodes.set(block.id,block);if('children'in block)walk(block.children);}};walk(page.blocks);
 const id=(value:string)=>{const found=aliases[value]??(nodes.has(value)?value:undefined);if(!found)throw Error(`missing-migration-node: ${value}`);return found;};
 const uid=(value:string)=>`imported_${value.replace(/[^a-zA-Z0-9_-]/g,'_')}`.slice(0,80);
 for(const group of layout.groups??[]){const key=uid(group.id);if(nodes.has(key))throw Error('duplicate-migration-id');aliases[group.id]=key;nodes.set(key,{id:key,kind:'component',name:group.kind==='flow'?'group':group.kind,children:[]});}
 const children=(parent:string):NativeBlock[]=>parent==='page'?page.blocks:('children'in nodes.get(parent)!?(nodes.get(parent)! as NativeComponent).children:[]);
 for(const insertion of layout.insertions??[]){
  const key=uid(insertion.id);aliases[insertion.id]=key;let block:NativeBlock;
  if(insertion.kind==='region'){const contentId=key+'_content';block={id:key,kind:'flow',direction:'column',gap:0,padding:0,children:[{id:contentId,kind:'content',source:insertion.source??'',...(insertion.gaps?{gaps:Object.fromEntries(Object.entries(insertion.gaps).map(([name,value])=>[name.replaceAll(insertion.id,contentId),value]))}:{})}]};}
  else if(insertion.kind==='image')block={id:key,kind:'image',src:insertion.src!,alt:insertion.alt??''};
  else if(['link','button'].includes(insertion.kind))block={id:key,kind:'link',href:insertion.href??'#',text:insertion.text??'',appearance:insertion.kind==='button'?'primary':'plain'};
  else block={id:key,kind:'content',source:(insertion.kind==='heading'?'## ':'')+(insertion.text??'')};
  walk([block]);const list=children(id(insertion.parent)),before=insertion.before?list.findIndex(child=>child.id===id(insertion.before!)):-1;list.splice(before<0?list.length:before,0,block);
 }
 for(const[old,patch]of Object.entries(layout.nodes)){
  const key=id(old);if(key==='page'){for(const name of ['gap','padding'] as const)if(patch[name]!==undefined){page.layout[name]=patch[name] as number;page.layout.overrides=[...new Set([...page.layout.overrides??[],name])];}continue;}
  const block=nodes.get(key)!;for(const name of ['width','height','gap','padding','marginTop','marginBottom','hidden'] as const)if(patch[name]!==undefined)(block as unknown as Record<string,unknown>)[name]=patch[name];
  if(patch.design&&block.kind==='component')block.design=structuredClone(patch.design) as NativeComponent['design'];
 }
 if(layout.pageTone!==undefined)page.layout.tone=layout.pageTone;
 const plans=new Map<string,string[]>(),parents=new Map<string,string>();
 for(const[parent,list]of Object.entries(layout.order)){const target=id(parent),next=list.map(id);plans.set(target,next);for(const child of next){if(parents.has(child))throw Error('duplicate-migration-placement');parents.set(child,target);}}
 const visiting=new Set<string>(),built=new Map<string,NativeBlock>();
 const build=(key:string):NativeBlock=>{if(visiting.has(key))throw Error('cyclic-migration-placement');if(built.has(key))return built.get(key)!;const source=nodes.get(key);if(!source)throw Error(`missing-migration-node: ${key}`);visiting.add(key);const block='children'in source?{...source,children:buildChildren(key,source.children)}:source;visiting.delete(key);built.set(key,block);return block;};
 const buildChildren=(parent:string,original:NativeBlock[]):NativeBlock[]=>{
  const desired=[...plans.get(parent)??[]],wanted=new Set(desired),result:NativeBlock[]=[];
  for(const child of original){if(parents.has(child.id)&&parents.get(child.id)!==parent)continue;
   if(plans.has(parent)&&child.kind==='component'&&Object.values(sourceIds).includes(child.id)){const next=desired.shift();if(next)result.push(build(next));else if(!parents.has(child.id))result.push(build(child.id));}
   else if(!wanted.has(child.id))result.push(build(child.id));
  }
  for(const child of desired)result.push(build(child));return result;
 };
 page.blocks=buildChildren('page',page.blocks);return page;
}
