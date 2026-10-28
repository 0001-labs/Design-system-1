import { expandNativeSection, isNativeSection, nativeBlockStyles, renderNativeBlock, type NativeBlock, type NativeContent, type NativeMark, type NativePageDocument, type NativeCollectionData, type NativeSection } from '../../../shared/consistency-native-page';
import { DocumentState } from './document-state';
import { EditorSurface } from './editor-surface';
import { NativeContentSurface } from './native-content-surface';
import { TextSpacingLayer, type SpacingTarget } from './text-spacing';
import { bindResizeEdges } from './resize';
import { createSurfaceContext, appendSurfaceOptions } from './surface-context';
import { createButtonActionControls } from './button-action';
import { createPlainEditor, parseBlocks, sidePlacement } from '../../../website/src/vendor/aa/aa';
import { HEIGHT_FIELDS, SPACING_FIELDS, addSectionItem, clampSectionMeasure, firstWordsId, itemLabel, itemsSlot, memberAt, moveSectionItem, nativeEntries, nativeGridSpaces, newSection, placeholderWords, readAt, removeSectionItem, sectionField, sectionItemCount, sectionItemIds, sectionKinds, sectionLabel, sectionPath, sectionValue, updateNativeBlock, updateNativeChildren, wordsAt, writeAt } from './native-page-model';
import { appendKindChooser, appendSectionFields, appendToneList, fieldWords } from './native-section-menu';
import { openAsk, openDraftBar, type AskAnswer } from './ask';
import { initTooltips } from '../../../DS1/0-face/tooltips';
import type { SortableController } from './vendor/drag/sortable';
import surfaceStyles from './editor-surface.css?inline';
import spacingStyles from './text-spacing.css?inline';
import resizeStyles from './resize.css?inline';
import aaStyles from '../../../website/src/vendor/aa/aa.css?inline';
import elementsStyles from './elements.css?inline';
import insertionStyles from './insertions.css?inline';
import carouselStyles from './carousel.css?inline';
import columnStyles from './column-spacing.css?inline';
import cardStyles from './card-spacing.css?inline';

export interface NativePageSnapshot { kind:'native';path:string;build:string;base:string;revision:number;document:NativePageDocument;images:string[];collections:Record<string,NativeCollectionData>;origin?:string;theme?:unknown }
export type NativePageSave = (value:{build:string;base:string;revision:number;document:NativePageDocument})=>Promise<NativePageSnapshot>;
/** A measure a handle or an edge sets: a primitive's pixel field, or a section's field in squares. */
type Measure = string;
const uid=()=>`block_${crypto.randomUUID().replaceAll('-','').slice(0,16)}`;
const label=(block:NativeBlock)=>block.kind==='flow'?(block.role??'Section'):block.kind==='collection'?'Collection':block.kind==='content'?'Content':isNativeSection(block)?sectionLabel(block.kind):block.kind.charAt(0).toUpperCase()+block.kind.slice(1);
/** The custom properties a block's measures set; cleared before each paint so a removed field leaves nothing behind. */
const MEASURE_PROPERTIES=['width','flex','--c9y-direction','--c9y-mobile-direction','--c9y-gap','--c9y-mobile-gap','--c9y-padding','--c9y-columns','--c9y-mobile-columns','--c9y-column-gap','--c9y-row-gap','--c9y-item-span','--c9y-featured-span','--c9y-image-height','--c9y-featured-image-height','--c9y-mobile-image-height','--c9y-image-fit','--c9y-hero-height','--c9y-split-columns','--c9y-split-image-height','--c9y-statement-width','--c9y-card-height','--c9y-gallery-height','--c9y-bento-height','--ds-footer-column-width','--ds-footer-line'];
/** The members edited in place, so a change to one keeps the section's drawing; any other change draws the section again. */
const WORD_MEMBERS=new Set(['title','text','kicker','heading','label','line','legal','tagline','answer','term','value','question','name']);
const structureKey=(block:NativeBlock)=>JSON.stringify(block,(key,value)=>typeof value==='string'&&WORD_MEMBERS.has(key)?'':value);
/** Where a press landed: a block of the page, or a place in a section named by its derived id. */
interface Hit { id:string; section?:string; path?:string[] }

/** Native pages edit the same typed blocks the publisher renders; there is no HTML-layout inference. A section is one block whose slots are edited in place. */
export class NativeSiteController {
  readonly state:DocumentState<NativePageDocument,NativePageSnapshot>;
  private doc:Document; private view:Window; private root:HTMLElement; private overlay:HTMLElement; private style:HTMLStyleElement;
  private surface:EditorSurface; private spacing:TextSpacingLayer; private sort:SortableController; private resize:ResizeObserver;
  private elements=new Map<string,HTMLElement>(); private content=new Map<string,NativeContentSurface>();
  private selection=new Set<string>(); private preview=new Map<string,Partial<Record<Measure,number>>>();
  private resizers=new Map<string,ReturnType<typeof bindResizeEdges>>(); private resizeTargets=new Map<string,HTMLElement>(); private sorts=new Map<string,{parent:string;element:HTMLElement;dispose():void}>(); private containers=new Map<string,{axis:string;element:HTMLElement;dispose():void}>();
  /** Sections as drawn: each one's structure key, its expansion for the block it holds, and which section every derived id belongs to. */
  private sectionKeys=new Map<string,string>(); private expansions=new Map<string,{block:NativeBlock;children:NativeBlock[];marks:ReadonlyMap<string,NativeMark>}>(); private owners=new Map<string,string>(); private items=new Map<string,{section:string;index:number}>();
  private menu?:ReturnType<typeof createSurfaceContext>; private menuDispose?:()=>void;
  /** Ask's sheet while it is open, and the Keep · Discard bar over a draft it landed. */
  private asking?:{close():void}; private draft?:ReturnType<typeof openDraftBar>;
  private notice=document.createElement('div'); private error=''; private disposed=false; private busy=false; private raf=0;
  private plain?:{id:string;editor:ReturnType<typeof createPlainEditor>};
  private carried?:{id:string;parent:string;ids:string[];rects:DOMRect[];scrollX:number;scrollY:number}; private beside?:{id:string;at:'start'|'end'}; private sideLine:HTMLElement;
  constructor(private frame:HTMLIFrameElement,snapshot:NativePageSnapshot,save:NativePageSave,private reopen:()=>void,private host:{changed?:()=>void;imageURL?:(source:string)=>string}={}){
    this.doc=frame.contentDocument!;this.view=this.doc.defaultView!;this.root=this.doc.querySelector<HTMLElement>('[data-c9y-native-root]')!;
    if(!this.root)throw new Error('The native page could not be opened.');
    this.state=new DocumentState(snapshot,save,()=>this.changed());
    this.style=this.doc.createElement('style');this.style.textContent=surfaceStyles+spacingStyles+resizeStyles+aaStyles+elementsStyles+insertionStyles+carouselStyles+columnStyles+cardStyles+`
      .consistency-native-guides{position:fixed;inset:0;pointer-events:none;z-index:2147482000;overflow:visible}.consistency-native-guides [hidden]{display:none!important}.consistency-native-guides .ghost-surface,.consistency-native-guides .consistency-resize-edge{pointer-events:auto;position:absolute;min-height:0}.consistency-native-guides .ghost-measure{font-family:var(--ds-typeface-regular);font-size:10px;line-height:20px}.consistency-site-region{position:relative;min-width:0}.c9y-native-content .consistency-sheet{min-width:0}.c9y-native-content aa-editor{display:block}.c9y-native-link .aa-block{display:inline}:where(.c9y-native-page [data-native-block]){position:relative}`;
    this.doc.head.append(this.style);
    this.overlay=this.doc.createElement('div');this.overlay.className='consistency-shell production-on consistency-native-guides';this.overlay.setAttribute('data-editor-chrome','');
    const tokens=getComputedStyle(document.documentElement);for(const name of ['--ds-pink','--ds-text-color','--ds-paper','--ds-radius','--ds-typeface-regular'])this.overlay.style.setProperty(name,tokens.getPropertyValue(name));
    this.overlay.style.setProperty('--sf','1');this.overlay.style.setProperty('--u','20px');this.doc.body.append(this.overlay);
    this.root.classList.add('consistency-sheet','production-on');this.root.style.setProperty('--consistency-selection-color',tokens.getPropertyValue('--ds-text-color'));
    this.sideLine=this.doc.createElement('div');this.sideLine.className='aa-drop-line aa-drop-side';this.sideLine.hidden=true;this.overlay.append(this.sideLine);
    initTooltips();
    this.surface=new EditorSurface(this.root,{selection:()=>this.selection,select:value=>this.select(value),marquee:()=>this.active(),reorder:()=>this.active(),contextRoot:document.body,contextChanged:active=>{this.overlay.classList.toggle('context-active',active);this.refresh();}});
    this.spacing=new TextSpacingLayer(this.root,{enabled:()=>this.enabled(),targets:()=>this.targets(),value:(key,fallback)=>{const [id,property]=key.split(':');return this.preview.get(id)?.[property as Measure]??this.value(id,property as Measure)??fallback;},select:()=>{},
      preview:(key,value)=>{const[id,property]=key.split(':');this.preview.set(id,{...this.preview.get(id),[property]:this.previewValue(id,property,value)});this.paintMeasures();this.refresh();},
      commit:(key,value)=>{const[id,property]=key.split(':');this.preview.clear();this.measure(id,property as Measure,value);},cancel:()=>{this.preview.clear();this.paintMeasures();},started:()=>{this.busy=true;},ended:()=>{this.busy=false;this.changed();}});
    this.sort=this.surface.sortable({lockAxis:undefined,onDragStart:({draggableId})=>{this.busy=true;this.select(new Set([draggableId]));const entries=nativeEntries(this.state.document),entry=entries.get(draggableId);if(!entry)return;const ids=[...entries].filter(([,value])=>value.parent===entry.parent).map(([id])=>id);this.carried={id:draggableId,parent:entry.parent,ids,rects:ids.map(id=>this.elements.get(id)!.getBoundingClientRect()),scrollX:this.view.scrollX,scrollY:this.view.scrollY};},prepareDrop:result=>{this.busy=false;if(result.reason==='DROP'){const item=this.items.get(result.draggableId);if(item){if(result.destination)this.state.commit(moveSectionItem(this.state.document,item.section,item.index,result.destination.index));}else if(this.beside)this.placeBeside(result.draggableId,this.beside.id,this.beside.at);else if(result.destination)this.move(result.draggableId,result.destination.index);}this.clearDrag();return this.elements.get(result.draggableId)??null;},onDragEnd:()=>{this.busy=false;this.clearDrag();if(!this.disposed)this.changed();}});
    this.notice.className='consistency-site-save-notice';this.notice.setAttribute('role','status');this.notice.hidden=true;frame.parentElement?.append(this.notice);
    this.doc.addEventListener('pointerdown',this.down);this.doc.addEventListener('pointermove',this.dragSide,true);this.doc.addEventListener('click',this.click,true);this.doc.addEventListener('contextmenu',this.context,true);this.doc.addEventListener('keydown',this.key,true);document.addEventListener('keydown',this.key);
    this.view.addEventListener('scroll',this.schedule,true);this.view.addEventListener('resize',this.schedule);this.resize=new ResizeObserver(this.schedule);this.resize.observe(this.root);this.changed();
  }
  private active(){return !this.disposed&&!this.frame.closest('[hidden]')&&this.frame.getBoundingClientRect().width>0;}
  private enabled(){return this.active()&&!this.surface.contextActive;}
  private scale(element:HTMLElement){return Number.parseFloat(this.view.getComputedStyle(element).getPropertyValue('--sf'))||1;}
  private select(value:Set<string>){this.selection=value;this.surface?.paintSelection();}
  /*
   * Sections. A section is one block of the page: `nativeEntries` lists it once, and the primitives it
   * expands to are found by their derived ids and edited through the section's fields and slots. A hero
   * standing in panels is reached through the panels block.
   */
  private sectionAt(id:string):NativeSection|undefined{const entry=nativeEntries(this.state.document).get(id);if(entry)return isNativeSection(entry.block)?entry.block:undefined;const item=this.items.get(id);if(!item)return undefined;const parent=this.sectionAt(item.section);const list=parent&&(parent as unknown as Record<string,unknown>)[itemsSlot(parent.kind)!.name] as NativeBlock[]|undefined;const hero=list?.[item.index];return hero&&isNativeSection(hero)?hero:undefined;}
  private updateSection(id:string,update:(section:NativeSection)=>NativeSection){const entries=nativeEntries(this.state.document);if(entries.has(id)){this.state.commit(updateNativeBlock(this.state.document,id,block=>isNativeSection(block)?update(block):block));return;}const item=this.items.get(id);if(!item)return;this.updateSection(item.section,section=>{const slot=itemsSlot(section.kind)!.name,list=[...((section as unknown as Record<string,unknown>)[slot] as NativeSection[])];list[item.index]=update(list[item.index]!);return{...section,[slot]:list} as NativeSection;});}
  private expansion(block:NativeSection){const cached=this.expansions.get(block.id);if(cached&&cached.block===block)return cached;const next={block,...expandNativeSection(block)};this.expansions.set(block.id,next);return next;}
  /** The derived ids a section draws, mapped to the section they belong to, and its items by index. */
  private index(){this.items.clear();const visit=(section:NativeSection)=>{sectionItemIds(section).forEach((id,index)=>this.items.set(id,{section:section.id,index}));for(const child of this.expansion(section).children)if(isNativeSection(child))visit(child);};for(const{block}of nativeEntries(this.state.document).values())if(isNativeSection(block))visit(block);}
  /** The place a derived id names in its section, from the id itself or from the expansion's marks (a hero in panels). */
  private locate(id:string):Hit|undefined{const section=this.owners.get(id);if(!section)return undefined;const path=sectionPath(section,id);if(path)return{id,section,path};const block=this.sectionAt(section);const mark=block?this.expansion(block).marks.get(id):undefined;return mark?.slot!==undefined?{id,section,path:[mark.slot,...(mark.item!==undefined?[String(mark.item)]:[])]}:{id,section};}
  private hit(target:Element):Hit|undefined{const node=target.closest<HTMLElement>('[data-native-block]');if(!node)return undefined;const id=node.dataset.nativeBlock!;if(nativeEntries(this.state.document).has(id))return{id};return this.locate(id);}
  /** The words a derived content block draws: its slot's words, with the heading marks the expansion gave them. */
  private wordsSource(hit:Hit):string{const section=this.sectionAt(hit.section!);if(!section)return'';const find=(blocks:NativeBlock[]):string|undefined=>{for(const child of blocks){if(child.id===hit.id&&child.kind==='content')return child.source;const inner='children'in child?find(child.children):undefined;if(inner!==undefined)return inner;}return undefined;};return find(this.expansion(section).children)??wordsAt(section,hit.path!);}
  /** Words written back to their slot, less the heading marks the expansion added, so plain words stay plain. */
  private writeWords(hit:Hit,source:string){const section=this.sectionAt(hit.section!);if(!section)return;const stored=wordsAt(section,hit.path!),drawn=this.wordsSource(hit),prefix=drawn!==stored&&drawn.endsWith(stored)?drawn.slice(0,drawn.length-stored.length):'';this.updateSection(hit.section!,value=>writeAt(value,hit.path!,prefix&&source.startsWith(prefix)?source.slice(prefix.length):source));}
  private value(id:string,property:Measure):number|undefined {if(id==='page')return this.state.document.layout[property as 'gap'|'padding'];const block=nativeEntries(this.state.document).get(id)?.block;if(block&&isNativeSection(block)){const field=sectionField(block.kind,property);return field?.type==='squares'?sectionValue<number>(block,property)*20:field?sectionValue<number>(block,property):undefined;}return block?.[property as keyof typeof block] as number|undefined;}
  /** A preview value in the unit the block's style reads: a section's field in squares, a primitive's in pixels. */
  private previewValue(id:string,property:Measure,pixels:number){const block=nativeEntries(this.state.document).get(id)?.block;return block&&isNativeSection(block)&&sectionField(block.kind,property)?.type==='squares'?pixels/20:pixels;}
  private measure(id:string,property:Measure,value:number){if(!Number.isFinite(value))return;const block=nativeEntries(this.state.document).get(id)?.block;if(block&&isNativeSection(block)){const field=sectionField(block.kind,property);if(!field)return;this.patch(id,{[property]:field.type==='squares'?clampSectionMeasure(block.kind,property,value/20):clampSectionMeasure(block.kind,property,value)});return;}const rounded=Math.max(0,Math.min(property==='width'?10000:2000,Math.round(value/20)*20));if(id==='page')this.state.commit({...this.state.document,layout:{...this.state.document.layout,[property]:rounded}});else this.patch(id,{[property]:rounded});}
  private patch(id:string,patch:Partial<NativeBlock>){this.state.commit(updateNativeBlock(this.state.document,id,block=>({...block,...patch} as NativeBlock)));}
  private imageURL=(source:string)=>this.host.imageURL?this.host.imageURL(source):/^\/media\/uploads\/[^/]+$/.test(source)&&this.state.snapshot.origin?new URL(source,this.state.snapshot.origin).href:source.startsWith('/')&&this.state.snapshot.images.includes(source)?new URL(this.frame.src).pathname.replace(/\/document$/,'/files')+source:source;
  private changed(){if(this.disposed)return;this.host.changed?.();if(this.busy){this.status();return;}this.index();this.reconcile();this.paintMeasures();this.bindSort();this.bindResizers();this.refresh();this.status();}
  private surfaceFor(element:HTMLElement,id:string,read:()=>NativeContent|{source:string},commit:(value:{source:string;gaps?:Record<string,number>})=>void){let content=this.content.get(id);if(!content){content=new NativeContentSurface(element,id,{read,commit,undo:()=>{const ok=this.state.canUndo;this.state.undo();return ok;},redo:()=>{const ok=this.state.canRedo;this.state.redo();return ok;},enabled:()=>this.enabled(),select:()=>{},media:{chooseImage:anchor=>this.chooseImage(anchor)},imageURL:this.imageURL,error:message=>{this.error=message;this.status();}});this.content.set(id,content);}content.refresh();}
  private forget(id:string){this.content.get(id)?.destroy();this.content.delete(id);this.resizers.get(id)?.dispose();this.resizers.delete(id);this.resizeTargets.delete(id);this.elements.delete(id);}
  private render(block:NativeBlock){const template=this.doc.createElement('template');template.innerHTML=renderNativeBlock(block,{images:this.state.snapshot.images,collections:this.state.snapshot.collections,editor:true});return template.content.firstElementChild as HTMLElement;}
  private reconcile(){
    const present=new Set<string>();this.owners.clear();
    const visit=(blocks:NativeBlock[],parent:HTMLElement)=>{let index=0;for(const block of blocks){present.add(block.id);let element=this.elements.get(block.id)??this.root.querySelector<HTMLElement>(`[data-c9y-block="${CSS.escape(block.id)}"]`)??undefined;
      if(!element)element=this.render(block);
      else if(isNativeSection(block)){const key=structureKey(block);if(this.sectionKeys.has(block.id)&&this.sectionKeys.get(block.id)!==key){const fresh=this.render(block);element.replaceWith(fresh);element=fresh;}}
      if(isNativeSection(block))this.sectionKeys.set(block.id,structureKey(block));
      this.elements.set(block.id,element);element.dataset.selectable=block.id;element.dataset.sortGroup=block.id;
      const siblings=[...parent.children].filter(child=>child.hasAttribute('data-c9y-block'));if(siblings[index]!==element)parent.insertBefore(element,siblings[index]??null);index++;
      if('children'in block)visit(block.children,block.kind==='flow'&&block.disclosure?element.querySelector<HTMLElement>(':scope>.c9y-native-disclosure')!:element);
      else if(isNativeSection(block))this.reconcileSection(block,element,present);
      else if(block.kind==='content')this.surfaceFor(element,block.id,()=>nativeEntries(this.state.document).get(block.id)!.block as NativeContent,value=>this.patch(block.id,value));
      else if(block.kind==='image'){const image=element.querySelector('img')!;image.src=this.imageURL(block.src);image.alt=block.alt;}
      else if(block.kind==='link'&&this.plain?.id!==block.id)this.paintLink(element,block);
    }};
    visit(this.state.document.blocks,this.root);
    for(const[id,element]of this.elements)if(!present.has(id)){this.forget(id);element.remove();}
    for(const id of this.sectionKeys.keys())if(!present.has(id)){this.sectionKeys.delete(id);this.expansions.delete(id);}
  }
  private paintLink(element:HTMLElement,link:{text:string;href:string;appearance?:string}){const anchor=element.querySelector('a');if(!anchor)return;anchor.textContent=link.text;anchor.href=link.href;anchor.className=link.appearance&&link.appearance!=='plain'?`ds-button${link.appearance==='default'?'':` ds-button--${link.appearance}`}`:'ds-link c9y-native-link';}
  /** The primitives a section draws, found by their derived ids inside it: words get a surface, pictures and links their values; a section drawn again replaces them all. */
  private reconcileSection(block:NativeSection,element:HTMLElement,present:Set<string>){
    const inside=(id:string)=>{const cached=this.elements.get(id);if(cached&&element.contains(cached))return cached;const found=element.querySelector<HTMLElement>(`[data-native-block="${CSS.escape(id)}"]`)??undefined;if(cached&&cached!==found)this.forget(id);if(found)this.elements.set(id,found);return found;};
    const {children}=this.expansion(block);
    const visit=(blocks:NativeBlock[])=>{for(const child of blocks){const node=inside(child.id);if(!node)continue;present.add(child.id);this.owners.set(child.id,block.id);
      if(isNativeSection(child)){this.reconcileSection(child,node,present);continue;}
      if('children'in child){visit(child.children);continue;}
      const hit:Hit={id:child.id,section:block.id,path:sectionPath(block.id,child.id)};
      if(child.kind==='content')this.surfaceFor(node,child.id,()=>({source:this.wordsSource(hit)}),value=>this.writeWords(hit,value.source));
      else if(child.kind==='image'){const image=node.querySelector('img');if(image){image.src=this.imageURL(child.src);image.alt=child.alt;}}
      else if(child.kind==='link'&&this.plain?.id!==child.id)this.paintLink(node,child);
    }};
    visit(children);
    // What the section draws beyond its expansion: list rows and their lines, plain members (a question, a name, a column's heading, a line), the items themselves.
    for(const node of element.querySelectorAll<HTMLElement>('[data-native-block]')){const id=node.dataset.nativeBlock!;if(!id.startsWith(`${block.id}.`)||this.owners.has(id))continue;this.owners.set(id,block.id);const path=sectionPath(block.id,id)!,member=memberAt(block.kind,path);
      if(node.dataset.c9yKind==='content'){present.add(id);this.elements.set(id,node);this.surfaceFor(node,id,()=>({source:wordsAt(this.sectionAt(block.id)??block,path)}),value=>this.updateSection(block.id,section=>writeAt(section,path,value.source)));}
      else if(member?.type==='text'&&this.plain?.id!==id){const words=node.querySelector<HTMLElement>(':scope>a,:scope>span')??node;const value=readAt(block,path);if(typeof value==='string'&&words.textContent!==value)words.textContent=value;}
    }
    for(const id of sectionItemIds(block)){const node=inside(id);if(!node)continue;present.add(id);node.dataset.selectable=id;}
    if(block.kind==='questions')for(const details of element.querySelectorAll<HTMLDetailsElement>(':scope>details')){details.open=true;const summary=details.querySelector('summary'),id=`${details.dataset.nativeBlock}.question`;if(summary&&this.plain?.id!==id){const value=readAt(block,[...sectionPath(block.id,details.dataset.nativeBlock!)!,'question']);if(typeof value==='string'&&summary.textContent!==value)summary.textContent=value;}}
  }
  private paintMeasures(){
    const layout={...this.state.document.layout,...this.preview.get('page')};this.root.style.setProperty('--c9y-page-padding',`calc(${layout.padding}px * var(--sf,1))`);this.root.style.setProperty('--c9y-page-gap',`calc(${layout.gap}px * var(--sf,1))`);
    for(const[id,{block}]of nativeEntries(this.state.document)){const element=this.elements.get(id);if(!element)continue;const value={...block,...this.preview.get(id)} as NativeBlock;for(const key of MEASURE_PROPERTIES)element.style.removeProperty(key);for(const[key,measure]of Object.entries(nativeBlockStyles(value)))element.style.setProperty(key,measure);element.hidden=!!block.hidden;if(block.kind==='flow')element.dataset.direction=block.direction;}
  }
  private targets():SpacingTarget[]{
    const targets:SpacingTarget[]=[];
    const words=(property:Measure)=>property==='columnGap'?'column gap':property==='rowGap'?'row gap':property==='mobileGap'?'gap':property==='columnWidth'?'column width':property;
    const add=(id:string,property:Measure,element:HTMLElement,axis:'horizontal'|'vertical',rect:()=>{left:number;top:number;width:number;height:number},suffix:number)=>{const fallback=this.value(id,property)??0;const block=id==='page'?undefined:nativeEntries(this.state.document).get(id)!.block,field=block&&isNativeSection(block)?sectionField(block.kind,property):undefined;targets.push({id:`${id}:${property}:${suffix}`,element,host:this.overlay,label:`${block?label(block):'Page'} ${words(property)}`,axis,kind:property==='padding'?'padding':'gap',fallback,rect,...(field&&field.min!==undefined&&field.max!==undefined?{range:[field.min*(field.type==='squares'?20:1),field.max*(field.type==='squares'?20:1)] as [number,number]}:{})});};
    const spaces=(id:string,element:HTMLElement,children:HTMLElement[],property:(axis:'horizontal'|'vertical')=>Measure|undefined)=>{const boxes=children.filter(child=>!child.hidden&&child.getBoundingClientRect().height>0).map(child=>child.getBoundingClientRect());const layout=nativeGridSpaces(boxes);layout.forEach((space,index)=>{const name=property(space.axis);if(!name)return;add(id,name,element,space.axis,()=>{const current=nativeGridSpaces(children.filter(child=>!child.hidden&&child.getBoundingClientRect().height>0).map(child=>child.getBoundingClientRect()));return current[index]?.box??space.box;},index);});};
    const childElements=(element:HTMLElement)=>[...element.children].filter(child=>child.hasAttribute('data-c9y-block')) as HTMLElement[];
    spaces('page',this.root,childElements(this.root),()=>'gap');
    for(const[id,{block}]of nativeEntries(this.state.document)){const element=this.elements.get(id)!;if(block.hidden||!element.getBoundingClientRect().height)continue;
      if(block.kind==='flow'||block.kind==='grid'){const container=block.kind==='flow'&&block.disclosure?element.querySelector<HTMLElement>(':scope>.c9y-native-disclosure')!:element;spaces(id,element,childElements(container),axis=>block.kind==='grid'?(axis==='horizontal'?'columnGap':'rowGap'):this.view.innerWidth<=700&&block.mobileGap!==undefined?'mobileGap':'gap');}
      if(block.kind==='collection')spaces(id,element,[...element.querySelectorAll<HTMLElement>(':scope>.c9y-native-collection-item')],axis=>axis==='horizontal'?'columnGap':'rowGap');
      if(block.kind==='flow')add(id,'padding',element,'vertical',()=>{const box=element.getBoundingClientRect(),padding=Number.parseFloat(this.view.getComputedStyle(element).paddingTop)||0;return{left:box.left,top:box.top-(padding<1?10*this.scale(element):0),width:box.width,height:padding};},0);
      if(isNativeSection(block)&&SPACING_FIELDS[block.kind]){const field=SPACING_FIELDS[block.kind]!;spaces(id,element,sectionItemIds(block).map(item=>this.elements.get(item)).filter((item):item is HTMLElement=>!!item),axis=>axis==='horizontal'||block.kind==='panels'?field:undefined);}
    }
    add('page','padding',this.root,'vertical',()=>{const box=this.root.getBoundingClientRect(),padding=Number.parseFloat(this.view.getComputedStyle(this.root).paddingTop)||0;return{left:box.left,top:box.top-(padding<1?10*this.scale(this.root):0),width:box.width,height:padding};},0);
    return targets;
  }
  private bindSort(){
    const entries=nativeEntries(this.state.document);
    const parentOf=(id:string)=>entries.get(id)?.parent??(this.items.has(id)?`items:${this.items.get(id)!.section}`:undefined);
    for(const[id,item]of this.sorts)if(parentOf(id)!==item.parent||this.elements.get(id)!==item.element){item.dispose();this.sorts.delete(id);}
    const parents=new Map<string,{element:HTMLElement;axis:'horizontal'|'vertical';type:string;label:string}>([['page',{element:this.root,axis:'vertical',type:'page',label:'Page'}]]);
    for(const[id,{block}]of entries){
      if('children'in block)parents.set(id,{element:block.kind==='flow'&&block.disclosure?this.elements.get(id)!.querySelector<HTMLElement>(':scope>.c9y-native-disclosure')!:this.elements.get(id)!,axis:block.kind==='flow'&&block.direction==='row'?'horizontal':'vertical',type:id,label:label(block)});
      // A section's items move inside it: side by side where they stand in columns, down the page where they stand in rows; a grouped list keeps its order by date.
      if(isNativeSection(block)&&itemsSlot(block.kind)&&!(block.kind==='list'&&sectionValue<boolean>(block,'grouped'))){const element=this.elements.get(id)!,container=block.kind==='footer'?element.querySelector<HTMLElement>(':scope>.ds-footer__columns'):element;if(container)parents.set(`items:${id}`,{element:container,axis:['questions','list'].includes(block.kind)?'vertical':'horizontal',type:`items:${id}`,label:label(block)});}
    }
    for(const[id,item]of this.containers)if(!parents.has(id)||parents.get(id)!.axis!==item.axis||parents.get(id)!.element!==item.element){item.dispose();this.containers.delete(id);}
    for(const[id,parent]of parents)if(!this.containers.has(id))this.containers.set(id,{axis:parent.axis,element:parent.element,dispose:this.sort.container({id,type:parent.type,element:parent.element,axis:parent.axis,label:parent.label})});
    const canDrag=({target}:{target:Element|null})=>this.enabled()&&!this.root.hasAttribute('data-pointer-additive')&&!!target&&!target.closest('[data-editor-chrome],aa-editor,[contenteditable],button,input,textarea,select,a,summary');
    for(const[id,entry]of entries)if(!this.sorts.has(id)){const element=this.elements.get(id)!;this.sorts.set(id,{parent:entry.parent,element,dispose:this.sort.item({id,type:entry.parent,element,label:label(entry.block),canDrag})});}
    for(const[id,item]of this.items){const element=this.elements.get(id),type=`items:${item.section}`;if(!element||this.sorts.has(id)||!parents.has(type))continue;const section=this.sectionAt(item.section)!;this.sorts.set(id,{parent:type,element,dispose:this.sort.item({id,type,element,label:itemLabel(section.kind),canDrag})});}
  }
  private bindResizers(){
    for(const[key,target]of this.resizeTargets)if(!target.isConnected){this.resizers.get(key)?.dispose();this.resizers.delete(key);this.resizeTargets.delete(key);}
    const settle={cancelSettle:()=>{},settle:async(update:()=>Promise<unknown>)=>{await update();}};
    for(const[id,{block}]of nativeEntries(this.state.document)){
      const element=this.elements.get(id)!;
      if(block.kind==='collection'){
        for(const[index,media]of [...element.querySelectorAll<HTMLElement>(':scope>.c9y-native-collection-item>.c9y-native-collection-media')].entries()){
          const key=`${id}:media:${index}`;if(this.resizers.has(key))continue;
          const property=():Measure=>this.view.innerWidth<=700&&block.mobileImageHeight!==undefined?'mobileImageHeight':media.parentElement!.hasAttribute('data-featured')&&block.featuredImageHeight!==undefined?'featuredImageHeight':'imageHeight';
          const dimensions=()=>{const rect=media.getBoundingClientRect(),scale=this.scale(media);return{width:rect.width/scale,height:rect.height/scale};};
          this.resizeTargets.set(key,media);
          this.resizers.set(key,bindResizeEdges(media,{host:this.overlay,name:index<block.featured?'Featured image':'Collection image',axes:['height'],box:true,enabled:()=>this.enabled()&&!element.hidden,scale:()=>this.scale(media),size:dimensions,minimumWidth:()=>80,minimumHeight:()=>80,maxWidth:()=>10000,
            begin:()=>{this.busy=true;},end:cancelled=>{this.busy=false;if(cancelled)this.preview.clear();this.changed();},
            paintSize:size=>{this.preview.set(id,{[property()]:size.height});this.paintMeasures();this.refresh();},save:size=>{this.preview.clear();this.measure(id,property(),size.height);},...settle}));
        }
      }
      // A section's height field: on the section itself (a hero), on its picture (a split), or on each item (cards, gallery, bento), snapped to the square inside the kind's range.
      const height=isNativeSection(block)?HEIGHT_FIELDS[block.kind]:undefined;
      if(height&&isNativeSection(block)&&height.on!=='section'){
        const targets=height.on==='picture'?[this.elements.get(`${id}.picture`)].filter((item):item is HTMLElement=>!!item):sectionItemIds(block).map(item=>this.elements.get(item)).filter((item):item is HTMLElement=>!!item);
        for(const[index,target]of targets.entries()){
          const key=`${id}:${height.field}:${index}`;if(this.resizers.has(key))continue;this.resizeTargets.set(key,target);
          const span=()=>{const rows=/span (\d+)/.exec(this.view.getComputedStyle(target).gridRowEnd)?.[1];return Math.max(1,Number(rows)||1);},field=sectionField(block.kind,height.field)!;
          const squares=(pixels:number)=>{const scale=this.scale(target),rows=span();return(pixels/scale-(rows-1)*10)/rows/20;};
          this.resizers.set(key,bindResizeEdges(target,{host:this.overlay,name:`${height.on==='picture'?'Picture':itemLabel(block.kind)} height`,axes:['height'],box:true,enabled:()=>this.enabled()&&!element.hidden,scale:()=>this.scale(target),size:()=>{const rect=target.getBoundingClientRect(),scale=this.scale(target);return{width:rect.width/scale,height:rect.height/scale};},minimumWidth:()=>80,minimumHeight:()=>(field.min??4)*20,maxWidth:()=>10000,
            begin:()=>{this.busy=true;},end:cancelled=>{this.busy=false;if(cancelled)this.preview.clear();this.changed();},
            paintSize:size=>{this.preview.set(id,{[height.field]:squares(size.height*this.scale(target))});this.paintMeasures();this.refresh();},save:size=>{this.preview.clear();this.patch(id,{[height.field]:clampSectionMeasure(block.kind,height.field,squares(size.height*this.scale(target)))});},...settle}));
        }
      }
      if(block.kind==='runtime'||this.resizers.has(id))continue;
      const heightProperty=():Measure=>block.kind==='image'&&this.view.innerWidth<=700&&block.mobileHeight!==undefined?'mobileHeight':'height';
      const whole=height?.on==='section'&&isNativeSection(block)?height:undefined,field=whole?sectionField(block.kind,whole.field):undefined;
      let original='';this.resizeTargets.set(id,element);
      this.resizers.set(id,bindResizeEdges(element,{host:this.overlay,name:label(block),box:block.kind==='image'||!!whole,axes:whole?['width','height']:undefined,enabled:()=>this.enabled()&&!element.hidden,scale:()=>this.scale(element),size:()=>{const rect=element.getBoundingClientRect(),sf=this.scale(element);return{width:rect.width/sf,height:rect.height/sf};},minimumWidth:()=>80,minimumHeight:()=>(field?.min??4)*20,maxWidth:()=>Math.max(80,(element.parentElement?.clientWidth??10000)/this.scale(element)),
        begin:()=>{this.busy=true;original=element.style.cssText;},end:cancelled=>{this.busy=false;if(cancelled){element.style.cssText=original;this.preview.clear();this.paintMeasures();}this.refresh();},
        paintSize:size=>{element.style.width=`calc(${size.width}px * var(--sf,1))`;element.style.flex='0 1 auto';if(block.kind==='image')element.style.setProperty(heightProperty()==='mobileHeight'?'--c9y-mobile-image-height':'--c9y-image-height',`calc(${size.height}px * var(--sf,1))`);if(whole){this.preview.set(id,{[whole.field]:size.height/20});this.paintMeasures();}this.refresh();},
        save:size=>{this.preview.clear();this.patch(id,{width:Math.round(size.width),...(block.kind==='image'?{[heightProperty()]:Math.round(size.height)}:{}),...(whole?{[whole.field]:clampSectionMeasure(block.kind,whole.field,size.height/20)}:{})});},...settle}));
    }
  }
  private refresh(){if(this.disposed)return;this.spacing?.refresh();this.surface?.paintSelection();this.draft?.refresh();for(const[id,binding]of this.resizers){const target=this.resizeTargets.get(id);if(!target)continue;const rect=target.getBoundingClientRect();for(const edge of binding.edges){edge.dataset.nativeResize=id;edge.hidden=!this.enabled()||target.hidden||!rect.height;edge.tabIndex=edge.hidden?-1:0;if(edge.classList.contains('consistency-resize-width'))Object.assign(edge.style,{left:`${rect.right-3}px`,top:`${rect.top}px`,width:'6px',height:`${rect.height}px`});else if(edge.classList.contains('consistency-resize-height'))Object.assign(edge.style,{left:`${rect.left}px`,top:`${rect.bottom-3}px`,width:`${rect.width}px`,height:'6px'});else Object.assign(edge.style,{left:`${rect.right-6}px`,top:`${rect.bottom-6}px`});}}
    for(const content of this.content.values())content.refresh();
  }
  private schedule=()=>{if(!this.raf)this.raf=this.view.requestAnimationFrame(()=>{this.raf=0;this.refresh();});};
  private down=(event:PointerEvent)=>{if(this.menu?.open){this.menu.requestClose('outside');this.menu.remove();}this.surface.startMarquee(event);};
  private click=(event:MouseEvent)=>{const target=event.target as Element;if(event.defaultPrevented||target.closest('aa-editor,[contenteditable],[data-editor-chrome]'))return;const hit=this.hit(target);if(!hit)return;const follow=event.metaKey||event.ctrlKey;
    const entries=nativeEntries(this.state.document),block=entries.get(hit.id)?.block;
    if(block?.kind==='link'&&!follow){event.preventDefault();this.editLink(hit);return;}
    if(hit.section&&hit.path&&!follow){const section=this.sectionAt(hit.section),member=section?memberAt(section.kind,hit.path):undefined;
      if(member&&['action','actions','links','languages'].includes(member.type)&&(target.closest('a')||member.type==='links')&&this.elements.get(hit.id)?.dataset.c9yKind!=='image'){event.preventDefault();this.editLink(hit);return;}
      if(member?.type==='text'){event.preventDefault();this.editPlain(hit,this.elements.get(hit.id)??target.closest<HTMLElement>('[data-native-block]')!);return;}
      const summary=target.closest<HTMLElement>('summary');if(summary&&section?.kind==='questions'&&hit.path[0]==='items'&&hit.path.length===2){event.preventDefault();this.editPlain({...hit,id:`${hit.id}.question`,path:[...hit.path,'question']},summary);return;}}
    if(target.closest('a,button,input,textarea,select,summary'))return;
    const selectable=target.closest<HTMLElement>('[data-selectable]')?.dataset.selectable;if(selectable&&(entries.has(selectable)||this.items.has(selectable))&&!event.shiftKey)this.select(new Set([selectable]));};
  private key=(event:KeyboardEvent)=>{if(!this.active()||event.defaultPrevented||(event.target as Element)?.closest?.('aa-editor,[contenteditable],input,textarea,select,ds-number'))return;if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.stopPropagation();if(event.shiftKey)this.state.redo();else this.state.undo();}else if(event.key==='Escape'){this.surface.cancelMarquee();this.select(new Set());this.menu?.remove();}else if(['Delete','Backspace'].includes(event.key)&&this.selection.size){event.preventDefault();this.removeSelection();}else if(event.altKey&&['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const id=[...this.selection][0],step=event.key==='ArrowUp'?-1:1,entry=nativeEntries(this.state.document).get(id),item=this.items.get(id);if(entry)this.move(id,entry.index+step);else if(item)this.state.commit(moveSectionItem(this.state.document,item.section,item.index,item.index+step));}};
  private context=(event:MouseEvent)=>{const target=event.target as Element;if(target.closest('aa-editor,[contenteditable],[data-editor-chrome]'))return;event.preventDefault();event.stopPropagation();const hit=this.hit(target);const selectable=target.closest<HTMLElement>('[data-selectable]')?.dataset.selectable;if(selectable&&!this.selection.has(selectable))this.select(new Set([selectable]));const box=this.frame.getBoundingClientRect();this.openMenu(hit??{id:'page'},box.left+event.clientX,box.top+event.clientY);};
  private row(menu:HTMLElement,text:string,run:()=>void,options:{danger?:boolean;disabled?:boolean;keep?:boolean}={}){const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.textContent=text;if(options.danger)button.setAttribute('data-danger','');if(options.disabled)button.setAttribute('aria-disabled','true');if(options.keep)button.setAttribute('data-keep-open','');button.onclick=()=>{if(!options.disabled)run();};menu.append(button);return button;}
  private rule(menu:HTMLElement){const line=document.createElement('hr');line.setAttribute('data-ds-menu-separator','');menu.append(line);}
  /** A block's menu, or a section's: its slot or item first, then its fields from the vocabulary, its items, and the moves every block has. */
  private openMenu(hit:Hit,x:number,y:number){this.finishPlain();this.menuDispose?.();this.menu?.remove();
    const entries=nativeEntries(this.state.document),id=hit.section??hit.id,block=entries.get(id)?.block??this.sectionAt(id),section=block&&isNativeSection(block)?block:undefined;
    const member=section&&hit.path?memberAt(section.kind,hit.path):undefined,item=this.items.get(hit.id)?hit.id:hit.section&&hit.path?.length?sectionItemIds(section!).find(itemId=>hit.id===itemId||hit.id.startsWith(`${itemId}.`)):undefined;
    const menu=this.menu=createSurfaceContext(block?item&&section&&hit.id===item?itemLabel(section.kind):label(block):'Page');const action=(text:string,run:()=>void,options?:{danger?:boolean;disabled?:boolean;keep?:boolean})=>this.row(menu,text,()=>{run();if(!options?.keep)menu.remove();},options);
    // Ask first, on every menu: a section asked for lands after the pressed block or in its place; the page's menu asks for the whole page.
    action('Ask',()=>this.ask(hit));this.rule(menu);
    // The slot pressed: a picture is chosen, an action's words and destination edited, a tone set; an item is removed.
    if(section&&hit.path&&member){
      const path=hit.path;
      if(member.type==='picture'||member.type==='pictures')action('Choose picture',()=>{void this.chooseImage(this.elements.get(hit.id)!).then(image=>{if(image)this.updateSection(section.id,value=>writeAt(value,path,{...(readAt(value,path) as object),...image}));});});
      if(['action','actions','links','languages'].includes(member.type)&&(hit.id===`${section.id}.${path.join('.')}`||member.type==='action')){const current=readAt(section,path) as {text?:string;href?:string;appearance?:string}|undefined;if(current&&typeof current.text==='string'){
        if(member.type==='action'||member.type==='actions'){action('Default button',()=>this.updateSection(section.id,value=>writeAt(value,[...path,'appearance'],'default')));appendSurfaceOptions(menu,'button',patch=>{this.updateSection(section.id,value=>writeAt(value,[...path,'appearance'],patch.appearance));});}
        const controls=createButtonActionControls(document,{kind:'link',target:current.href??''},()=>true,next=>{if(next)this.updateSection(section.id,value=>writeAt(value,[...path,'href'],next.target));},{allowNone:false});controls.element.setAttribute('data-keep-open','');menu.append(controls.element);this.menuDispose=controls.dispose;}}
      if(member.type==='tone'&&path.length>1){appendToneList(menu,fieldWords(path.at(-1)!),()=>readAt(this.sectionAt(section.id)??section,path) as string|undefined,!member.required,tone=>this.updateSection(section.id,value=>tone===undefined?dropAt(value,path):writeAt(value,path,tone)));}
      else if(item&&hit.id===item&&memberAt(section.kind,path)?.type!=='heroes'){const itemDefinition=itemsSlot(section.kind)!.definition.item;for(const[name,definition]of Object.entries(itemDefinition??{}))if(definition.type==='tone')appendToneList(menu,fieldWords(name),()=>readAt(this.sectionAt(section.id)??section,[...path,name]) as string|undefined,!definition.required,tone=>this.updateSection(section.id,value=>tone===undefined?dropAt(value,[...path,name]):writeAt(value,[...path,name],tone)));}
      if(item){const slot=itemsSlot(section.kind)!,count=sectionItemCount(section),index=this.items.get(item)!.index;this.rule(menu);action(`Move ${itemLabel(section.kind).toLowerCase()} up`,()=>this.state.commit(moveSectionItem(this.state.document,section.id,index,index-1)),{disabled:index===0});action(`Move ${itemLabel(section.kind).toLowerCase()} down`,()=>this.state.commit(moveSectionItem(this.state.document,section.id,index,index+1)),{disabled:index>=count-1});action(`Remove ${itemLabel(section.kind).toLowerCase()}`,()=>{this.state.commit(removeSectionItem(this.state.document,section.id,index));this.select(new Set());},{danger:true,disabled:count<=(slot.definition.min??0)});}
      this.rule(menu);
    }
    action('Add writing',()=>this.add(id,'content'));action('Add group',()=>this.add(id,'flow'));action('Add section',()=>this.chooseSection(hit,x,y),{keep:true});
    if(block?.kind==='image')action('Choose image',()=>{void this.chooseImage(this.elements.get(id)!).then(image=>{if(image)this.patch(id,image);});},{keep:true});
    if(block?.kind==='link'){action('Default button',()=>this.patch(id,{appearance:'default'}));appendSurfaceOptions(menu,'button',patch=>this.patch(id,patch));const controls=createButtonActionControls(document,{kind:'link',target:block.href},()=>true,next=>{if(next)this.patch(id,{href:next.target});},{allowNone:false});menu.append(controls.element);this.menuDispose=controls.dispose;}
    if(section){appendSectionFields(menu,()=>this.sectionAt(section.id),patch=>this.updateSection(section.id,value=>({...value,...patch} as NativeSection)));const slot=itemsSlot(section.kind);if(slot){this.rule(menu);action(`Add ${itemLabel(section.kind).toLowerCase()}`,()=>this.state.commit(addSectionItem(this.state.document,section.id,this.state.snapshot.images,uid)),{disabled:sectionItemCount(section)>=(slot.definition.max??100)});}}
    if(block&&entries.has(id)){this.rule(menu);action('Move up',()=>{const entry=nativeEntries(this.state.document).get(id);if(entry)this.move(id,entry.index-1);});action('Move down',()=>{const entry=nativeEntries(this.state.document).get(id);if(entry)this.move(id,entry.index+1);});action(block.hidden?'Show':'Hide',()=>this.patch(id,{hidden:!block.hidden}));if(section)action('Remove',()=>this.remove(id),{danger:true});}
    for(const[hidden,{block}]of entries)if(block.hidden)action(`Show ${label(block)}`,()=>this.patch(hidden,{hidden:false}));
    if(this.state.canUndo)action('Undo',()=>this.state.undo());if(this.state.canRedo)action('Redo',()=>this.state.redo());
    document.body.append(menu);menu.openOver({left:x,right:x,top:y,bottom:y,width:0,height:0});
  }
  /** The thirteen kinds by name, each described; the chosen one lands after the pressed block, or at the end of the page. */
  private chooseSection(hit:Hit,x:number,y:number){this.menuDispose?.();this.menu?.remove();const menu=this.menu=createSurfaceContext('Add a section');appendKindChooser(menu,sectionKinds(),kind=>{menu.remove();this.addSection(kind,hit.section??hit.id);});document.body.append(menu);menu.openOver({left:x,right:x,top:y,bottom:y,width:0,height:0});}
  /** Ask, on the vocabulary: one field in a sheet; the answer lands as a draft after the pressed block (or in its place, when the judgment said replace), or as the whole page, with Keep · Discard over it. */
  private ask(hit:Hit){this.asking?.close();this.draft?.remove();this.draft=undefined;const level=hit.id==='page'?'page':'section',at=hit.section??hit.id,snapshot=this.state.snapshot,document=this.state.document;
    const context={images:snapshot.images,collections:Object.keys(snapshot.collections),runtimes:{},site:{...(document.title?{name:document.title}:{}),...(document.lang?{lang:document.lang}:{}),...(snapshot.origin?{origin:snapshot.origin}:{})}};
    this.asking=openAsk({level,document:()=>this.state.document,...(level==='section'?{selected:at}:{}),context,land:answer=>{this.asking=undefined;this.landAsk(answer,at);}});}
  private landAsk(answer:AskAnswer,at:string){let anchor:()=>HTMLElement|undefined;
    if(answer.level==='page'){this.state.commit({...this.state.document,...answer.document});this.select(new Set());anchor=()=>this.root;}
    else{const entry=nativeEntries(this.state.document).get(at),parent=entry?.parent??'page',block=answer.block;
      this.state.commit(updateNativeChildren(this.state.document,parent,children=>{if(answer.intent==='replace'&&entry)return children.map(child=>child.id===at?block:child);const index=entry?children.findIndex(child=>child.id===at)+1:children.length;return[...children.slice(0,index),block,...children.slice(index)];}));
      this.select(new Set([block.id]));anchor=()=>this.elements.get(block.id);}
    // The draft is one commit of the history: Discard is Undo while the page still reads as it landed (a save acknowledgement copies the document, so the words are compared, not the object); a later edit makes it an ordinary edit and the bar goes.
    const landed=JSON.stringify(this.state.document);let seen=this.state.document,same=true;const current=()=>{if(this.state.document!==seen){seen=this.state.document;same=JSON.stringify(seen)===landed;}return same;};
    const rect=()=>{const element=anchor();if(!element||!this.active())return null;const box=element.getBoundingClientRect(),frame=this.frame.getBoundingClientRect();return new DOMRect(frame.left+box.left,frame.top+box.top,box.width,box.height);};
    this.draft=openDraftBar({anchor:rect,current,keep:()=>{this.draft=undefined;},discard:()=>{this.draft=undefined;if(current())this.state.undo();}});}
  private addSection(kind:string,after:string){const block=newSection(kind,this.state.snapshot.images,uid);if(!block)return;const entry=nativeEntries(this.state.document).get(after),parent=entry?.parent??'page';this.state.commit(updateNativeChildren(this.state.document,parent,children=>{const at=entry?children.findIndex(child=>child.id===after)+1:children.length;return[...children.slice(0,at),block,...children.slice(at)];}));this.select(new Set([block.id]));const words=firstWordsId(block);if(words)queueMicrotask(()=>this.content.get(words)?.focus());}
  private add(id:string,kind:'content'|'flow'){const entry=nativeEntries(this.state.document).get(id),parent=id==='page'||entry&&'children'in entry.block?id:entry?.parent??'page';const block:NativeBlock=kind==='content'?{id:uid(),kind,source:''}:{id:uid(),kind,direction:'column',gap:20,padding:20,children:[{id:uid(),kind:'content',source:''}]};this.state.commit(updateNativeChildren(this.state.document,parent,children=>[...children,block]));const content=kind==='content'?block.id:(block as Extract<NativeBlock,{kind:'flow'}>).children[0].id;queueMicrotask(()=>this.content.get(content)?.focus());}
  private move(id:string,index:number){const entry=nativeEntries(this.state.document).get(id);if(!entry)return;this.state.commit(updateNativeChildren(this.state.document,entry.parent,children=>{const next=[...children],at=next.findIndex(item=>item.id===id);const[item]=next.splice(at,1);next.splice(Math.max(0,Math.min(index,next.length)),0,item);return next;}));}
  private remove(id:string){const entry=nativeEntries(this.state.document).get(id);if(!entry)return;this.state.commit(updateNativeChildren(this.state.document,entry.parent,children=>children.filter(block=>block.id!==id)));this.selection.delete(id);this.select(new Set(this.selection));}
  private placeBeside(id:string,target:string,at:'start'|'end'){const entries=nativeEntries(this.state.document),from=entries.get(id),to=entries.get(target);if(!from||!to||from.parent!==to.parent||id===target)return;this.state.commit(updateNativeChildren(this.state.document,from.parent,children=>children.filter(block=>block.id!==id).map(block=>block.id===target?{id:uid(),kind:'flow',direction:'row',gap:20,padding:0,children:at==='start'?[from.block,block]:[block,from.block]}:block)));}
  private dragSide=(event:PointerEvent)=>{if(!this.carried)return;const carry=this.carried,rects=carry.rects.map(rect=>({left:rect.left+carry.scrollX-this.view.scrollX,right:rect.right+carry.scrollX-this.view.scrollX,top:rect.top+carry.scrollY-this.view.scrollY,bottom:rect.bottom+carry.scrollY-this.view.scrollY,width:rect.width,height:rect.height}));const result=sidePlacement(rects,carry.ids.indexOf(carry.id),{x:event.clientX,y:event.clientY},20);this.beside=result?{id:carry.ids[result.index],at:result.at}:undefined;this.sideLine.hidden=!result;if(result)Object.assign(this.sideLine.style,{left:`${result.rect.left}px`,top:`${result.rect.top}px`,height:`${result.rect.height}px`});};
  private clearDrag(){this.carried=undefined;this.beside=undefined;this.sideLine.hidden=true;}
  /** Delete hides a block of the page and removes a section's item, down to the kind's minimum. */
  private removeSelection(){let document=this.state.document;const removed=new Map<string,number[]>();for(const id of this.selection){const item=this.items.get(id);if(item)removed.set(item.section,[...removed.get(item.section)??[],item.index]);}for(const[section,indices]of removed)for(const index of indices.sort((a,b)=>b-a))document=removeSectionItem(document,section,index);for(const[id,{block}]of nativeEntries(document)){if(this.selection.has(id))document=updateNativeBlock(document,id,value=>({...value,hidden:true}));else if(block.kind==='content'){const keep=parseBlocks(block.source).filter((_,index)=>!this.selection.has(`text:${id}:${index}`));if(keep.length!==parseBlocks(block.source).length)document=updateNativeBlock(document,id,value=>({...value,source:keep.map(block=>block.source).join('\n\n')} as NativeContent));}}this.state.commit(document);this.select(new Set());}
  /** A link's words, edited in the page: a link block's, or an action's in a section. */
  private editLink(hit:Hit){if(this.plain?.id===hit.id)return;this.finishPlain();const node=this.elements.get(hit.id)??this.root.querySelector<HTMLElement>(`[data-native-block="${CSS.escape(hit.id)}"]`);if(!node)return;const anchor=node.matches('a')?null:node.querySelector<HTMLElement>('a'),element=anchor??node;
    if(hit.section&&hit.path){const section=this.sectionAt(hit.section),current=section?readAt(section,hit.path) as {text?:string}|undefined:undefined;if(typeof current?.text!=='string')return;const path=[...hit.path,'text'];const editor=createPlainEditor(element,{value:current.text,onChange:text=>this.updateSection(hit.section!,value=>writeAt(value,path,text))});this.plain={id:hit.id,editor};editor.focus();return;}
    const block=nativeEntries(this.state.document).get(hit.id)?.block;if(block?.kind!=='link')return;const editor=createPlainEditor(element,{value:block.text,onChange:text=>this.patch(hit.id,{text})});this.plain={id:hit.id,editor};editor.focus();}
  /** A plain line of a section (a question, a name, a value, a column's heading, a line), edited in the page. */
  private editPlain(hit:Hit,node:HTMLElement){if(this.plain?.id===hit.id)return;this.finishPlain();const section=this.sectionAt(hit.section!),current=section?readAt(section,hit.path!):undefined;if(typeof current!=='string')return;const inner=node.localName==='summary'?null:node.querySelector<HTMLElement>(':scope>a,:scope>span'),element=inner??node;const path=hit.path!,editor=createPlainEditor(element,{value:current,placeholder:placeholderWords(path.at(-1)!),onChange:text=>this.updateSection(hit.section!,value=>writeAt(value,path,text))});this.plain={id:hit.id,editor};editor.focus();}
  private finishPlain(){const current=this.plain;if(!current)return;this.plain=undefined;current.editor.destroy();this.reconcile();}
  private chooseImage(anchor:HTMLElement):Promise<{src:string;alt:string}|null>{return new Promise(resolve=>{this.menu?.remove();const menu=this.menu=createSurfaceContext('Choose an image',anchor);let completed=false;const finish=(value:{src:string;alt:string}|null)=>{if(completed)return;completed=true;menu.remove();resolve(value);};menu.addEventListener('ds-menu-close',()=>finish(null));for(const src of this.state.snapshot.images){const row=document.createElement('button');row.type='button';row.setAttribute('role','menuitem');row.textContent=src.split('/').pop()??src;row.onclick=()=>finish({src,alt:row.textContent??''});menu.append(row);}if(!this.state.snapshot.images.length){const text=document.createElement('span');text.textContent='This site has no images yet.';menu.append(text);}const box=anchor.getBoundingClientRect(),frame=this.frame.getBoundingClientRect();document.body.append(menu);menu.openOver({left:frame.left+box.left,right:frame.left+box.right,top:frame.top+box.top,bottom:frame.top+box.bottom,width:box.width,height:box.height});});}
  private status(){this.notice.replaceChildren();const message=this.state.error||this.error;this.notice.hidden=!message;if(!message)return;this.notice.append(document.createTextNode(message));const button=document.createElement('button');button.type='button';button.textContent=this.state.error?'Try again':'Dismiss';button.onclick=()=>{if(this.state.error)void this.state.flush();else{this.error='';this.status();}};this.notice.append(button);if(this.state.error){const latest=document.createElement('button');latest.type='button';latest.textContent='Use latest page';latest.onclick=()=>{latest.textContent='Discard changes and open latest';latest.onclick=()=>{this.state.discard();this.reopen();};};this.notice.append(latest);}}
  get pending(){return this.state.dirty||this.state.busy||[...this.content.values()].some(content=>content.pending);}
  async flush(){(this.doc.activeElement as HTMLElement|null)?.blur?.();this.surface.cancelMarquee();this.sort.cancel();this.finishPlain();return this.state.flush();}
  destroy(){this.disposed=true;this.finishPlain();this.asking?.close();this.draft?.remove();this.state.destroy();this.sort.destroy();this.surface.destroy();this.spacing.destroy();this.resize.disconnect();for(const content of this.content.values())content.destroy();for(const binding of this.resizers.values())binding.dispose();this.menuDispose?.();this.menu?.remove();this.notice.remove();this.style.remove();this.overlay.remove();this.view.cancelAnimationFrame(this.raf);this.doc.removeEventListener('pointerdown',this.down);this.doc.removeEventListener('pointermove',this.dragSide,true);this.doc.removeEventListener('click',this.click,true);this.doc.removeEventListener('contextmenu',this.context,true);this.doc.removeEventListener('keydown',this.key,true);document.removeEventListener('keydown',this.key);this.view.removeEventListener('scroll',this.schedule,true);this.view.removeEventListener('resize',this.schedule);}
}
/** A section without the member at this path: an optional tone put back to the library's default. */
function dropAt(section:NativeSection,path:readonly string[]):NativeSection{const parent=readAt(section,path.slice(0,-1)) as Record<string,unknown>|undefined;if(!parent)return section;const next={...parent};delete next[path.at(-1)!];return writeAt(section,path.slice(0,-1),next);}
