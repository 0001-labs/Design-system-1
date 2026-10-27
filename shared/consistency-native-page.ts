import { nativeRegionStyles, renderNativeRegion, validateNativeRegion } from './consistency-native-content';
import pageStyles from './consistency-native-page.css?raw';

export interface NativeBlockBase { id: string; width?: number; hidden?: boolean; locale?: string }
export interface NativeFlow extends NativeBlockBase {
  kind: 'flow'; role?: 'section' | 'header' | 'nav' | 'footer' | 'main';
  direction: 'column' | 'row'; mobileDirection?: 'column' | 'row'; gap: number; mobileGap?: number; padding: number; children: NativeBlock[];
  disclosure?: { label: string; open?: boolean };
}
export interface NativeGrid extends NativeBlockBase {
  kind: 'grid'; columns: number; mobileColumns?: number; columnGap: number; rowGap: number; children: NativeBlock[];
}
export interface NativeContent extends NativeBlockBase {
  kind: 'content'; source: string; gaps?: Record<string, number>; binding?: string;
}
export interface NativeImage extends NativeBlockBase {
  kind: 'image'; src: string; alt: string; height?: number; mobileHeight?: number; fit?: 'contain' | 'cover'; href?: string;
}
export interface NativeLink extends NativeBlockBase {
  kind: 'link'; text: string; href: string; appearance?: 'plain' | 'default' | 'primary' | 'secondary'; binding?: string;
}
export interface NativeCollection extends NativeBlockBase {
  kind: 'collection'; binding: string; layout: 'grid' | 'gallery';
  /** Gallery uses this many ordinary cards per row; its first row contains featured cards. */
  columns: number; featured: number; columnGap: number; rowGap: number;
  imageHeight: number; featuredImageHeight?: number; mobileImageHeight?: number; fit: 'contain' | 'cover';
}
export type NativeRuntimeProps = Record<string, string | number | boolean | null>;
export interface NativeRuntime extends NativeBlockBase { kind: 'runtime'; name: string; props: NativeRuntimeProps }
export type NativeBlock = NativeFlow | NativeGrid | NativeContent | NativeImage | NativeLink | NativeCollection | NativeRuntime;
export interface NativePageDocument {
  schema: 1; kind: 'native-page';
  title?: string; description?: string; lang?: string;
  layout: { maxWidth?: number; padding: number; gap: number };
  blocks: NativeBlock[];
}
export interface NativeCollectionItem {
  id: string; href?: string; title: string; image?: { src: string; alt: string }; price?: string;
}
export interface NativeCollectionData { items: NativeCollectionItem[] }
export interface NativePageContext {
  images: readonly string[]; collections: readonly string[];
  runtimes: Readonly<Record<string, readonly string[]>>; bindings?: readonly string[];
}
export interface NativePageRenderOptions {
  images?: readonly string[];
  collections?: Readonly<Record<string, NativeCollectionData>>;
  /** Trusted site code renders a registered runtime; HTML is never a document field. */
  runtime?: (block: NativeRuntime) => string;
  collectionAction?: (block: NativeCollection, item: NativeCollectionItem) => string;
  editor?: boolean;
}
export const nativePageStyles = nativeRegionStyles + '\n' + pageStyles;

const invalid = (): never => { throw new Error('invalid-native-page'); };
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : invalid();
function keys(value: Record<string, unknown>, allowed: readonly string[]) { if (Object.keys(value).some(key => !allowed.includes(key))) invalid(); }
const text = (value: unknown, maximum: number) => typeof value === 'string' && value.length <= maximum && !value.includes('\0') ? value : invalid();
const integer = (value: unknown, maximum = 2000, minimum = 0) => typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : invalid();
const choice = <T extends string>(value: unknown, choices: readonly T[]): T => typeof value === 'string' && choices.includes(value as T) ? value as T : invalid();
const boolean = (value: unknown) => typeof value === 'boolean' ? value : invalid();
const escape = (value: string) => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
function address(value: unknown, image = false): string {
  const source = text(value, 4000);
  if (!source || /[\u0000-\u0020\u007f\\<>]/.test(source) || source.startsWith('//')) return invalid();
  if (/^https?:\/\//i.test(source) || /^\/(?!\/)/.test(source) || !image && (/^(?:mailto:|tel:|#)/i.test(source) || !/^[a-z][a-z0-9+.-]*:/i.test(source))) return source;
  return invalid();
}
const measure = (value: number) => `calc(${value}px * var(--sf,1))`;

/** Native documents contain only closed blocks. Binding registries belong to the site's trusted code. */
export function validateNativePage(value: unknown, context: NativePageContext): NativePageDocument {
  const source = record(value); keys(source,['schema','kind','title','description','lang','layout','blocks']);
  if (source.schema !== 1 || source.kind !== 'native-page') return invalid();
  const layout = record(source.layout); keys(layout,['maxWidth','padding','gap']);
  const result: NativePageDocument = { schema:1, kind:'native-page', layout:{padding:integer(layout.padding),gap:integer(layout.gap)}, blocks:[] };
  if (layout.maxWidth !== undefined) result.layout.maxWidth=integer(layout.maxWidth,10000,200);
  if (source.title !== undefined) result.title=text(source.title,500);
  if (source.description !== undefined) result.description=text(source.description,2000);
  if (source.lang !== undefined) { result.lang=text(source.lang,20); if(!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(result.lang)) return invalid(); }
  const ids=new Set<string>(), ancestors=new Set<unknown>(); let count=0;
  const nodes=(values:unknown, depth:number):NativeBlock[]=>{
    if(!Array.isArray(values)||depth>12||ancestors.has(values))return invalid();
    ancestors.add(values);
    const blocks=values.map(value=>{
      const input=record(value); if(++count>500||ancestors.has(input))return invalid(); ancestors.add(input);
      const id=text(input.id,80);if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(id)||ids.has(id))return invalid();ids.add(id);
      const kind=choice(input.kind,['flow','grid','content','image','link','collection','runtime'] as const);
      const base:NativeBlockBase={id};
      if(input.width!==undefined)base.width=integer(input.width,10000,20);
      if(input.hidden!==undefined)base.hidden=boolean(input.hidden);
      if(input.locale!==undefined){base.locale=text(input.locale,20);if(!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(base.locale))return invalid();}
      const common=['id','kind','width','hidden','locale']; let block:NativeBlock;
      if(kind==='flow'){
        keys(input,[...common,'role','direction','mobileDirection','gap','mobileGap','padding','children','disclosure']);
        block={...base,kind,direction:choice(input.direction,['column','row']),gap:integer(input.gap),padding:integer(input.padding),children:nodes(input.children,depth+1)};
        if(input.mobileDirection!==undefined)block.mobileDirection=choice(input.mobileDirection,['column','row'] as const);
        if(input.mobileGap!==undefined)block.mobileGap=integer(input.mobileGap);
        if(input.role!==undefined)block.role=choice(input.role,['section','header','nav','footer','main'] as const);
        if(input.disclosure!==undefined){const disclosure=record(input.disclosure);keys(disclosure,['label','open']);block.disclosure={label:text(disclosure.label,500)};if(disclosure.open!==undefined)block.disclosure.open=boolean(disclosure.open);}
      }else if(kind==='grid'){
        keys(input,[...common,'columns','mobileColumns','columnGap','rowGap','children']);
        block={...base,kind,columns:integer(input.columns,12,1),columnGap:integer(input.columnGap),rowGap:integer(input.rowGap),children:nodes(input.children,depth+1)};
        if(input.mobileColumns!==undefined)block.mobileColumns=integer(input.mobileColumns,6,1);
      }else if(kind==='content'){
        keys(input,[...common,'source','gaps','binding']);
        const content=text(input.source,24000),gaps=input.gaps===undefined?undefined:record(input.gaps) as Record<string,number>;
        validateNativeRegion(content,context.images,gaps,id);
        block={...base,kind,source:content,...(gaps?{gaps:{...gaps}}:{})};
        if(input.binding!==undefined){const binding=text(input.binding,200);if(!context.bindings?.includes(binding))return invalid();block.binding=binding;}
      }else if(kind==='image'){
        keys(input,[...common,'src','alt','height','mobileHeight','fit','href']);
        const src=address(input.src,true);if(src.startsWith('/')&&!context.images.includes(src))return invalid();
        block={...base,kind,src,alt:text(input.alt,1000)};
        if(input.height!==undefined)block.height=integer(input.height,2000,20);
        if(input.mobileHeight!==undefined)block.mobileHeight=integer(input.mobileHeight,2000,20);
        if(input.fit!==undefined)block.fit=choice(input.fit,['contain','cover'] as const);
        if(input.href!==undefined)block.href=address(input.href);
      }else if(kind==='link'){
        keys(input,[...common,'text','href','appearance','binding']);block={...base,kind,text:text(input.text,1000),href:address(input.href)};
        if(input.appearance!==undefined)block.appearance=choice(input.appearance,['plain','default','primary','secondary'] as const);
        if(input.binding!==undefined){const binding=text(input.binding,200);if(!context.bindings?.includes(binding))return invalid();block.binding=binding;}
      }else if(kind==='collection'){
        keys(input,[...common,'binding','layout','columns','featured','columnGap','rowGap','imageHeight','featuredImageHeight','mobileImageHeight','fit']);
        const binding=text(input.binding,200);if(!context.collections.includes(binding))return invalid();
        block={...base,kind,binding,layout:choice(input.layout,['grid','gallery']),columns:integer(input.columns,6,1),featured:integer(input.featured,6),columnGap:integer(input.columnGap),rowGap:integer(input.rowGap),imageHeight:integer(input.imageHeight,2000,20),fit:choice(input.fit,['contain','cover'])};
        if(input.featuredImageHeight!==undefined)block.featuredImageHeight=integer(input.featuredImageHeight,2000,20);
        if(input.mobileImageHeight!==undefined)block.mobileImageHeight=integer(input.mobileImageHeight,2000,20);
      }else{
        keys(input,[...common,'name','props']);const name=text(input.name,80),allowed=context.runtimes[name];if(!allowed)return invalid();
        const props=record(input.props);keys(props,allowed);const clean:NativeRuntimeProps={};
        for(const[key,value]of Object.entries(props)){
          if(typeof value==='string')clean[key]=text(value,4000);else if(typeof value==='boolean'||value===null)clean[key]=value;
          else if(typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=1e9)clean[key]=value;else return invalid();
        }
        block={...base,kind,name,props:clean};
      }
      ancestors.delete(input);return block;
    });
    ancestors.delete(values);return blocks;
  };
  result.blocks=nodes(source.blocks,0);
  if(JSON.stringify(result).length>60000)return invalid();
  return result;
}

export function nativeCollectionTracks(block: NativeCollection): { columns: number; ordinarySpan: number; featuredSpan: number } {
  if(block.layout!=='gallery'||!block.featured)return{columns:block.columns,ordinarySpan:1,featuredSpan:1};
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
  const columns=block.columns*block.featured/gcd(block.columns,block.featured);
  return{columns,ordinarySpan:columns/block.columns,featuredSpan:columns/block.featured};
}
/** Every measure is a model field; neither the editor nor publisher infers layout from arbitrary HTML. */
export function nativeBlockStyles(block: NativeBlock): Record<string,string> {
  const styles:Record<string,string>={};
  if(block.width!==undefined){styles.width=measure(block.width);styles.flex='0 1 auto';}
  if(block.kind==='flow')Object.assign(styles,{'--c9y-direction':block.direction,'--c9y-gap':measure(block.gap),'--c9y-padding':measure(block.padding)});
  if(block.kind==='flow'&&block.mobileDirection)styles['--c9y-mobile-direction']=block.mobileDirection;
  if(block.kind==='flow'&&block.mobileGap!==undefined)styles['--c9y-mobile-gap']=measure(block.mobileGap);
  if(block.kind==='grid'||block.kind==='collection')Object.assign(styles,{'--c9y-columns':String(block.kind==='collection'?nativeCollectionTracks(block).columns:block.columns),'--c9y-column-gap':measure(block.columnGap),'--c9y-row-gap':measure(block.rowGap)});
  if(block.kind==='grid'&&block.mobileColumns!==undefined)styles['--c9y-mobile-columns']=String(block.mobileColumns);
  if(block.kind==='collection'){
    const tracks=nativeCollectionTracks(block);Object.assign(styles,{'--c9y-item-span':String(tracks.ordinarySpan),'--c9y-featured-span':String(tracks.featuredSpan),'--c9y-image-height':measure(block.imageHeight),'--c9y-image-fit':block.fit});
    if(block.featuredImageHeight!==undefined)styles['--c9y-featured-image-height']=measure(block.featuredImageHeight);
    if(block.mobileImageHeight!==undefined)styles['--c9y-mobile-image-height']=measure(block.mobileImageHeight);
  }
  if(block.kind==='image'){
    if(block.height!==undefined)styles['--c9y-image-height']=measure(block.height);
    if(block.mobileHeight!==undefined)styles['--c9y-mobile-image-height']=measure(block.mobileHeight);
    if(block.fit)styles['--c9y-image-fit']=block.fit;
  }
  return styles;
}
const styleText=(styles:Record<string,string>)=>Object.entries(styles).map(([key,value])=>`${key}:${value}`).join(';');
export function renderNativeBlock(block: NativeBlock, options: NativePageRenderOptions = {}): string {
  const attrs=`class="c9y-native-node c9y-native-${block.kind}${block.kind==='link'?' c9y-native-region':''}" data-native-block="${escape(block.id)}"${options.editor?` data-c9y-block="${escape(block.id)}" data-c9y-kind="${block.kind}"`:''}${block.hidden?' hidden':''}${block.locale?` data-native-locale="${block.locale}" lang="${block.locale}"`:''} style="${escape(styleText(nativeBlockStyles(block)))}"`;
  if(block.kind==='flow'){
    const children=block.children.map(child=>renderNativeBlock(child,options)).join('');
    if(block.disclosure)return`<details ${attrs} data-direction="${block.direction}"${block.disclosure.open?' open':''}><summary>${escape(block.disclosure.label)}</summary><div class="c9y-native-disclosure">${children}</div></details>`;
    const tag=block.role??'section';return`<${tag} ${attrs} data-direction="${block.direction}">${children}</${tag}>`;
  }
  if(block.kind==='grid')return`<div ${attrs}>${block.children.map(child=>renderNativeBlock(child,options)).join('')}</div>`;
  if(block.kind==='content')return`<div ${attrs}><div class="c9y-native-region">${renderNativeRegion(block.source,{images:options.images,id:block.id,gaps:block.gaps})}</div></div>`;
  if(block.kind==='image'){
    const image=`<img src="${escape(address(block.src,true))}" alt="${escape(block.alt)}" loading="lazy">`;
    return`<figure ${attrs}>${block.href?`<a href="${escape(address(block.href))}">${image}</a>`:image}</figure>`;
  }
  if(block.kind==='link')return`<div ${attrs}><a class="${block.appearance&&block.appearance!=='plain'?`ds-button${block.appearance==='default'?'':` ds-button--${block.appearance}`}`:'ds-link c9y-native-link'}" href="${escape(address(block.href))}">${escape(block.text)}</a></div>`;
  if(block.kind==='runtime')return`<div ${attrs}>${options.runtime?.(block)??''}</div>`;
  return`<div ${attrs}>${(options.collections?.[block.binding]?.items??[]).map((item,index)=>{
    const tag=item.href?'a':'div',link=item.href?` href="${escape(address(item.href))}"`:'';
    const image=item.image?`<${tag} class="c9y-native-collection-media"${link}><img src="${escape(address(item.image.src,true))}" alt="${escape(item.image.alt)}" loading="lazy"></${tag}>`:'';
    const title=item.href?`<a${link}>${escape(item.title)}</a>`:`<span>${escape(item.title)}</span>`;
    return`<article class="c9y-native-collection-item" data-item-id="${escape(item.id)}"${block.layout==='gallery'&&index<block.featured?' data-featured':''}>${image}<div class="c9y-native-collection-caption">${title}${item.price?`<span class="c9y-native-collection-price">${escape(item.price)}</span>`:''}${options.collectionAction?.(block,item)??''}</div></article>`;
  }).join('')}</div>`;
}
export function renderNativePage(document: NativePageDocument, options: NativePageRenderOptions = {}): string {
  const styles={'--c9y-page-padding':measure(document.layout.padding),'--c9y-page-gap':measure(document.layout.gap),...(document.layout.maxWidth?{width:measure(document.layout.maxWidth)}:{})};
  return`<div class="c9y-native-page"${options.editor?' data-c9y-native-root':''} style="${escape(styleText(styles))}">${document.blocks.map(block=>renderNativeBlock(block,options)).join('')}</div>`;
}
