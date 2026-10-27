import { nativeBlockStyles, renderNativeBlock, type NativeBlock, type NativeContent, type NativePageDocument, type NativeCollectionData } from '../../../shared/consistency-native-page';
import { DocumentState } from './document-state';
import { EditorSurface } from './editor-surface';
import { NativeContentSurface } from './native-content-surface';
import { TextSpacingLayer, type SpacingTarget } from './text-spacing';
import { bindResizeEdges } from './resize';
import { createSurfaceContext, appendSurfaceOptions } from './surface-context';
import { createButtonActionControls } from './button-action';
import { createPlainEditor, parseBlocks, sidePlacement } from '../../../website/src/vendor/aa/aa';
import { nativeEntries, nativeGridSpaces, updateNativeBlock, updateNativeChildren } from './native-page-model';
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
type Measure = 'gap'|'mobileGap'|'padding'|'rowGap'|'columnGap'|'width'|'height'|'mobileHeight'|'imageHeight'|'featuredImageHeight'|'mobileImageHeight';
const uid=()=>`block_${crypto.randomUUID().replaceAll('-','').slice(0,16)}`;
const label=(block:NativeBlock)=>block.kind==='flow'?(block.role??'Section'):block.kind==='collection'?'Collection':block.kind==='content'?'Content':block.kind.charAt(0).toUpperCase()+block.kind.slice(1);

/** Native pages edit the same typed blocks the publisher renders; there is no HTML-layout inference. */
export class NativeSiteController {
  readonly state:DocumentState<NativePageDocument,NativePageSnapshot>;
  private doc:Document; private view:Window; private root:HTMLElement; private overlay:HTMLElement; private style:HTMLStyleElement;
  private surface:EditorSurface; private spacing:TextSpacingLayer; private sort:SortableController; private resize:ResizeObserver;
  private elements=new Map<string,HTMLElement>(); private content=new Map<string,NativeContentSurface>();
  private selection=new Set<string>(); private preview=new Map<string,Partial<Record<Measure,number>>>();
  private resizers=new Map<string,ReturnType<typeof bindResizeEdges>>(); private resizeTargets=new Map<string,HTMLElement>(); private sorts=new Map<string,{parent:string;dispose():void}>(); private containers=new Map<string,{axis:string;dispose():void}>();
  private menu?:ReturnType<typeof createSurfaceContext>; private menuDispose?:()=>void;
  private notice=document.createElement('div'); private error=''; private disposed=false; private busy=false; private raf=0;
  private plain?:{id:string;editor:ReturnType<typeof createPlainEditor>};
  private carried?:{id:string;parent:string;ids:string[];rects:DOMRect[];scrollX:number;scrollY:number}; private beside?:{id:string;at:'start'|'end'}; private sideLine:HTMLElement;
  constructor(private frame:HTMLIFrameElement,snapshot:NativePageSnapshot,save:NativePageSave,private reopen:()=>void){
    this.doc=frame.contentDocument!;this.view=this.doc.defaultView!;this.root=this.doc.querySelector<HTMLElement>('[data-c9y-native-root]')!;
    if(!this.root)throw new Error('The native page could not be opened.');
    this.state=new DocumentState(snapshot,save,()=>this.changed());
    this.style=this.doc.createElement('style');this.style.textContent=surfaceStyles+spacingStyles+resizeStyles+aaStyles+elementsStyles+insertionStyles+carouselStyles+columnStyles+cardStyles+`
      .consistency-native-guides{position:fixed;inset:0;pointer-events:none;z-index:2147482000;overflow:visible}.consistency-native-guides [hidden]{display:none!important}.consistency-native-guides .ghost-surface,.consistency-native-guides .consistency-resize-edge{pointer-events:auto;position:absolute;min-height:0}.consistency-native-guides .ghost-measure{font-family:var(--ds-typeface-regular);font-size:10px;line-height:20px}.consistency-site-region{position:relative;min-width:0}.c9y-native-content .consistency-sheet{min-width:0}.c9y-native-content aa-editor{display:block}.c9y-native-link .aa-block{display:inline}.c9y-native-page [data-native-block]{position:relative}`;
    this.doc.head.append(this.style);
    this.overlay=this.doc.createElement('div');this.overlay.className='consistency-shell production-on consistency-native-guides';this.overlay.setAttribute('data-editor-chrome','');
    const tokens=getComputedStyle(document.documentElement);for(const name of ['--ds-pink','--ds-text-color','--ds-paper','--ds-radius','--ds-typeface-regular'])this.overlay.style.setProperty(name,tokens.getPropertyValue(name));
    this.overlay.style.setProperty('--sf','1');this.overlay.style.setProperty('--u','20px');this.doc.body.append(this.overlay);
    this.root.classList.add('consistency-sheet','production-on');this.root.style.setProperty('--consistency-selection-color',tokens.getPropertyValue('--ds-text-color'));
    this.sideLine=this.doc.createElement('div');this.sideLine.className='aa-drop-line aa-drop-side';this.sideLine.hidden=true;this.overlay.append(this.sideLine);
    this.surface=new EditorSurface(this.root,{selection:()=>this.selection,select:value=>this.select(value),marquee:()=>this.active(),reorder:()=>this.active(),contextRoot:document.body,contextChanged:active=>{this.overlay.classList.toggle('context-active',active);this.refresh();}});
    this.spacing=new TextSpacingLayer(this.root,{enabled:()=>this.enabled(),targets:()=>this.targets(),value:(key,fallback)=>{const [id,property]=key.split(':');return this.preview.get(id)?.[property as Measure]??this.value(id,property as Measure)??fallback;},select:()=>{},
      preview:(key,value)=>{const[id,property]=key.split(':');this.preview.set(id,{...this.preview.get(id),[property]:value});this.paintMeasures();this.refresh();},
      commit:(key,value)=>{const[id,property]=key.split(':');this.preview.clear();this.measure(id,property as Measure,value);},cancel:()=>{this.preview.clear();this.paintMeasures();},started:()=>{this.busy=true;},ended:()=>{this.busy=false;this.changed();}});
    this.sort=this.surface.sortable({lockAxis:undefined,onDragStart:({draggableId})=>{this.busy=true;this.select(new Set([draggableId]));const entries=nativeEntries(this.state.document),entry=entries.get(draggableId);if(!entry)return;const ids=[...entries].filter(([,value])=>value.parent===entry.parent).map(([id])=>id);this.carried={id:draggableId,parent:entry.parent,ids,rects:ids.map(id=>this.elements.get(id)!.getBoundingClientRect()),scrollX:this.view.scrollX,scrollY:this.view.scrollY};},prepareDrop:result=>{this.busy=false;if(result.reason==='DROP'){if(this.beside)this.placeBeside(result.draggableId,this.beside.id,this.beside.at);else if(result.destination)this.move(result.draggableId,result.destination.index);}this.clearDrag();return this.elements.get(result.draggableId)??null;},onDragEnd:()=>{this.busy=false;this.clearDrag();if(!this.disposed)this.changed();}});
    this.notice.className='consistency-site-save-notice';this.notice.setAttribute('role','status');this.notice.hidden=true;frame.parentElement?.append(this.notice);
    this.doc.addEventListener('pointerdown',this.down);this.doc.addEventListener('pointermove',this.dragSide,true);this.doc.addEventListener('click',this.click,true);this.doc.addEventListener('contextmenu',this.context,true);this.doc.addEventListener('keydown',this.key,true);document.addEventListener('keydown',this.key);
    this.view.addEventListener('scroll',this.schedule,true);this.view.addEventListener('resize',this.schedule);this.resize=new ResizeObserver(this.schedule);this.resize.observe(this.root);this.changed();
  }
  private active(){return !this.disposed&&!this.frame.closest('[hidden]')&&this.frame.getBoundingClientRect().width>0;}
  private enabled(){return this.active()&&!this.surface.contextActive;}
  private scale(element:HTMLElement){return Number.parseFloat(this.view.getComputedStyle(element).getPropertyValue('--sf'))||1;}
  private select(value:Set<string>){this.selection=value;this.surface?.paintSelection();}
  private value(id:string,property:Measure):number|undefined {if(id==='page')return this.state.document.layout[property as 'gap'|'padding'];const block=nativeEntries(this.state.document).get(id)?.block;return block?.[property as keyof typeof block] as number|undefined;}
  private measure(id:string,property:Measure,value:number){const rounded=Math.max(0,Math.min(property==='width'?10000:2000,Math.round(value/20)*20));if(!Number.isFinite(rounded))return;if(id==='page')this.state.commit({...this.state.document,layout:{...this.state.document.layout,[property]:rounded}});else this.patch(id,{[property]:rounded});}
  private patch(id:string,patch:Partial<NativeBlock>){this.state.commit(updateNativeBlock(this.state.document,id,block=>({...block,...patch} as NativeBlock)));}
  private imageURL=(source:string)=>/^\/media\/uploads\/[^/]+$/.test(source)&&this.state.snapshot.origin?new URL(source,this.state.snapshot.origin).href:source.startsWith('/')&&this.state.snapshot.images.includes(source)?new URL(this.frame.src).pathname.replace(/\/document$/,'/files')+source:source;
  private changed(){if(this.disposed)return;if(this.busy){this.status();return;}this.reconcile();this.paintMeasures();this.bindSort();this.bindResizers();this.refresh();this.status();}
  private reconcile(){
    const present=new Set<string>();
    const visit=(blocks:NativeBlock[],parent:HTMLElement)=>{let index=0;for(const block of blocks){present.add(block.id);let element=this.elements.get(block.id)??this.root.querySelector<HTMLElement>(`[data-c9y-block="${CSS.escape(block.id)}"]`)??undefined;
      if(!element){const template=this.doc.createElement('template');template.innerHTML=renderNativeBlock(block,{images:this.state.snapshot.images,collections:this.state.snapshot.collections,editor:true});element=template.content.firstElementChild as HTMLElement;}
      this.elements.set(block.id,element);element.dataset.selectable=block.id;element.dataset.sortGroup=block.id;
      const siblings=[...parent.children].filter(child=>child.hasAttribute('data-c9y-block'));if(siblings[index]!==element)parent.insertBefore(element,siblings[index]??null);index++;
      if('children'in block)visit(block.children,block.kind==='flow'&&block.disclosure?element.querySelector<HTMLElement>(':scope>.c9y-native-disclosure')!:element);
      else if(block.kind==='content'){
        let content=this.content.get(block.id);if(!content){content=new NativeContentSurface(element,block.id,{read:()=>nativeEntries(this.state.document).get(block.id)!.block as NativeContent,commit:value=>this.patch(block.id,value),undo:()=>{const ok=this.state.canUndo;this.state.undo();return ok;},redo:()=>{const ok=this.state.canRedo;this.state.redo();return ok;},enabled:()=>this.enabled(),select:()=>{},media:{chooseImage:anchor=>this.chooseImage(anchor)},imageURL:this.imageURL,error:message=>{this.error=message;this.status();}});this.content.set(block.id,content);}content.refresh();
      }else if(block.kind==='image'){const image=element.querySelector('img')!;image.src=this.imageURL(block.src);image.alt=block.alt;}
      else if(block.kind==='link'&&this.plain?.id!==block.id){const link=element.querySelector('a')!;link.textContent=block.text;link.href=block.href;link.className=block.appearance&&block.appearance!=='plain'?`ds-button${block.appearance==='default'?'':` ds-button--${block.appearance}`}`:'ds-link c9y-native-link';}
    }};
    visit(this.state.document.blocks,this.root);
    for(const[id,element]of this.elements)if(!present.has(id)){this.content.get(id)?.destroy();this.content.delete(id);this.resizers.get(id)?.dispose();this.resizers.delete(id);element.remove();this.elements.delete(id);}
  }
  private paintMeasures(){
    const layout={...this.state.document.layout,...this.preview.get('page')};this.root.style.setProperty('--c9y-page-padding',`calc(${layout.padding}px * var(--sf,1))`);this.root.style.setProperty('--c9y-page-gap',`calc(${layout.gap}px * var(--sf,1))`);
    for(const[id,{block}]of nativeEntries(this.state.document)){const element=this.elements.get(id);if(!element)continue;const value={...block,...this.preview.get(id)} as NativeBlock;for(const key of ['width','flex','--c9y-direction','--c9y-mobile-direction','--c9y-gap','--c9y-mobile-gap','--c9y-padding','--c9y-columns','--c9y-mobile-columns','--c9y-column-gap','--c9y-row-gap','--c9y-item-span','--c9y-featured-span','--c9y-image-height','--c9y-featured-image-height','--c9y-mobile-image-height','--c9y-image-fit'])element.style.removeProperty(key);for(const[key,measure]of Object.entries(nativeBlockStyles(value)))element.style.setProperty(key,measure);element.hidden=!!block.hidden;if(block.kind==='flow')element.dataset.direction=block.direction;}
  }
  private targets():SpacingTarget[]{
    const targets:SpacingTarget[]=[];
    const add=(id:string,property:Measure,element:HTMLElement,axis:'horizontal'|'vertical',rect:()=>{left:number;top:number;width:number;height:number},suffix:number)=>{const fallback=this.value(id,property)??0;targets.push({id:`${id}:${property}:${suffix}`,element,host:this.overlay,label:`${id==='page'?'Page':label(nativeEntries(this.state.document).get(id)!.block)} ${property==='columnGap'?'column gap':property==='rowGap'?'row gap':property==='mobileGap'?'gap':property}`,axis,kind:property==='padding'?'padding':'gap',fallback,rect});};
    const spaces=(id:string,element:HTMLElement,children:HTMLElement[],grid:boolean)=>{const boxes=children.filter(child=>!child.hidden&&child.getBoundingClientRect().height>0).map(child=>child.getBoundingClientRect());const layout=nativeGridSpaces(boxes);layout.forEach((space,index)=>{const block=nativeEntries(this.state.document).get(id)?.block;const property=grid?(space.axis==='horizontal'?'columnGap':'rowGap'):block?.kind==='flow'&&this.view.innerWidth<=700&&block.mobileGap!==undefined?'mobileGap':'gap';add(id,property,element,space.axis,()=>{const current=nativeGridSpaces(children.filter(child=>!child.hidden&&child.getBoundingClientRect().height>0).map(child=>child.getBoundingClientRect()));return current[index]?.box??space.box;},index);});};
    const childElements=(element:HTMLElement)=>[...element.children].filter(child=>child.hasAttribute('data-c9y-block')) as HTMLElement[];
    spaces('page',this.root,childElements(this.root),false);
    for(const[id,{block}]of nativeEntries(this.state.document)){const element=this.elements.get(id)!;if(block.hidden||!element.getBoundingClientRect().height)continue;
      if(block.kind==='flow'||block.kind==='grid'){const container=block.kind==='flow'&&block.disclosure?element.querySelector<HTMLElement>(':scope>.c9y-native-disclosure')!:element;spaces(id,element,childElements(container),block.kind==='grid');}
      if(block.kind==='collection')spaces(id,element,[...element.querySelectorAll<HTMLElement>(':scope>.c9y-native-collection-item')],true);
      if(block.kind==='flow')add(id,'padding',element,'vertical',()=>{const box=element.getBoundingClientRect(),padding=Number.parseFloat(this.view.getComputedStyle(element).paddingTop)||0;return{left:box.left,top:box.top-(padding<1?10*this.scale(element):0),width:box.width,height:padding};},0);
    }
    add('page','padding',this.root,'vertical',()=>{const box=this.root.getBoundingClientRect(),padding=Number.parseFloat(this.view.getComputedStyle(this.root).paddingTop)||0;return{left:box.left,top:box.top-(padding<1?10*this.scale(this.root):0),width:box.width,height:padding};},0);
    return targets;
  }
  private bindSort(){
    const entries=nativeEntries(this.state.document);
    for(const[id,item]of this.sorts)if(!entries.has(id)||entries.get(id)!.parent!==item.parent){item.dispose();this.sorts.delete(id);}
    const parents=new Map<string,{element:HTMLElement;axis:'horizontal'|'vertical'}>([['page',{element:this.root,axis:'vertical'}]]);
    for(const[id,{block}]of entries)if('children'in block)parents.set(id,{element:block.kind==='flow'&&block.disclosure?this.elements.get(id)!.querySelector<HTMLElement>(':scope>.c9y-native-disclosure')!:this.elements.get(id)!,axis:block.kind==='flow'&&block.direction==='row'?'horizontal':'vertical'});
    for(const[id,item]of this.containers)if(!parents.has(id)||parents.get(id)!.axis!==item.axis){item.dispose();this.containers.delete(id);}
    for(const[id,parent]of parents)if(!this.containers.has(id))this.containers.set(id,{axis:parent.axis,dispose:this.sort.container({id,type:id,element:parent.element,axis:parent.axis,label:id==='page'?'Page':label(entries.get(id)!.block)})});
    for(const[id,entry]of entries)if(!this.sorts.has(id)){const element=this.elements.get(id)!;this.sorts.set(id,{parent:entry.parent,dispose:this.sort.item({id,type:entry.parent,element,label:label(entry.block),canDrag:({target})=>this.enabled()&&!this.root.hasAttribute('data-pointer-additive')&&!!target&&!target.closest('[data-editor-chrome],aa-editor,[contenteditable],button,input,textarea,select,a,summary')})});}
  }
  private bindResizers(){
    for(const[key,target]of this.resizeTargets)if(!target.isConnected){this.resizers.get(key)?.dispose();this.resizers.delete(key);this.resizeTargets.delete(key);}
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
            paintSize:size=>{this.preview.set(id,{[property()]:size.height});this.paintMeasures();this.refresh();},save:size=>{this.preview.clear();this.measure(id,property(),size.height);},cancelSettle:()=>{},settle:async update=>{await update();}}));
        }
      }
      if(block.kind==='runtime'||this.resizers.has(id))continue;
      const heightProperty=():Measure=>block.kind==='image'&&this.view.innerWidth<=700&&block.mobileHeight!==undefined?'mobileHeight':'height';
      let original='';this.resizeTargets.set(id,element);
      this.resizers.set(id,bindResizeEdges(element,{host:this.overlay,name:label(block),box:block.kind==='image',enabled:()=>this.enabled()&&!element.hidden,scale:()=>this.scale(element),size:()=>{const rect=element.getBoundingClientRect(),sf=this.scale(element);return{width:rect.width/sf,height:rect.height/sf};},minimumWidth:()=>80,minimumHeight:()=>80,maxWidth:()=>Math.max(80,(element.parentElement?.clientWidth??10000)/this.scale(element)),
        begin:()=>{this.busy=true;original=element.style.cssText;},end:cancelled=>{this.busy=false;if(cancelled)element.style.cssText=original;this.refresh();},
        paintSize:size=>{element.style.width=`calc(${size.width}px * var(--sf,1))`;element.style.flex='0 1 auto';if(block.kind==='image')element.style.setProperty(heightProperty()==='mobileHeight'?'--c9y-mobile-image-height':'--c9y-image-height',`calc(${size.height}px * var(--sf,1))`);this.refresh();},
        save:size=>this.patch(id,{width:Math.round(size.width),...(block.kind==='image'?{[heightProperty()]:Math.round(size.height)}:{})}),cancelSettle:()=>{},settle:async update=>{await update();}}));
    }
  }
  private refresh(){if(this.disposed)return;this.spacing?.refresh();this.surface?.paintSelection();for(const[id,binding]of this.resizers){const target=this.resizeTargets.get(id);if(!target)continue;const rect=target.getBoundingClientRect();for(const edge of binding.edges){edge.dataset.nativeResize=id;edge.hidden=!this.enabled()||target.hidden||!rect.height;edge.tabIndex=edge.hidden?-1:0;if(edge.classList.contains('consistency-resize-width'))Object.assign(edge.style,{left:`${rect.right-3}px`,top:`${rect.top}px`,width:'6px',height:`${rect.height}px`});else if(edge.classList.contains('consistency-resize-height'))Object.assign(edge.style,{left:`${rect.left}px`,top:`${rect.bottom-3}px`,width:`${rect.width}px`,height:'6px'});else Object.assign(edge.style,{left:`${rect.right-6}px`,top:`${rect.bottom-6}px`});}}
    for(const content of this.content.values())content.refresh();
  }
  private schedule=()=>{if(!this.raf)this.raf=this.view.requestAnimationFrame(()=>{this.raf=0;this.refresh();});};
  private down=(event:PointerEvent)=>{if(this.menu?.open){this.menu.requestClose('outside');this.menu.remove();}this.surface.startMarquee(event);};
  private click=(event:MouseEvent)=>{const target=event.target as Element;if(event.defaultPrevented||target.closest('aa-editor,[contenteditable],[data-editor-chrome]'))return;const element=target.closest<HTMLElement>('[data-c9y-block]'),block=element?nativeEntries(this.state.document).get(element.dataset.c9yBlock!)?.block:undefined;if(!block)return;if(block.kind==='link'&&!event.metaKey&&!event.ctrlKey){event.preventDefault();this.editLink(block.id);return;}if(target.closest('a,button,input,textarea,select,summary'))return;if(!event.shiftKey)this.select(new Set([block.id]));};
  private key=(event:KeyboardEvent)=>{if(!this.active()||event.defaultPrevented||(event.target as Element)?.closest?.('aa-editor,[contenteditable],input,textarea,select'))return;if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.stopPropagation();event.shiftKey?this.state.redo():this.state.undo();}else if(event.key==='Escape'){this.surface.cancelMarquee();this.select(new Set());this.menu?.remove();}else if(['Delete','Backspace'].includes(event.key)&&this.selection.size){event.preventDefault();this.removeSelection();}else if(event.altKey&&['ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const id=[...this.selection][0],entry=nativeEntries(this.state.document).get(id);if(entry)this.move(id,entry.index+(event.key==='ArrowUp'?-1:1));}};
  private context=(event:MouseEvent)=>{const target=event.target as Element;if(target.closest('aa-editor,[contenteditable],[data-editor-chrome]'))return;event.preventDefault();event.stopPropagation();const id=target.closest<HTMLElement>('[data-c9y-block]')?.dataset.c9yBlock;if(id&&!this.selection.has(id))this.select(new Set([id]));const box=this.frame.getBoundingClientRect();this.openMenu(id??'page',box.left+event.clientX,box.top+event.clientY);};
  private openMenu(id:string,x:number,y:number){this.finishPlain();this.menuDispose?.();this.menu?.remove();const block=nativeEntries(this.state.document).get(id)?.block,menu=this.menu=createSurfaceContext(block?label(block):'Page');const action=(text:string,run:()=>void)=>{const button=document.createElement('button');button.type='button';button.setAttribute('role','menuitem');button.textContent=text;button.onclick=run;menu.append(button);};
    action('Add content',()=>{this.add(id,'content');menu.remove();});action('Add section',()=>{this.add(id,'flow');menu.remove();});
    if(block?.kind==='image')action('Choose image',()=>{void this.chooseImage(this.elements.get(id)!).then(image=>{if(image)this.patch(id,image);});});
    if(block?.kind==='link'){action('Default button',()=>this.patch(id,{appearance:'default'}));appendSurfaceOptions(menu,'button',patch=>this.patch(id,patch));const controls=createButtonActionControls(document,{kind:'link',target:block.href},()=>true,action=>{if(action)this.patch(id,{href:action.target});});menu.append(controls.element);this.menuDispose=controls.dispose;}
    if(block){action('Move up',()=>{const entry=nativeEntries(this.state.document).get(id);if(entry)this.move(id,entry.index-1);});action('Move down',()=>{const entry=nativeEntries(this.state.document).get(id);if(entry)this.move(id,entry.index+1);});action(block.hidden?'Show':'Hide',()=>{this.patch(id,{hidden:!block.hidden});menu.remove();});}
    for(const[hidden,{block}]of nativeEntries(this.state.document))if(block.hidden)action(`Show ${label(block)}`,()=>{this.patch(hidden,{hidden:false});menu.remove();});
    if(this.state.canUndo)action('Undo',()=>this.state.undo());if(this.state.canRedo)action('Redo',()=>this.state.redo());
    document.body.append(menu);menu.openOver({left:x,right:x,top:y,bottom:y,width:0,height:0});
  }
  private add(id:string,kind:'content'|'flow'){const entry=nativeEntries(this.state.document).get(id),parent=id==='page'||entry&&'children'in entry.block?id:entry?.parent??'page';const block:NativeBlock=kind==='content'?{id:uid(),kind,source:''}:{id:uid(),kind,direction:'column',gap:20,padding:20,children:[{id:uid(),kind:'content',source:''}]};this.state.commit(updateNativeChildren(this.state.document,parent,children=>[...children,block]));const content=kind==='content'?block.id:(block as Extract<NativeBlock,{kind:'flow'}>).children[0].id;queueMicrotask(()=>this.content.get(content)?.focus());}
  private move(id:string,index:number){const entry=nativeEntries(this.state.document).get(id);if(!entry)return;this.state.commit(updateNativeChildren(this.state.document,entry.parent,children=>{const next=[...children],at=next.findIndex(item=>item.id===id);const[item]=next.splice(at,1);next.splice(Math.max(0,Math.min(index,next.length)),0,item);return next;}));}
  private placeBeside(id:string,target:string,at:'start'|'end'){const entries=nativeEntries(this.state.document),from=entries.get(id),to=entries.get(target);if(!from||!to||from.parent!==to.parent||id===target)return;this.state.commit(updateNativeChildren(this.state.document,from.parent,children=>children.filter(block=>block.id!==id).map(block=>block.id===target?{id:uid(),kind:'flow',direction:'row',gap:20,padding:0,children:at==='start'?[from.block,block]:[block,from.block]}:block)));}
  private dragSide=(event:PointerEvent)=>{if(!this.carried)return;const carry=this.carried,rects=carry.rects.map(rect=>({left:rect.left+carry.scrollX-this.view.scrollX,right:rect.right+carry.scrollX-this.view.scrollX,top:rect.top+carry.scrollY-this.view.scrollY,bottom:rect.bottom+carry.scrollY-this.view.scrollY,width:rect.width,height:rect.height}));const result=sidePlacement(rects,carry.ids.indexOf(carry.id),{x:event.clientX,y:event.clientY},20);this.beside=result?{id:carry.ids[result.index],at:result.at}:undefined;this.sideLine.hidden=!result;if(result)Object.assign(this.sideLine.style,{left:`${result.rect.left}px`,top:`${result.rect.top}px`,height:`${result.rect.height}px`});};
  private clearDrag(){this.carried=undefined;this.beside=undefined;this.sideLine.hidden=true;}
  private removeSelection(){let document=this.state.document;for(const[id,{block}]of nativeEntries(document)){if(this.selection.has(id))document=updateNativeBlock(document,id,value=>({...value,hidden:true}));else if(block.kind==='content'){const keep=parseBlocks(block.source).filter((_,index)=>!this.selection.has(`text:${id}:${index}`));if(keep.length!==parseBlocks(block.source).length)document=updateNativeBlock(document,id,value=>({...value,source:keep.map(block=>block.source).join('\n\n')} as NativeContent));}}this.state.commit(document);this.select(new Set());}
  private editLink(id:string){if(this.plain?.id===id)return;this.finishPlain();const block=nativeEntries(this.state.document).get(id)?.block,element=this.elements.get(id)?.querySelector<HTMLElement>('a');if(block?.kind!=='link'||!element)return;const editor=createPlainEditor(element,{value:block.text,onChange:text=>this.patch(id,{text})});this.plain={id,editor};editor.focus();}
  private finishPlain(){const current=this.plain;if(!current)return;this.plain=undefined;current.editor.destroy();this.reconcile();}
  private chooseImage(anchor:HTMLElement):Promise<{src:string;alt:string}|null>{return new Promise(resolve=>{this.menu?.remove();const menu=this.menu=createSurfaceContext('Choose an image',anchor);let completed=false;const finish=(value:{src:string;alt:string}|null)=>{if(completed)return;completed=true;menu.remove();resolve(value);};menu.addEventListener('ds-menu-close',()=>finish(null));for(const src of this.state.snapshot.images){const row=document.createElement('button');row.type='button';row.setAttribute('role','menuitem');row.textContent=src.split('/').pop()??src;row.onclick=()=>finish({src,alt:row.textContent??''});menu.append(row);}if(!this.state.snapshot.images.length){const text=document.createElement('span');text.textContent='This site has no images yet.';menu.append(text);}const box=anchor.getBoundingClientRect(),frame=this.frame.getBoundingClientRect();document.body.append(menu);menu.openOver({left:frame.left+box.left,right:frame.left+box.right,top:frame.top+box.top,bottom:frame.top+box.bottom,width:box.width,height:box.height});});}
  private status(){this.notice.replaceChildren();const message=this.state.error||this.error;this.notice.hidden=!message;if(!message)return;this.notice.append(document.createTextNode(message));const button=document.createElement('button');button.type='button';button.textContent=this.state.error?'Try again':'Dismiss';button.onclick=()=>{if(this.state.error)void this.state.flush();else{this.error='';this.status();}};this.notice.append(button);if(this.state.error){const latest=document.createElement('button');latest.type='button';latest.textContent='Use latest page';latest.onclick=()=>{latest.textContent='Discard changes and open latest';latest.onclick=()=>{this.state.discard();this.reopen();};};this.notice.append(latest);}}
  get pending(){return this.state.dirty||this.state.busy||[...this.content.values()].some(content=>content.pending);}
  async flush(){(this.doc.activeElement as HTMLElement|null)?.blur?.();this.surface.cancelMarquee();this.sort.cancel();this.finishPlain();return this.state.flush();}
  destroy(){this.disposed=true;this.finishPlain();this.state.destroy();this.sort.destroy();this.surface.destroy();this.spacing.destroy();this.resize.disconnect();for(const content of this.content.values())content.destroy();for(const binding of this.resizers.values())binding.dispose();this.menuDispose?.();this.menu?.remove();this.notice.remove();this.style.remove();this.overlay.remove();this.view.cancelAnimationFrame(this.raf);this.doc.removeEventListener('pointerdown',this.down);this.doc.removeEventListener('pointermove',this.dragSide,true);this.doc.removeEventListener('click',this.click,true);this.doc.removeEventListener('contextmenu',this.context,true);this.doc.removeEventListener('keydown',this.key,true);document.removeEventListener('keydown',this.key);this.view.removeEventListener('scroll',this.schedule,true);this.view.removeEventListener('resize',this.schedule);}
}
