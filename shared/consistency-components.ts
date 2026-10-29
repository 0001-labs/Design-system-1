import { siteSurfacePatch, type SiteSurfaceDesign } from './consistency-site-design';
/** Presentations are trusted library/build data. Page documents carry only named components,
 * their bounded values and their children; they never submit tags, HTML, scripts or CSS. */
export interface NativeComponentDefinition {
  tag: string;
  attributes: Record<string, string>;
  fields: readonly string[];
  properties?: Record<string, unknown>;
  /** Icons and authored styles are library assets, not editable page content. */
  markup?: string;
}
export type NativeComponents = Readonly<Record<string, NativeComponentDefinition>>;
export const COMPONENT_MEASURES = ['gap','padding','height','marginTop','marginBottom','columnGap','rowGap'] as const;
export const COMPONENT_FIELDS = ['text','label','title','figure','caption','placeholder','alt','href','src','poster','value','tone','variant','color','primary','secondary','data-face','data-size','size'] as const;
export const componentEscape = (value: string) => value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
/** Typed geometry follows the component's own layout surface. */
export function componentGeometry(definition:NativeComponentDefinition,styles:Record<string,string>):Record<string,string>{
  const result={...styles};
  if(definition.tag==='ds-card'&&result.padding!==undefined){result['--ds-card-padding-override']=result.padding;delete result.padding;}
  // A content height is a minimum: spacing and writing must be able to make the
  // page taller. Media keep their explicit crop height. Editor and publication
  // share this mapping, so reopening never restores a clipping box.
  if(result.height!==undefined&&['div','section','main','article','aside','nav','header','footer','ds-card','ds-page'].includes(definition.tag)){
    result['min-height']=result.height;
    result.height='auto!important';
  }
  return result;
}
export function componentMarkup(id: string, name: string, children: string, values: Record<string,string>, words: Record<string,string>, styles: Record<string,string>, components: NativeComponents, editor: boolean, hidden = false, design?: SiteSurfaceDesign): string {
  const definition = componentDefinition(name,components);
  if (!definition) throw new Error(`unregistered-component: ${name}`);
  const tag=definition.tag,kind=tag==='ds-card'||definition.attributes.class?.includes('ds-card')?'card':tag==='ds-stat'?'stat':'button';
  const patch=siteSurfacePatch(kind,tag,design??{});
  styles=componentGeometry(definition,{...Object.fromEntries(Object.entries(patch.styles).map(([key,value])=>[key,value+'!important'])),...styles});
  const attributes: Record<string,string> = {...definition.attributes,...values,'data-native-block':id,...(editor?{'data-c9y-block':id,'data-c9y-kind':'component'}:{})};
  for(const[key,value]of Object.entries(patch.attributes))if(value===null)delete attributes[key];else attributes[key]=value;
  const classes=new Set((attributes.class??'').split(/\s+/).filter(Boolean));for(const[key,enabled]of Object.entries(patch.classes))if(enabled)classes.add(key);else classes.delete(key);if(classes.size||attributes.class)attributes.class=[...classes].join(' ');
  if (hidden) attributes.hidden = '';
  if (Object.keys(styles).length) attributes.style = (attributes.style ? attributes.style+';' : '')+Object.entries(styles).map(([key,value])=>`${key}:${value}`).join(';');
  if (definition.properties || Object.keys(words).length || Object.keys(styles).length) attributes['data-c9y-component-data'] = JSON.stringify({properties:definition.properties??{},values,words,styles});
  const attrs=Object.entries(attributes).filter(([key])=>!editor||!/^on/i.test(key)&&!['srcdoc','autofocus'].includes(key)).map(([key,value])=>` ${key}="${componentEscape(value)}"`).join('');
  if (definition.markup) {
    // These two immutable assets are generated from repository-owned sources, never saved documents.
    if (!['svg','style'].includes(definition.tag)) throw new Error('invalid-component-asset');
    return definition.markup.replace(/^<[^>]+>/,`<${definition.tag}${attrs}>`);
  }
  return `<${definition.tag}${attrs}>${voidTags.has(definition.tag)?'':children+`</${definition.tag}>`}`;
}

/** Structural presentations used when importing earlier grouping operations. */
export const BUILTIN_COMPONENTS: NativeComponents = {
  group: {tag:'div',attributes:{},fields:[]},
  columns: {tag:'div',attributes:{style:'display:flex;flex-wrap:wrap;gap:calc(20px * var(--sf,1));align-items:flex-start'},fields:[]},
  column: {tag:'div',attributes:{style:'flex:1 1 calc(200px * var(--sf,1));min-width:min(100%,calc(200px * var(--sf,1)));max-width:100%'},fields:[]},
};
export const componentDefinition = (name:string,components:NativeComponents={}) => components[name]??BUILTIN_COMPONENTS[name];
