import { sitePagePatch, type SiteSurfaceDesign } from './consistency-site-design';
import { COMPONENT_MEASURES, componentDefinition, componentMarkup, type NativeComponents } from './consistency-components';
import { nativeIcon, nativeRegionStyles, renderNativeRegion, validateNativeRegion } from './consistency-native-content';
import { TONES, sectionDefinition, SECTION_KINDS, isSlot, type Tone, type FieldDefinition, type SlotDefinition, type MemberDefinition, type KindDefinition } from './consistency-vocabulary';
import pageStyles from './consistency-native-page.css?raw';
import headerStyles from '../DS1/1-root/header.css?raw';
import footerStyles from '../DS1/1-root/footer.css?raw';

export interface NativeBlockBase { id: string; width?: number; hidden?: boolean; locale?: string; marginTop?:number; marginBottom?:number }
export interface NativeFlow extends NativeBlockBase {
  kind: 'flow'; role?: 'section' | 'header' | 'nav' | 'footer' | 'main';
  direction: 'column' | 'row'; mobileDirection?: 'column' | 'row'; gap: number; mobileGap?: number; padding: number; children: NativeBlock[];
  disclosure?: { label: string; open?: boolean };
}
export interface NativeGrid extends NativeBlockBase {
  kind: 'grid'; columns: number; mobileColumns?: number; columnGap: number; rowGap: number; children: NativeBlock[];
}
export interface NativeContent extends NativeBlockBase {
  kind: 'content'; source: string; wrap?:boolean; gaps?: Record<string, number>; binding?: string;
}
/** Where a picture's subject is, as whole percentages from the left and the top; 50 and 50 when absent. */
export interface NativeFocus { x: number; y: number }
export interface NativeImage extends NativeBlockBase {
  kind: 'image'; src: string; alt: string; height?: number; mobileHeight?: number; fit?: 'contain' | 'cover'; focus?: NativeFocus; href?: string;
}
export type NativeButtonFace = 'filled' | 'outlined';
export type NativeButtonSize = 'medium' | 'large';
export interface NativeLink extends NativeBlockBase {
  kind: 'link'; text: string; href: string; appearance?: 'plain' | 'default' | 'primary' | 'secondary'; face?: NativeButtonFace; size?: NativeButtonSize; binding?: string;
}
export interface NativeCollection extends NativeBlockBase {
  kind: 'collection'; binding: string; layout: 'grid' | 'gallery';
  /** Gallery uses this many ordinary cards per row; its first row contains featured cards. */
  columns: number; featured: number; columnGap: number; rowGap: number;
  imageHeight: number; featuredImageHeight?: number; mobileImageHeight?: number; fit: 'contain' | 'cover';
}
export type NativeRuntimeProps = Record<string, string | number | boolean | null>;
export interface NativeRuntime extends NativeBlockBase { kind: 'runtime'; name: string; props: NativeRuntimeProps }
export interface NativeText extends NativeBlockBase { kind: 'text'; text: string; editable?: boolean }
export interface NativeComponent extends NativeBlockBase { kind:'component'; name:string; children:NativeBlock[]; values?:Record<string,string>; words?:Record<string,string>; gap?:number; padding?:number; height?:number; marginTop?:number; marginBottom?:number; columnGap?:number; rowGap?:number; design?:SiteSurfaceDesign }
export type NativePrimitive = NativeText | NativeComponent | NativeFlow | NativeGrid | NativeContent | NativeImage | NativeLink | NativeCollection | NativeRuntime;

/*
 * Sections: typed blocks above the primitives. A section has appearance fields in whole squares and
 * named slots; the renderer expands it to the primitives' markup, so geometry, selection and
 * publication keep one model. No section carries CSS, HTML or a colour: a tone is a name the site's
 * library defines. `shared/consistency-vocabulary.ts` holds every field's range and every slot.
 */
export type { Tone } from './consistency-vocabulary';
export type NativeWords = string;
export interface NativePicture { src: string; alt: string; fit?: 'contain' | 'cover'; focus?: NativeFocus; href?: string }
/** `icon` names one of the library's icons, drawn where the section draws marks (a footer's `follow`). */
export interface NativeAction { text: string; href: string; appearance?: 'plain' | 'default' | 'primary' | 'secondary'; face?: NativeButtonFace; size?: NativeButtonSize; icon?: string }
export interface NativeLine { text: string; href?: string }
export interface NativeLanguage { text: string; href: string; picture?: NativePicture }
export interface NativeRuntimeSlot { name: string; props: NativeRuntimeProps }
export type NativeMeasure = 'reading' | 'wide' | 'full';
export type NativeRoom = 'flush' | 'gap';
export interface NativeHero extends NativeBlockBase {
  kind: 'hero'; height?: number; mobileHeight?: number; fill?: 'fixed' | 'window'; panel?: 'left' | 'centre' | 'right'; panelTone?: Tone; panelWidth?: number; translucent?: boolean; room?: NativeRoom; level?: number; fit?: 'cover' | 'contain';
  picture: NativePicture; logo?: NativePicture; kicker?: NativeWords; title: NativeWords; text?: NativeWords; actions?: NativeAction[];
}
export interface NativeSplit extends NativeBlockBase {
  kind: 'split'; reverse?: boolean; panelTone?: Tone; ratio?: '1:1' | '2:1' | '5:6'; imageHeight?: number; mobileImageHeight?: number; overlap?: number; headingAlign?: 'start' | 'centre';
  picture: NativePicture; heading: NativeWords; text?: NativeWords; actions?: NativeAction[];
}
export interface NativeStatement extends NativeBlockBase {
  kind: 'statement'; measure?: NativeMeasure; panel?: Tone; align?: 'start' | 'centre'; headingAlign?: 'start' | 'centre'; hiddenTitle?: boolean;
  heading?: NativeWords; text: NativeWords; actions?: NativeAction[];
}
export interface NativePanels extends NativeBlockBase { kind: 'panels'; columns?: number; gap?: number; room?: NativeRoom; items: NativeHero[] }
export interface NativeCardItem { label?: NativeWords; title: NativeWords; text?: NativeWords; picture?: NativePicture; action?: NativeAction }
export interface NativeCards extends NativeBlockBase {
  kind: 'cards'; columns?: number; measure?: NativeMeasure; height?: number; mobileHeight?: number; tone?: Tone; variant?: 'filled' | 'outlined'; items: NativeCardItem[];
}
export interface NativeGallery extends NativeBlockBase {
  kind: 'gallery'; columns?: number; measure?: NativeMeasure; height?: number; mobileHeight?: number; strip?: boolean; fit?: 'cover' | 'contain'; pictures: NativePicture[];
}
export interface NativeBentoItem { title: NativeWords; text?: NativeWords; picture?: NativePicture; action?: NativeAction; tone?: Tone }
export interface NativeBento extends NativeBlockBase { kind: 'bento'; columns?: number; measure?: NativeMeasure; rhythm?: 'even' | 'featured'; height?: number; mobileHeight?: number; tones?: Tone[]; titleFace?: 'heading' | 'strong'; items: NativeBentoItem[] }
export interface NativeQuestionItem { question: string; answer: NativeWords }
export interface NativeQuestions extends NativeBlockBase { kind: 'questions'; open?: 'first' | 'none'; measure?: NativeMeasure; heading?: NativeWords; items: NativeQuestionItem[] }
export interface NativeFactItem { term: NativeWords; value: NativeWords }
export interface NativeFacts extends NativeBlockBase { kind: 'facts'; columns?: number; measure?: NativeMeasure; items: NativeFactItem[] }
export interface NativeListItem { name: string; line?: NativeWords; value?: string; date?: string; href?: string }
export interface NativeList extends NativeBlockBase { kind: 'list'; dated?: boolean; grouped?: boolean; measure?: NativeMeasure; items?: NativeListItem[]; collection?: string }
export interface NativeCallToAction extends NativeBlockBase { kind: 'action'; size?: NativeButtonSize; align?: 'start' | 'centre'; measure?: NativeMeasure; button: NativeAction }
export interface NativeHeader extends NativeBlockBase {
  kind: 'header'; sticky?: boolean; fold?: number; logoHeight?: number; mobileLogoHeight?: number; linkStyle?: 'plain' | 'line';
  logo: NativePicture; name?: NativeWords; links: NativeAction[]; languages?: NativeLanguage[]; menu?: NativeRuntimeSlot;
}
export interface NativeFooterColumn { heading?: string; href?: string; width?: number; lines: NativeLine[] }
export interface NativeFooter extends NativeBlockBase {
  kind: 'footer'; columnWidth?: number; line?: boolean;
  brand?: NativePicture; tagline?: NativeWords; columns: NativeFooterColumn[]; legal?: NativeWords;
  policies?: NativeAction[]; languages?: NativeLanguage[]; follow?: NativeAction[]; preferences?: NativeRuntimeSlot;
}
export type NativeSection = NativeHero | NativeSplit | NativeStatement | NativePanels | NativeCards | NativeGallery | NativeBento | NativeQuestions | NativeFacts | NativeList | NativeCallToAction | NativeHeader | NativeFooter;
export type NativeBlock = NativePrimitive | NativeSection;
export const isNativeSection = (block: NativeBlock): block is NativeSection => (SECTION_KINDS as readonly string[]).includes(block.kind);

export interface NativePageDocument {
  schema: 1; kind: 'native-page';
  title?: string; description?: string; lang?: string;
  layout: { mode?: 'document'; overrides?:('gap'|'padding'|'width')[]; tone?:string; maxWidth?: number; padding: number; gap: number };
  blocks: NativeBlock[];
}
export interface NativeCollectionItem {
  id: string; href?: string; title: string; image?: { src: string; alt: string }; price?: string;
}
export interface NativeCollectionData { items: NativeCollectionItem[] }
export interface NativePageContext {
  images: readonly string[]; collections: readonly string[];
  components?: NativeComponents; runtimes: Readonly<Record<string, readonly string[]>>; bindings?: readonly string[];
}
export interface NativePageRenderOptions {
  components?: NativeComponents;
  images?: readonly string[];
  collections?: Readonly<Record<string, NativeCollectionData>>;
  /** Trusted site code renders a registered runtime; HTML is never a document field. */
  runtime?: (block: NativeRuntime) => string;
  collectionAction?: (block: NativeCollection, item: NativeCollectionItem) => string;
  editor?: boolean;
  /** The page's language, for dates; the document's `lang` when a page is rendered. */
  lang?: string;
  /** The address being shown: a link to it is marked `aria-current="page"`, which is never stored. */
  currentPath?: string;
}
const dropImports = (sheet: string) => sheet.replace(/^@import[^;]+;\s*/gm, '');
export const nativePageStyles = nativeRegionStyles + '\n' + dropImports(headerStyles) + '\n' + dropImports(footerStyles) + '\n' + pageStyles;

/** The error's message stays `invalid-native-page`; `reason` says what was refused, for a person or a model. */
export interface NativePageRefusal extends Error { reason?: string }
const invalid = (reason?: string): never => { throw Object.assign(new Error('invalid-native-page'), reason ? { reason } : {}) as NativePageRefusal; };
const record = (value: unknown, reason?: string): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : invalid(reason);
function keys(value: Record<string, unknown>, allowed: readonly string[], path?: string) { const extra = Object.keys(value).find(key => !allowed.includes(key)); if (extra !== undefined) invalid(path ? `${path}: "${extra}" is not a field or slot of this kind` : undefined); }
const text = (value: unknown, maximum: number, reason?: string) => typeof value === 'string' && value.length <= maximum && !value.includes('\0') ? value : invalid(reason);
const integer = (value: unknown, maximum = 2000, minimum = 0, reason?: string) => typeof value === 'number' && Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : invalid(reason);
const choice = <T extends string>(value: unknown, choices: readonly T[], reason?: string): T => typeof value === 'string' && choices.includes(value as T) ? value as T : invalid(reason);
const boolean = (value: unknown, reason?: string) => typeof value === 'boolean' ? value : invalid(reason);
const escape = (value: string) => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
function address(value: unknown, image = false, reason?: string): string {
  const source = text(value, 4000, reason);
  if (!source || /[\u0000- \u007f\\<>]/.test(source) || source.startsWith('//')) return invalid(reason);
  if (/^https?:\/\//i.test(source) || /^\/(?!\/)/.test(source) || !image && (/^(?:mailto:|tel:|#)/i.test(source) || !/^[a-z][a-z0-9+.-]*:/i.test(source))) return source;
  return invalid(reason);
}
const measure = (value: number) => `calc(${value}px * var(--sf,1))`;
const squares = (value: number) => measure(value * 20);

/** Native documents contain only closed blocks. Binding registries belong to the site's trusted code. */
export function validateNativePage(value: unknown, context: NativePageContext): NativePageDocument {
  const source = record(value); keys(source,['schema','kind','title','description','lang','layout','blocks']);
  if (source.schema !== 1 || source.kind !== 'native-page') return invalid();
  const layout = record(source.layout); keys(layout,['mode','overrides','tone','maxWidth','padding','gap']);
  const result: NativePageDocument = { schema:1, kind:'native-page', layout:{padding:integer(layout.padding),gap:integer(layout.gap)}, blocks:[] };
  if (layout.mode !== undefined) { if(layout.mode!=='document')return invalid();result.layout.mode='document'; }
  if(layout.overrides!==undefined){if(!Array.isArray(layout.overrides)||layout.overrides.some(key=>!['gap','padding','width'].includes(key)))return invalid();result.layout.overrides=[...layout.overrides] as ('gap'|'padding'|'width')[];}
  if(layout.tone!==undefined)result.layout.tone=choice(layout.tone,['','ink','sharp-blue','apple-green','pink','orange','yellow','purple']);
  if (layout.maxWidth !== undefined) result.layout.maxWidth=integer(layout.maxWidth,10000,200);
  if (source.title !== undefined) result.title=text(source.title,500);
  if (source.description !== undefined) result.description=text(source.description,2000);
  if (source.lang !== undefined) { result.lang=text(source.lang,20); if(!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(result.lang)) return invalid(); }
  const ids=new Set<string>(), ancestors=new Set<unknown>(); let count=0;
  const common=['id','kind','width','hidden','locale','marginTop','marginBottom'];
  const focus=(value:unknown,path:string):NativeFocus=>{
    const input=record(value,`${path}: a focus is { x, y }, percentages from 0 to 100`);keys(input,['x','y'],path);
    return{x:integer(input.x,100,0,`${path}.x: a whole percentage from 0 to 100`),y:integer(input.y,100,0,`${path}.y: a whole percentage from 0 to 100`)};
  };
  const picture=(value:unknown,path:string):NativePicture=>{
    const input=record(value,`${path}: a picture is { src, alt, fit?, focus?, href? }`);keys(input,['src','alt','fit','focus','href'],path);
    const src=address(input.src,true,`${path}.src: not an image address`);if(src.startsWith('/')&&!context.images.includes(src))return invalid(`${path}.src: "${src}" is not one of the page's images`);
    const result:NativePicture={src,alt:text(input.alt,1000,`${path}.alt: words of at most 1000 characters`)};
    if(input.fit!==undefined)result.fit=choice(input.fit,['contain','cover'] as const,`${path}.fit: cover or contain`);
    if(input.focus!==undefined)result.focus=focus(input.focus,`${path}.focus`);
    if(input.href!==undefined)result.href=address(input.href,false,`${path}.href: not a safe address`);
    return result;
  };
  const face=(value:unknown,path:string)=>choice(value,['filled','outlined'] as const,`${path}: filled or outlined`);
  const size=(value:unknown,path:string)=>choice(value,['medium','large'] as const,`${path}: medium or large`);
  const action=(value:unknown,path:string):NativeAction=>{
    const input=record(value,`${path}: an action is { text, href, appearance?, face?, size?, icon? }`);keys(input,['text','href','appearance','face','size','icon'],path);
    const result:NativeAction={text:text(input.text,1000,`${path}.text: words of at most 1000 characters`),href:address(input.href,false,`${path}.href: not a safe address`)};
    if(input.appearance!==undefined)result.appearance=choice(input.appearance,['plain','default','primary','secondary'] as const,`${path}.appearance: plain, default, primary or secondary`);
    if(input.face!==undefined)result.face=face(input.face,`${path}.face`);
    if(input.size!==undefined)result.size=size(input.size,`${path}.size`);
    if(input.icon!==undefined){const name=text(input.icon,80,`${path}.icon: an icon's name`);if(!nativeIcon(name))return invalid(`${path}.icon: "${name}" is not one of the library's icons`);result.icon=name;}
    return result;
  };
  const runtimeSlot=(value:unknown,path:string):NativeRuntimeSlot=>{
    const input=record(value,`${path}: a runtime is { name, props }`);keys(input,['name','props'],path);
    const name=text(input.name,80,`${path}.name`),allowed=context.runtimes[name];if(!allowed)return invalid(`${path}.name: "${name}" is not a registered runtime`);
    const props=record(input.props,`${path}.props: a record`);keys(props,allowed,`${path}.props`);const clean:NativeRuntimeProps={};
    for(const[key,item]of Object.entries(props)){
      if(typeof item==='string')clean[key]=text(item,4000,`${path}.props.${key}`);else if(typeof item==='boolean'||item===null)clean[key]=item;
      else if(typeof item==='number'&&Number.isFinite(item)&&Math.abs(item)<=1e9)clean[key]=item;else return invalid(`${path}.props.${key}: a string, number, boolean or null`);
    }
    return{name,props:clean};
  };
  const field=(value:unknown,definition:FieldDefinition,path:string):unknown=>{
    const range=`${definition.min} to ${definition.max}`;
    switch(definition.type){
      case 'squares':{const result=integer(value,definition.max,definition.min,`${path}: ${String(value)} is not a whole number of squares from ${range}`);if(definition.step&&(result-definition.min!)%definition.step)return invalid(`${path}: ${result} is not on the step of ${definition.step} squares from ${definition.min}`);return result;}
      case 'pixels':case 'integer':return integer(value,definition.max,definition.min,`${path}: ${String(value)} is not a whole number from ${range}`);
      case 'boolean':return boolean(value,`${path}: true or false`);
      case 'choice':return choice(value,definition.choices!,`${path}: "${String(value)}" is not one of ${definition.choices!.join(', ')}`);
      case 'tone':return choice(value,TONES,`${path}: "${String(value)}" is not a tone (${TONES.join(', ')})`);
      case 'tones':{if(!Array.isArray(value)||value.length<(definition.min??1)||value.length>(definition.max??TONES.length))return invalid(`${path}: a list of ${definition.min??1} to ${definition.max??TONES.length} tones`);return value.map((item,index)=>choice(item,TONES,`${path}[${index}]: "${String(item)}" is not a tone (${TONES.join(', ')})`));}
      case 'text':return text(value,definition.max??1000,`${path}: words of at most ${definition.max??1000} characters`);
      case 'date':{const day=text(value,10,`${path}: a day as YYYY-MM-DD`);if(!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(day)||Number.isNaN(Date.parse(day)))return invalid(`${path}: "${day}" is not a day as YYYY-MM-DD`);return day;}
      case 'address':return address(value,false,`${path}: not a safe address`);
      default:return invalid(`${path}: this field cannot be set on a section`);
    }
  };
  const members=(value:unknown,definitions:Record<string,MemberDefinition>,path:string,depth:number):Record<string,unknown>=>{
    const input=record(value,`${path}: a record`);keys(input,Object.keys(definitions),path);const result:Record<string,unknown>={};
    for(const[name,definition]of Object.entries(definitions)){
      const item=input[name];
      if(item===undefined){if(definition.required)return invalid(`${path}.${name} is required`);continue;}
      result[name]=isSlot(definition)?slot(item,definition,`${path}.${name}`,depth):field(item,definition,`${path}.${name}`);
    }
    return result;
  };
  const list=(value:unknown,definition:SlotDefinition,path:string):unknown[]=>{
    if(!Array.isArray(value))return invalid(`${path}: a list`);
    if(definition.min!==undefined&&value.length<definition.min)return invalid(`${path}: at least ${definition.min}`);
    if(value.length>(definition.max??100))return invalid(`${path}: at most ${definition.max??100}`);
    return value;
  };
  const slot=(value:unknown,definition:SlotDefinition,path:string,depth:number):unknown=>{
    switch(definition.type){
      case 'words':{const source=text(value,24000,`${path}: Markdown of at most 24000 characters`);try{validateNativeRegion(source,context.images);}catch{return invalid(`${path}: the Markdown has a picture, link or atom the page cannot publish`);}return source;}
      case 'picture':return picture(value,path);
      case 'action':return action(value,path);
      case 'actions':return list(value,definition,path).map((item,index)=>action(item,`${path}[${index}]`));
      case 'pictures':return list(value,definition,path).map((item,index)=>picture(item,`${path}[${index}]`));
      case 'links':return list(value,definition,path).map((item,index)=>{const input=record(item,`${path}[${index}]: a line is { text, href? }`);keys(input,['text','href'],`${path}[${index}]`);const line:NativeLine={text:text(input.text,500,`${path}[${index}].text`)};if(input.href!==undefined)line.href=address(input.href,false,`${path}[${index}].href: not a safe address`);return line;});
      case 'languages':return list(value,definition,path).map((item,index)=>{const input=record(item,`${path}[${index}]: a language is { text, href, picture? }`);keys(input,['text','href','picture'],`${path}[${index}]`);const language:NativeLanguage={text:text(input.text,200,`${path}[${index}].text`),href:address(input.href,false,`${path}[${index}].href: not a safe address`)};if(input.picture!==undefined)language.picture=picture(input.picture,`${path}[${index}].picture`);return language;});
      case 'runtime':return runtimeSlot(value,path);
      case 'collection':{const binding=text(value,200,`${path}: a collection's name`);if(!context.collections.includes(binding))return invalid(`${path}: "${binding}" is not a registered collection`);return binding;}
      case 'items':return list(value,definition,path).map((item,index)=>members(item,definition.item!,`${path}[${index}]`,depth));
      case 'heroes':return list(value,definition,path).map((item,index)=>{const block=node(item,depth+1);if(block.kind!=='hero')return invalid(`${path}[${index}]: only a hero stands in panels, not a ${block.kind}`);return block;});
    }
  };
  const section=(input:Record<string,unknown>,definition:KindDefinition,base:NativeBlockBase,depth:number):NativeSection=>{
    const path=`${definition.kind} ${base.id}`;
    keys(input,[...common,...Object.keys(definition.fields),...Object.keys(definition.slots)],path);
    const block:Record<string,unknown>={...base,kind:definition.kind};
    for(const[name,fieldDefinition]of Object.entries(definition.fields))if(input[name]!==undefined)block[name]=field(input[name],fieldDefinition,`${path}.${name}`);
    for(const[name,slotDefinition]of Object.entries(definition.slots)){
      if(input[name]===undefined){if(slotDefinition.required)return invalid(`${path}.${name} is required`);continue;}
      block[name]=slot(input[name],slotDefinition,`${path}.${name}`,depth);
    }
    if(definition.oneOf&&definition.oneOf.filter(name=>input[name]!==undefined).length!==1)return invalid(`${path}: exactly one of ${definition.oneOf.join(' or ')}`);
    return block as unknown as NativeSection;
  };
  const node=(value:unknown,depth:number):NativeBlock=>{
    if(depth>(context.components?40:12))return invalid();
    const input=record(value); if(++count>(context.components?6000:500)||ancestors.has(input))return invalid(); ancestors.add(input);
    const id=text(input.id,80);if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(id)||ids.has(id))return invalid(ids.has(id)?`id "${id}" is used twice`:undefined);ids.add(id);
    const kind=choice(input.kind,['text','component','flow','grid','content','image','link','collection','runtime',...SECTION_KINDS] as const,`"${String(input.kind)}" is not a block kind`);
    const base:NativeBlockBase={id};
    for(const key of ['marginTop','marginBottom'] as const)if(input[key]!==undefined)base[key]=integer(input[key]);
    if(input.width!==undefined)base.width=integer(input.width,10000,20);
    if(input.hidden!==undefined)base.hidden=boolean(input.hidden);
    if(input.locale!==undefined){base.locale=text(input.locale,20);if(!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(base.locale))return invalid();}
    let block:NativeBlock;
    if(kind==='text'){
      keys(input,[...common,'text','editable']);block={...base,kind,text:text(input.text,24000)};if(input.editable!==undefined)block.editable=boolean(input.editable);
    }else if(kind==='component'){
      keys(input,[...common,'name','children','values','words','design',...COMPONENT_MEASURES]);
      const name=text(input.name,160),definition=componentDefinition(name,context.components);if(!definition)return invalid(`unregistered component: ${name}`);
      const values:Record<string,string>={},words:Record<string,string>={};
      if(input.values!==undefined)for(const[key,value]of Object.entries(record(input.values))){if(!definition.fields.includes(key))return invalid();const clean=text(value,4000);if(['href','src','poster'].includes(key)&&clean){address(clean,key!=='href');if(key!=='href'&&clean.startsWith('/')&&!context.images.includes(clean))return invalid();}values[key]=clean;}
      if(input.words!==undefined)for(const[key,value]of Object.entries(record(input.words))){if(!/^[a-zA-Z0-9_-]+:[0-9]{1,4}$/.test(key))return invalid();words[key]=text(value,24000);}
      block={...base,kind,name,children:nodes(input.children,depth+1),...(input.values!==undefined?{values}:{}),...(input.words!==undefined?{words}:{})};
      if(input.design!==undefined){const d=record(input.design);keys(d,['tone','variant','color','appearance','action','gaps']);const design:SiteSurfaceDesign={};for(const key of ['tone','color'] as const)if(d[key]!==undefined)design[key]=choice(d[key],['','ink','sharp-blue','apple-green','pink','orange','yellow','purple']);if(d.variant!==undefined)design.variant=choice(d.variant,['filled','outlined'] as const);if(d.appearance!==undefined)design.appearance=choice(d.appearance,['plain','primary','secondary'] as const);if(d.action!==undefined){if(d.action===null)design.action=null;else{const a=record(d.action);keys(a,['kind','target']);design.action={kind:choice(a.kind,['link','page']),target:address(a.target)};}}if(d.gaps!==undefined){design.gaps={};for(const[key,value]of Object.entries(record(d.gaps))){if(!['label','title','body','footer','figure','media'].includes(key))return invalid();design.gaps[key]=integer(value);}}block.design=design;}
      for(const key of COMPONENT_MEASURES)if(input[key]!==undefined)block[key]=integer(input[key]);
    }else if(kind==='flow'){
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
      keys(input,[...common,'source','gaps','binding','wrap']);
      const content=text(input.source,24000),gaps=input.gaps===undefined?undefined:record(input.gaps) as Record<string,number>;
      validateNativeRegion(content,context.images,gaps,id);
      block={...base,kind,source:content,...(gaps?{gaps:{...gaps}}:{})};
      if(input.wrap!==undefined&&(block.kind==='content'))block.wrap=boolean(input.wrap);
      if(input.binding!==undefined){const binding=text(input.binding,200);if(!context.bindings?.includes(binding))return invalid();block.binding=binding;}
    }else if(kind==='image'){
      keys(input,[...common,'src','alt','height','mobileHeight','fit','focus','href']);
      const src=address(input.src,true);if(src.startsWith('/')&&!context.images.includes(src))return invalid();
      block={...base,kind,src,alt:text(input.alt,1000)};
      if(input.height!==undefined)block.height=integer(input.height,2000,20);
      if(input.mobileHeight!==undefined)block.mobileHeight=integer(input.mobileHeight,2000,20);
      if(input.fit!==undefined)block.fit=choice(input.fit,['contain','cover'] as const);
      if(input.focus!==undefined)block.focus=focus(input.focus,`image ${id}.focus`);
      if(input.href!==undefined)block.href=address(input.href);
    }else if(kind==='link'){
      keys(input,[...common,'text','href','appearance','face','size','binding']);block={...base,kind,text:text(input.text,1000),href:address(input.href)};
      if(input.appearance!==undefined)block.appearance=choice(input.appearance,['plain','default','primary','secondary'] as const);
      if(input.face!==undefined)block.face=face(input.face,`link ${id}.face`);
      if(input.size!==undefined)block.size=size(input.size,`link ${id}.size`);
      if(input.binding!==undefined){const binding=text(input.binding,200);if(!context.bindings?.includes(binding))return invalid();block.binding=binding;}
    }else if(kind==='collection'){
      keys(input,[...common,'binding','layout','columns','featured','columnGap','rowGap','imageHeight','featuredImageHeight','mobileImageHeight','fit']);
      const binding=text(input.binding,200);if(!context.collections.includes(binding))return invalid();
      block={...base,kind,binding,layout:choice(input.layout,['grid','gallery']),columns:integer(input.columns,6,1),featured:integer(input.featured,6),columnGap:integer(input.columnGap),rowGap:integer(input.rowGap),imageHeight:integer(input.imageHeight,2000,20),fit:choice(input.fit,['contain','cover'])};
      if(input.featuredImageHeight!==undefined)block.featuredImageHeight=integer(input.featuredImageHeight,2000,20);
      if(input.mobileImageHeight!==undefined)block.mobileImageHeight=integer(input.mobileImageHeight,2000,20);
    }else if(kind==='runtime'){
      keys(input,[...common,'name','props']);const name=text(input.name,80),allowed=context.runtimes[name];if(!allowed)return invalid();
      const props=record(input.props);keys(props,allowed);const clean:NativeRuntimeProps={};
      for(const[key,value]of Object.entries(props)){
        if(typeof value==='string')clean[key]=text(value,4000);else if(typeof value==='boolean'||value===null)clean[key]=value;
        else if(typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=1e9)clean[key]=value;else return invalid();
      }
      block={...base,kind,name,props:clean};
    }else{
      block=section(input,sectionDefinition(kind)!,base,depth);
    }
    ancestors.delete(input);return block;
  };
  const nodes=(values:unknown, depth:number):NativeBlock[]=>{
    if(!Array.isArray(values)||depth>(context.components?40:12)||ancestors.has(values))return invalid();
    ancestors.add(values);
    const blocks=values.map(value=>node(value,depth));
    ancestors.delete(values);return blocks;
  };
  result.blocks=nodes(source.blocks,0);
  if(JSON.stringify(result).length>(context.components?750000:60000))return invalid('the document is over 60000 characters');
  return result;
}

export function nativeCollectionTracks(block: NativeCollection): { columns: number; ordinarySpan: number; featuredSpan: number } {
  if(block.layout!=='gallery'||!block.featured)return{columns:block.columns,ordinarySpan:1,featuredSpan:1};
  const gcd=(a:number,b:number):number=>b?gcd(b,a%b):a;
  const columns=block.columns*block.featured/gcd(block.columns,block.featured);
  return{columns,ordinarySpan:columns/block.columns,featuredSpan:columns/block.featured};
}
/** A section field's value, or the vocabulary's default. */
export function sectionField<T = unknown>(block: NativeSection, name: string): T {
  const value=(block as unknown as Record<string,unknown>)[name];
  return (value===undefined?sectionDefinition(block.kind)?.fields[name]?.default:value) as T;
}
/** Every measure is a model field; neither the editor nor publisher infers layout from arbitrary HTML. */
export function nativeBlockStyles(block: NativeBlock): Record<string,string> {
  const styles:Record<string,string>={};
  for(const key of ['marginTop','marginBottom'] as const)if(block[key]!==undefined)styles[key==='marginTop'?'margin-top':'margin-bottom']=measure(block[key]!);
  if(block.width!==undefined){styles.width=measure(block.width);styles.flex='0 1 auto';}
  if(block.kind==='component'){if(block.padding!==undefined)styles['--c9y-component-padding']=measure(block.padding);if(block.gap!==undefined)styles['--c9y-component-gap']=measure(block.gap);if(block.height!==undefined)for(const key of ['--ds-card-height','--ds-carousel-height'])styles[key]=measure(block.height)+'!important';if(block.width!==undefined)styles['--ds-card-width']=measure(block.width)+'!important';}
  if(block.kind==='component')for(const key of COMPONENT_MEASURES)if(block[key]!==undefined)styles[key.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())]=measure(block[key]!)+'!important';
  if(block.kind==='flow')Object.assign(styles,{'--c9y-direction':block.direction,'--c9y-mobile-direction':block.mobileDirection??'column','--c9y-gap':measure(block.gap),'--c9y-mobile-gap':measure(block.mobileGap??block.gap),'--c9y-padding':measure(block.padding)});
  if(block.kind==='grid'||block.kind==='collection')Object.assign(styles,{'--c9y-columns':String(block.kind==='collection'?nativeCollectionTracks(block).columns:block.columns),'--c9y-column-gap':measure(block.columnGap),'--c9y-row-gap':measure(block.rowGap)});
  if(block.kind==='grid')styles['--c9y-mobile-columns']=String(block.mobileColumns??1);
  if(block.kind==='collection'){
    const tracks=nativeCollectionTracks(block);Object.assign(styles,{'--c9y-item-span':String(tracks.ordinarySpan),'--c9y-featured-span':String(tracks.featuredSpan),'--c9y-image-height':measure(block.imageHeight),'--c9y-image-fit':block.fit});
    styles['--c9y-featured-image-height']=measure(block.featuredImageHeight??block.imageHeight);
    styles['--c9y-mobile-image-height']=measure(block.mobileImageHeight??block.imageHeight);
  }
  if(block.kind==='image'){
    styles['--c9y-image-height']=block.height===undefined?'auto':measure(block.height);
    styles['--c9y-mobile-image-height']=block.mobileHeight===undefined?styles['--c9y-image-height']:measure(block.mobileHeight);
    styles['--c9y-image-fit']=block.fit??'contain';
    if(block.focus)styles['--c9y-image-focus']=`${block.focus.x}% ${block.focus.y}%`;
  }
  if(isNativeSection(block))Object.assign(styles,nativeSectionStyles(block));
  return styles;
}
/** The sections whose items stand in a column of a chosen measure: reading 32 squares, wide 62, full the page. */
const MEASURED_KINDS: readonly string[] = ['cards','gallery','bento','questions','facts','list','action'];
const measureWidth=(value:NativeMeasure)=>value==='reading'?squares(32):value==='wide'?squares(62):'none';
/** A section's fields as custom properties, read by consistency-native-page.css; tones travel as `data-tone` names. */
export function nativeSectionStyles(block: NativeSection): Record<string,string> {
  const styles:Record<string,string>={};
  const field=<T,>(name:string)=>sectionField<T>(block,name);
  const given=<T,>(name:string)=>(block as unknown as Record<string,T|undefined>)[name];
  if(block.kind==='hero'){
    const fill=(height:number)=>field<string>('fill')==='window'?`min(${squares(height)},80svh)`:squares(height);
    styles['--c9y-hero-height']=fill(field<number>('height'));styles['--c9y-hero-mobile-height']=fill(given<number>('mobileHeight')??field<number>('height'));styles['--c9y-panel-width']=squares(field<number>('panelWidth'));
  }
  if(block.kind==='split'){
    const ratio=field<string>('ratio'),reverse=field<boolean>('reverse');
    const [picture,words]=ratio==='2:1'?[2,1]:ratio==='5:6'?[5,6]:[1,1];
    styles['--c9y-split-columns']=reverse?`minmax(0,${words}fr) minmax(0,${picture}fr)`:`minmax(0,${picture}fr) minmax(0,${words}fr)`;
    styles['--c9y-split-image-height']=squares(field<number>('imageHeight'));styles['--c9y-split-mobile-image-height']=squares(given<number>('mobileImageHeight')??field<number>('imageHeight'));styles['--c9y-split-overlap']=squares(field<number>('overlap'));
  }
  if(block.kind==='statement'){const measure=field<NativeMeasure>('measure');styles['--c9y-statement-width']=measure==='wide'?squares(50):measure==='reading'?squares(32):'none';}
  if(block.kind==='panels'){styles['--c9y-columns']=String(field<number>('columns'));styles['--c9y-gap']=squares(field<number>('gap'));}
  if(block.kind==='cards'){styles['--c9y-columns']=String(field<number>('columns'));styles['--c9y-card-height']=squares(field<number>('height'));styles['--c9y-card-mobile-height']=squares(given<number>('mobileHeight')??field<number>('height'));}
  if(block.kind==='gallery'){styles['--c9y-columns']=String(field<number>('columns'));styles['--c9y-gallery-height']=squares(field<number>('height'));styles['--c9y-gallery-mobile-height']=squares(given<number>('mobileHeight')??field<number>('height'));}
  if(block.kind==='bento'){styles['--c9y-columns']=String(field<number>('columns'));styles['--c9y-bento-height']=squares(field<number>('height'));styles['--c9y-bento-mobile-height']=squares(given<number>('mobileHeight')??field<number>('height'));}
  if(block.kind==='facts')styles['--c9y-columns']=String(field<number>('columns'));
  if(MEASURED_KINDS.includes(block.kind))styles['--c9y-measure']=measureWidth(field<NativeMeasure>('measure'));
  if(block.kind==='header'){styles['--c9y-logo-height']=squares(field<number>('logoHeight'));styles['--c9y-mobile-logo-height']=squares(given<number>('mobileLogoHeight')??field<number>('logoHeight'));}
  if(block.kind==='footer'){styles['--ds-footer-column-width']=String(field<number>('columnWidth'));if(!field<boolean>('line'))styles['--ds-footer-line']='transparent';}
  return styles;
}
/** The attributes a section root carries besides its styles: names, never values the stylesheet could not check. */
export function nativeSectionAttributes(block: NativeSection): Record<string,string> {
  const field=<T,>(name:string)=>sectionField<T>(block,name);
  const attrs:Record<string,string>={};
  if(block.kind==='hero'){attrs['data-panel']=field<string>('panel');attrs['data-room']=field<string>('room');if(field<boolean>('translucent'))attrs['data-translucent']='';}
  if(block.kind==='split'){if(field<boolean>('reverse'))attrs['data-reverse']='';attrs['data-heading-align']=field<string>('headingAlign');}
  if(block.kind==='statement'){attrs['data-align']=field<string>('align');attrs['data-heading-align']=field<string>('headingAlign');if(block.panel)attrs['data-tone']=block.panel;if(field<boolean>('hiddenTitle'))attrs['data-hidden-title']='';}
  if(block.kind==='panels')attrs['data-room']=field<string>('room');
  if(block.kind==='cards'){attrs['data-variant']=field<string>('variant');attrs['data-tone']=field<string>('tone');}
  if(block.kind==='gallery'&&field<boolean>('strip'))attrs['data-strip']='';
  if(block.kind==='bento')attrs['data-rhythm']=field<string>('rhythm');
  if(block.kind==='list'){if(field<boolean>('dated'))attrs['data-dated']='';if(field<boolean>('grouped'))attrs['data-grouped']='';}
  if(block.kind==='action'){attrs['data-size']=field<string>('size');attrs['data-align']=field<string>('align');}
  if(MEASURED_KINDS.includes(block.kind))attrs['data-measure']=field<string>('measure');
  if(block.kind==='header'){attrs['data-fold']=String(field<number>('fold'));attrs['data-links']=field<string>('linkStyle');}
  return attrs;
}
const styleText=(styles:Record<string,string>)=>Object.entries(styles).map(([key,value])=>`${key}:${value}`).join(';');
const attrText=(attrs:Record<string,string>)=>Object.entries(attrs).map(([key,value])=>value===''?` ${key}`:` ${key}="${escape(value)}"`).join('');

/** Where an expanded primitive stands in its section, so the editor maps presses and handles to fields and slots. */
export interface NativeMark { slot?: string; item?: number; classes?: string; attrs?: Record<string,string> }
type Marks = ReadonlyMap<string,NativeMark>;
const markText=(mark?:NativeMark)=>mark?`${mark.slot!==undefined?` data-slot="${escape(mark.slot)}"`:''}${mark.item!==undefined?` data-item="${mark.item}"`:''}${mark.attrs?attrText(mark.attrs):''}`:'';
const markClasses=(mark?:NativeMark)=>mark?.classes?` ${mark.classes}`:'';
const current=(options:NativePageRenderOptions,href:string)=>options.currentPath!==undefined&&href===options.currentPath?' aria-current="page"':'';

export function renderNativeBlock(block: NativeBlock, options: NativePageRenderOptions = {}, mark?: NativeMark): string { return render(block,options,mark); }
function render(block: NativeBlock, options: NativePageRenderOptions, mark?: NativeMark, marks?: Marks): string {
  if(isNativeSection(block))return renderNativeSection(block,options,mark);
  const child=(value:NativeBlock)=>render(value,options,marks?.get(value.id),marks);
  if(block.kind==='text')return options.editor&&block.editable!==false&&block.text.trim()?`<span data-native-block="${escape(block.id)}" data-c9y-block="${escape(block.id)}" data-c9y-kind="text" class="c9y-native-text">${escape(block.text)}</span>`:escape(block.text);
  if(block.kind==='component')return componentMarkup(block.id,block.name,block.children.map(child).join(''),block.values??{},block.words??{},nativeBlockStyles(block),options.components??{},!!options.editor,block.hidden,block.design);
  const attrs=`class="c9y-native-node c9y-native-${block.kind}${block.kind==='link'?' c9y-native-region':''}${markClasses(mark)}" data-native-block="${escape(block.id)}"${options.editor?` data-c9y-block="${escape(block.id)}" data-c9y-kind="${block.kind}"`:''}${block.hidden?' hidden':''}${block.locale?` data-native-locale="${block.locale}" lang="${block.locale}"`:''}${markText(mark)} style="${escape(styleText(nativeBlockStyles(block)))}"`;
  if(block.kind==='flow'){
    const children=block.children.map(child).join('');
    if(block.disclosure)return`<details ${attrs} data-direction="${block.direction}"${block.disclosure.open?' open':''}><summary>${escape(block.disclosure.label)}</summary><div class="c9y-native-disclosure">${children}</div></details>`;
    const tag=block.role??'section';return`<${tag} ${attrs} data-direction="${block.direction}">${children}</${tag}>`;
  }
  if(block.kind==='grid')return`<div ${attrs}>${block.children.map(child).join('')}</div>`;
  if(block.kind==='content')return`<div ${attrs}${block.wrap===false?' data-native-nowrap':''}><div class="c9y-native-region">${renderNativeRegion(block.source,{images:options.images,id:block.id,gaps:block.gaps})}</div></div>`;
  if(block.kind==='image'){
    const image=`<img src="${escape(address(block.src,true))}" alt="${escape(block.alt)}" loading="lazy">`;
    return`<figure ${attrs}>${block.href?`<a href="${escape(address(block.href))}"${current(options,block.href)}>${image}</a>`:image}</figure>`;
  }
  // A button's face and size travel as the library's `data-face` and `data-size`, written only when the link names them.
  if(block.kind==='link')return`<div ${attrs}><a class="${block.appearance&&block.appearance!=='plain'?`ds-button${block.appearance==='default'?'':` ds-button--${block.appearance}`}`:'ds-link c9y-native-link'}"${block.face?` data-face="${block.face}"`:''}${block.size?` data-size="${block.size}"`:''} href="${escape(address(block.href))}"${current(options,block.href)}>${escape(block.text)}</a></div>`;
  if(block.kind==='runtime')return`<div ${attrs}>${options.runtime?.(block)??''}</div>`;
  return`<div ${attrs}>${(options.collections?.[block.binding]?.items??[]).map((item,index)=>{
    const tag=item.href?'a':'div',link=item.href?` href="${escape(address(item.href))}"`:'';
    const image=item.image?`<${tag} class="c9y-native-collection-media"${link}><img src="${escape(address(item.image.src,true))}" alt="${escape(item.image.alt)}" loading="lazy"></${tag}>`:'';
    const title=item.href?`<a${link}>${escape(item.title)}</a>`:`<span>${escape(item.title)}</span>`;
    return`<article class="c9y-native-collection-item" data-item-id="${escape(item.id)}"${block.layout==='gallery'&&index<block.featured?' data-featured':''}>${image}<div class="c9y-native-collection-caption">${title}${item.price?`<span class="c9y-native-collection-price">${escape(item.price)}</span>`:''}${options.collectionAction?.(block,item)??''}</div></article>`;
  }).join('')}</div>`;
}

/*
 * Expansion: a section is drawn as the primitives it stands for. The section root carries
 * `c9y-native-section` and `data-section="<kind>"`; each slot's element `data-slot="<name>"` and, in a
 * list of items, `data-item="<index>"`; the primitives inside keep their classes, with ids derived as
 * `<sectionId>.<slot>[.<index>[.<member>]]`, so the editor's geometry code sees stable identities.
 */
const sub=(id:string,...parts:(string|number)[])=>[id,...parts].join('.');
const heading=(source:string,level:number)=>/^\s*#{1,6}\s/.test(source)?source:`${'#'.repeat(level)} ${source}`;
const wordsBlock=(id:string,source:string):NativeContent=>({id,kind:'content',source});
const pictureBlock=(id:string,picture:NativePicture,extra:Partial<NativeImage>={}):NativeImage=>({id,kind:'image',src:picture.src,alt:picture.alt,...(picture.fit?{fit:picture.fit}:{}),...(picture.focus?{focus:picture.focus}:{}),...(picture.href?{href:picture.href}:{}),...extra});
const actionBlock=(id:string,action:NativeAction,appearance?:NativeLink['appearance']):NativeLink=>({id,kind:'link',text:action.text,href:action.href,...(action.appearance??appearance?{appearance:action.appearance??appearance}:{}),...(action.face?{face:action.face}:{}),...(action.size?{size:action.size}:{})});
/** A title as a strong line rather than a heading, unless it is already a heading of its own. */
const strongLine=(source:string)=>/^\s*#{1,6}\s/.test(source)?source:`**${source}**`;
const flowBlock=(id:string,direction:'row'|'column',gap:number,children:NativeBlock[],extra:Partial<NativeFlow>={}):NativeFlow=>({id,kind:'flow',direction,gap,padding:0,children,...extra});
const runtimeBlock=(id:string,slot:NativeRuntimeSlot):NativeRuntime=>({id,kind:'runtime',name:slot.name,props:slot.props});

/** The primitives a section expands to, with each one's place in the section; the editor and the renderer read the same expansion. */
export function expandNativeSection(block: NativeSection): { children: NativeBlock[]; marks: ReadonlyMap<string, NativeMark> } {
  const id=block.id,marks=new Map<string,NativeMark>();
  const put=<T extends NativeBlock>(value:T,mark:NativeMark):T=>{marks.set(value.id,mark);return value;};
  const field=<T,>(name:string)=>sectionField<T>(block,name);
  const at=(slot:string,item?:number)=>item===undefined?sub(id,slot):sub(id,'items',item,slot);
  const words=(slot:string,source:string|undefined,level?:number,item?:number,classes?:string)=>source===undefined?[]:[put(wordsBlock(at(slot,item),level?heading(source,level):source),{slot,item,classes})];
  const picture=(slot:string,value:NativePicture|undefined,extra:Partial<NativeImage>={},item?:number,classes?:string)=>value?[put(pictureBlock(at(slot,item),value,extra),{slot,item,classes})]:[];
  const action=(slot:string,value:NativeAction|undefined,appearance:NativeLink['appearance'],item?:number)=>value?[put(actionBlock(at(slot,item),value,appearance),{slot,item})]:[];
  const actions=(slot:string,values:NativeAction[]|undefined,appearance:NativeLink['appearance'],item?:number,classes?:string)=>values?.length?[put(flowBlock(at(slot,item),'row',10,values.map((value,index)=>put(actionBlock(sub(at(slot,item),index),value,index?undefined:appearance),{slot,item:index})),{mobileDirection:'row'}),{slot,item,classes})]:[];
  const panel=(children:NativeBlock[],padding:number)=>put(flowBlock(sub(id,'panel'),'column',20,children,{padding}),{slot:'panel',classes:'c9y-native-toned',attrs:{'data-tone':field<string>('panelTone')}});
  switch(block.kind){
    case 'hero':return{marks,children:[
      ...picture('picture',block.picture,{fit:block.picture.fit??field<'cover'|'contain'>('fit')}),
      panel([...picture('logo',block.logo,{height:60,fit:'contain'}),...words('kicker',block.kicker),...words('title',block.title,field<number>('level')),...words('text',block.text),...actions('actions',block.actions,'primary')],20),
    ]};
    case 'split':return{marks,children:[
      ...picture('picture',block.picture,{fit:block.picture.fit??'cover'}),
      panel([...words('heading',block.heading,2),...words('text',block.text),...actions('actions',block.actions,'default')],40),
    ]};
    case 'statement':return{marks,children:[...words('heading',block.heading,2),...words('text',block.text),...actions('actions',block.actions,'default')]};
    case 'panels':return{marks,children:block.items.map((hero,index)=>put(hero,{slot:'items',item:index}))};
    case 'cards':return{marks,children:block.items.map((item,index)=>put(flowBlock(sub(id,'items',index),'column',10,[
      ...words('label',item.label,undefined,index),...words('title',item.title,3,index),...words('text',item.text,undefined,index),...action('action',item.action,'plain',index),...picture('picture',item.picture,{fit:'cover'},index),
    ],{padding:20}),{slot:'items',item:index,classes:`c9y-native-card${field<string>('variant')==='filled'?' c9y-native-toned':''}`}))};
    case 'gallery':return{marks,children:block.pictures.map((value,index)=>put(pictureBlock(sub(id,'pictures',index),value,{fit:value.fit??field<'cover'|'contain'>('fit')}),{slot:'pictures',item:index}))};
    case 'bento':{const tones=field<Tone[]>('tones'),strong=field<string>('titleFace')==='strong';return{marks,children:block.items.map((item,index)=>put(flowBlock(sub(id,'items',index),'column',10,[
      ...picture('picture',item.picture,{fit:'cover'},index),...(strong?words('title',strongLine(item.title),undefined,index):words('title',item.title,3,index)),...words('text',item.text,undefined,index),...action('action',item.action,'plain',index),
    ]),{slot:'items',item:index,classes:'c9y-native-tile c9y-native-toned',attrs:{'data-tone':item.tone??tones[index%tones.length]!}}))};}
    case 'questions':return{marks,children:[...words('heading',block.heading,2),...block.items.map((item,index)=>put(flowBlock(sub(id,'items',index),'column',20,words('answer',item.answer,undefined,index),{disclosure:{label:item.question,open:field<string>('open')==='first'&&index===0}}),{slot:'items',item:index}))]};
    case 'facts':return{marks,children:block.items.map((item,index)=>put(flowBlock(sub(id,'items',index),'row',20,[...words('term',item.term,undefined,index),...words('value',item.value,undefined,index)],{mobileDirection:'column'}),{slot:'items',item:index}))};
    case 'list':return{marks,children:[]};
    case 'action':return{marks,children:action('button',{...block.button,size:block.button.size??field<NativeButtonSize>('size')},'primary')};
    case 'header':return{marks,children:[
      put(flowBlock(sub(id,'brand'),'row',4,[...picture('logo',block.logo,{fit:'contain'}),...words('name',block.name)],{mobileDirection:'row'}),{slot:'brand',classes:'ds-header__brand'}),
      put(flowBlock(sub(id,'links'),'row',20,block.links.map((link,index)=>put(actionBlock(sub(id,'links',index),link,'plain'),{slot:'links',item:index})),{role:'nav',mobileDirection:'row'}),{slot:'links',classes:'ds-header__nav'}),
      ...(block.languages?.length?[put(flowBlock(sub(id,'languages'),'row',10,block.languages.map((language,index)=>put(language.picture?pictureBlock(sub(id,'languages',index),{...language.picture,alt:language.picture.alt||language.text,href:language.href},{fit:'contain'}):actionBlock(sub(id,'languages',index),language,'plain'),{slot:'languages',item:index})),{mobileDirection:'row'}),{slot:'languages',classes:'ds-header__actions'})]:[]),
      ...(block.menu?[put(runtimeBlock(sub(id,'menu'),block.menu),{slot:'menu',classes:'ds-header__toggle'})]:[]),
    ]};
    case 'footer':return{marks,children:[
      ...(block.brand||block.tagline?[put(flowBlock(sub(id,'brand'),'column',0,[...picture('mark',block.brand,{fit:'contain'},undefined,'ds-footer__mark'),...words('tagline',block.tagline,undefined,undefined,'ds-footer__tagline')]),{slot:'brand',classes:'ds-footer__brand'})]:[]),
      ...words('legal',block.legal,undefined,undefined,'ds-footer__legal'),
      ...(block.policies?.length?[put(flowBlock(sub(id,'policies'),'row',10,block.policies.map((policy,index)=>put(actionBlock(sub(id,'policies',index),policy,'secondary'),{slot:'policies',item:index})),{mobileDirection:'row'}),{slot:'policies',classes:'ds-footer__policies'})]:[]),
      ...(block.languages??[]).map((language,index)=>put(actionBlock(sub(id,'languages',index),language,'plain'),{slot:'languages',item:index})),
      ...(block.preferences?[put(runtimeBlock(sub(id,'preferences'),block.preferences),{slot:'preferences'})]:[]),
    ]};
  }
}
function renderNativeSection(block: NativeSection, options: NativePageRenderOptions, mark?: NativeMark): string {
  const id=block.id,{children,marks}=expandNativeSection(block);
  const draw=(value:NativeBlock)=>render(value,options,marks.get(value.id),marks);
  const field=<T,>(name:string)=>sectionField<T>(block,name);
  const tag=block.kind==='header'?'header':block.kind==='footer'?'footer':'section';
  const classes=`c9y-native-node c9y-native-section${block.kind==='header'?` ds-header${field<boolean>('sticky')?' ds-header--sticky':''}`:block.kind==='footer'?' ds-footer':block.kind==='statement'&&block.panel?' c9y-native-toned':''}${markClasses(mark)}`;
  const attrs=`class="${classes}" data-native-block="${escape(id)}" data-section="${block.kind}"${options.editor?` data-c9y-block="${escape(id)}" data-c9y-kind="${block.kind}"`:''}${block.hidden?' hidden':''}${block.locale?` data-native-locale="${block.locale}" lang="${block.locale}"`:''}${attrText(nativeSectionAttributes(block))}${markText(mark)} style="${escape(styleText(nativeBlockStyles(block)))}"`;
  const open=(inner:string)=>`<${tag} ${attrs}>${inner}</${tag}>`;
  if(block.kind==='list')return open(renderList(block,options));
  if(block.kind==='footer'){
    const line=(column:number,item:NativeLine,index:number)=>`<li>${item.href?`<a href="${escape(address(item.href))}"${current(options,item.href)} data-native-block="${escape(sub(id,'columns',column,'lines',index))}" data-slot="lines" data-item="${index}">${escape(item.text)}</a>`:`<span data-native-block="${escape(sub(id,'columns',column,'lines',index))}" data-slot="lines" data-item="${index}">${escape(item.text)}</span>`}</li>`;
    const columns=block.columns.map((column,index)=>`<div class="ds-footer__column" data-native-block="${escape(sub(id,'columns',index))}" data-slot="columns" data-item="${index}"${column.width?` style="--ds-footer-column-width:${column.width}"`:''}>${column.heading!==undefined?`<p class="ds-footer__heading" data-native-block="${escape(sub(id,'columns',index,'heading'))}" data-slot="heading" data-item="${index}">${column.href?`<a href="${escape(address(column.href))}">${escape(column.heading)}</a>`:escape(column.heading)}</p>`:''}<ul class="ds-footer__links" data-native-block="${escape(sub(id,'columns',index,'lines'))}" data-slot="lines" data-item="${index}">${column.lines.map((item,lineIndex)=>line(index,item,lineIndex)).join('')}</ul></div>`).join('');
    // Follow links with an icon are the design system's stacked column: round marks one control high, each named by its words.
    const stacked=block.follow?.some(item=>item.icon)??false;
    const followLink=(item:NativeAction,index:number)=>`<a href="${escape(address(item.href))}"${item.icon?` aria-label="${escape(item.text)}"`:''} data-native-block="${escape(sub(id,'follow',index))}" data-slot="follow" data-item="${index}">${item.icon?`<span class="c9y-native-icon" aria-hidden="true">${nativeIcon(item.icon)??''}</span>`:escape(item.text)}</a>`;
    const follow=block.follow?.length?`<div class="ds-footer__column c9y-native-follow${stacked?' ds-footer__column--stack':''}" data-native-block="${escape(sub(id,'follow'))}" data-slot="follow"><ul class="${stacked?'ds-footer__icons':'ds-footer__links'}">${block.follow.map((item,index)=>`<li>${followLink(item,index)}</li>`).join('')}</ul></div>`:'';
    const brand=children.filter(child=>marks.get(child.id)?.slot==='brand').map(draw).join('');
    const base=children.filter(child=>['legal','policies'].includes(marks.get(child.id)?.slot??'')).map(draw).join('');
    const preferences=children.filter(child=>['languages','preferences'].includes(marks.get(child.id)?.slot??'')).map(draw).join('');
    return open(`${brand}<nav class="ds-footer__columns" data-native-block="${escape(sub(id,'columns'))}" data-slot="columns">${columns}${follow}</nav><div class="ds-footer__base" data-native-block="${escape(sub(id,'base'))}">${base}${preferences?`<div class="ds-footer__preferences" data-native-block="${escape(sub(id,'preferences-row'))}">${preferences}</div>`:''}</div>`);
  }
  return open(children.map(draw).join(''));
}
function renderList(block: NativeList, options: NativePageRenderOptions): string {
  const id=block.id,dated=sectionField<boolean>(block,'dated'),grouped=sectionField<boolean>(block,'grouped'),slot=block.collection?'collection':'items';
  let format:(day:string)=>string=day=>day;
  try{const formatter=new Intl.DateTimeFormat(options.lang??'en',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});format=day=>formatter.format(new Date(`${day}T00:00:00Z`));}catch{/* an unknown language keeps the ISO day */}
  const rows:{index:number;item:NativeListItem}[]=block.collection
    ?(options.collections?.[block.collection]?.items??[]).map((item,index)=>({index,item:{name:item.title,...(item.href?{href:item.href}:{}),...(item.price?{value:item.price}:{})}}))
    :(block.items??[]).map((item,index)=>({index,item}));
  const row=({index,item}:{index:number;item:NativeListItem})=>{
    const name=item.href?`<a class="ds-link c9y-native-link" href="${escape(address(item.href))}"${current(options,item.href)}>${escape(item.name)}</a>`:`<span>${escape(item.name)}</span>`;
    return`<div class="c9y-native-node c9y-native-row" data-native-block="${escape(sub(id,slot,index))}" data-slot="${slot}" data-item="${index}"${options.editor?` data-c9y-block="${escape(sub(id,slot,index))}" data-c9y-kind="row"`:''}><div class="c9y-native-row-name" data-native-block="${escape(sub(id,slot,index,'name'))}" data-slot="name" data-item="${index}">${name}</div>${item.line!==undefined?render(wordsBlock(sub(id,slot,index,'line'),item.line),options,{slot:'line',item:index}):''}${item.value!==undefined?`<div class="c9y-native-row-value" data-native-block="${escape(sub(id,slot,index,'value'))}" data-slot="value" data-item="${index}">${escape(item.value)}</div>`:''}${dated&&item.date?`<time class="c9y-native-row-date" datetime="${item.date}" data-native-block="${escape(sub(id,slot,index,'date'))}" data-slot="date" data-item="${index}">${escape(format(item.date))}</time>`:''}</div>`;
  };
  if(!grouped)return rows.map(row).join('');
  const groups=new Map<string,typeof rows>();
  for(const entry of rows){const year=entry.item.date?.slice(0,4)??'';if(!groups.has(year))groups.set(year,[]);groups.get(year)!.push(entry);}
  return[...groups.entries()].sort(([a],[b])=>a===''?1:b===''?-1:b.localeCompare(a)).map(([year,entries],index)=>`<div class="c9y-native-group" data-native-block="${escape(sub(id,'groups',index))}" data-group="${escape(year)}">${year?`<div class="c9y-native-group-heading">${escape(year)}</div>`:''}${entries.map(row).join('')}</div>`).join('');
}
export function renderNativePage(document: NativePageDocument, options: NativePageRenderOptions = {}): string {
  if(document.layout.mode==='document')return document.blocks.map(block=>renderNativeBlock(block,{...options,lang:document.lang??options.lang})).join('');
  const styles={'--c9y-page-padding':measure(document.layout.padding),'--c9y-page-gap':measure(document.layout.gap),...(document.layout.maxWidth?{width:measure(document.layout.maxWidth)}:{})};
  const pageOptions:NativePageRenderOptions={...options,lang:options.lang??document.lang};
  return`<div class="c9y-native-page"${options.editor?' data-c9y-native-root':''} style="${escape(styleText(styles))}">${document.blocks.map(block=>render(block,pageOptions)).join('')}</div>`;
}

/** Typed document-root overrides; the authored library owns every unspecified declaration. */
export function nativePageRootStyles(document:NativePageDocument):Record<string,string>{const styles={...sitePagePatch(document.layout.tone??'').styles};if(document.layout.mode==='document')for(const key of document.layout.overrides??[])styles[key==='width'?'width':key]=measure(key==='width'?document.layout.maxWidth??1000:document.layout[key]);return styles;}
