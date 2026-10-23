import { bindSpacingHandle } from '../../app/src/2-core/spacing-handle';
import { pointerGain } from './model';
import './column-spacing.css';
type GapState = { enabled(): boolean; value(id: string, fallback: number): number; select(id: string): void; preview(id: string, value: number): void; commit(id: string, value: number, pointer: boolean): void; cancel(): void };
/** Column layout and its empty space belong to composition, outside Aa's source. */
export class ColumnSpacingLayer {
 private handles = new Map<string,{host:HTMLElement;atom:HTMLElement;next:HTMLElement;dispose():void}>();
 private nativeDefaults = new WeakMap<Element,number>();
 private defaults = new Map<string,number>();
 private seen = new WeakSet<Element>();
 private frame=0;
 private observer=new MutationObserver(()=>this.schedule());
 private resize=new ResizeObserver(()=>this.schedule());
 constructor(private root:HTMLElement,private state:GapState){}
 defaultValue(id:string){return this.defaults.get(id);}
 private schedule(){if(!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.refresh();});}
 refresh(){
  const present=new Set<string>();
  this.root.querySelectorAll<HTMLElement>('aa-editor[data-editor-key]').forEach(editor=>{
   if(!this.seen.has(editor)){this.seen.add(editor);this.observer.observe(editor,{childList:true,characterData:true,subtree:true});this.resize.observe(editor);}
   editor.querySelectorAll<HTMLElement>('.aa-atom.aa-columns').forEach((atom,atomIndex)=>{
    const columns=Array.from(atom.querySelectorAll<HTMLElement>(':scope>.aa-column'));if(columns.length<2)return;
    const scale=Number.parseFloat(getComputedStyle(atom).getPropertyValue('--sf'))||1;
    const measured=Number.parseFloat(getComputedStyle(atom).columnGap)/scale;
    if(!this.nativeDefaults.has(atom))this.nativeDefaults.set(atom,Number.isFinite(measured)?measured:40);
    const nativeGap=this.nativeDefaults.get(atom)!;
    const ids=columns.slice(1).map((_,index)=>`columns:${editor.dataset.editorKey}:${atomIndex}:${index}`);
    ids.forEach(id=>{if(!this.defaults.has(id))this.defaults.set(id,Math.round(nativeGap/20)*20);present.add(id);});
    const gaps=ids.map(id=>this.state.value(id,this.defaults.get(id)!));
    const units=columns.map(column=>{
     const blocks=Array.from(column.querySelectorAll<HTMLElement>(':scope>.aa-block')).filter(block=>block.textContent?.trim()||block.querySelector('.aa-atom'));
     if(blocks.length!==1)return null;
     return blocks[0].querySelector<HTMLElement>('ds-card,ds-button,.aa-atom[data-atom="image"],.consistency-carousel-frame');
    });
    for(const node of [atom,...columns,...units.filter((unit):unit is HTMLElement=>!!unit)])if(!this.seen.has(node)){this.seen.add(node);this.resize.observe(node);}
    const available=atom.clientWidth/scale;
    const unitWidths=units.map(unit=>unit?unit.getBoundingClientRect().width/scale:200);
    const required=unitWidths.reduce((sum,width)=>sum+width,0)+gaps.reduce((sum,gap)=>sum+gap,0);
    const stacked=!!this.root.querySelector('.consistency-mobile-preview')||required>available+.5;
    const textCount=units.filter(unit=>!unit).length;
    const extra=textCount?Math.max(0,available-required)/textCount:0;
    const widths=unitWidths.map((width,index)=>units[index]?width:Math.floor((width+extra)/20)*20);
    atom.classList.add('consistency-column-layout');atom.dataset.columnAxis=stacked?'vertical':'horizontal';atom.style.gap='0';
    atom.style.gridTemplateColumns=stacked?'minmax(0,1fr)':widths.map((width,index)=>`calc(${width+(index?gaps[index-1]:0)}px * var(--sf))`).join(' ');
    columns.forEach((column,index)=>{column.classList.toggle('consistency-unit-column',!!units[index]);column.style.marginInlineStart=!stacked&&index?`calc(${gaps[index-1]}px * var(--sf))`:'0px';column.style.marginTop=stacked&&index?`calc(${gaps[index-1]}px * var(--sf))`:'0px';});
    ids.forEach((id,index)=>{
     const bounds=editor.parentElement!;let binding=this.handles.get(id);
     if(binding&&(!binding.host.isConnected||binding.atom!==atom||binding.next!==columns[index+1])){binding.dispose();binding.host.remove();this.handles.delete(id);binding=undefined;}
     if(!binding){
      const host=document.createElement('div');host.className='consistency-column-gap ghost-surface ghost-surface--gap';host.setAttribute('role','slider');host.setAttribute('aria-label',`Adjust ${editor.dataset.editorKey} column gap ${atomIndex+1}.${index+1}`);host.setAttribute('aria-valuemin','0');host.setAttribute('aria-valuemax','2000');
      const measure=document.createElement('span');measure.className='ghost-measure';measure.setAttribute('aria-hidden','true');host.append(measure);bounds.append(host);host.addEventListener('focus',()=>this.state.select(id));let pointer=false;
      const maximum=()=>atom.dataset.columnAxis==='vertical'?2000:Math.max(0,Math.min(2000,atom.clientWidth/scale-units.reduce((sum,unit)=>sum+(unit?unit.getBoundingClientRect().width/scale:200),0)-ids.reduce((sum,key,keyIndex)=>sum+(keyIndex===index?0:this.state.value(key,this.defaults.get(key)!)),0)));
      const dispose=bindSpacingHandle(host,()=>({value:this.state.value(id,this.defaults.get(id)!),disabled:!this.state.enabled(),min:0,max:maximum(),step:20,shiftStep:40,axis:atom.dataset.columnAxis as 'horizontal'|'vertical',gain:pointerGain('gap',scale),snapPreview:false,
       onPointerStart:()=>{(host.ownerDocument.activeElement as HTMLElement|null)?.blur?.();this.state.select(id);},onStart:kind=>{pointer=kind==='pointer';host.setAttribute('data-spacing-active','');this.state.select(id);},onPreview:value=>this.state.preview(id,value),onCommit:value=>this.state.commit(id,value,pointer),onEnd:cancelled=>{host.removeAttribute('data-spacing-active');if(cancelled)this.state.cancel();},
      }));binding={host,atom,next:columns[index+1],dispose};this.handles.set(id,binding);
     }
     const first=(units[index]??columns[index]).getBoundingClientRect(),next=(units[index+1]??columns[index+1]).getBoundingClientRect(),base=bounds.getBoundingClientRect();
     const start=stacked?first.bottom:first.right,end=stacked?next.top:next.left;
     Object.assign(binding.host.style,stacked?{left:`${next.left-base.left}px`,top:`${start-base.top}px`,width:`${next.width}px`,height:`${Math.max(0,end-start)}px`}:{left:`${start-base.left}px`,top:`${Math.min(first.top,next.top)-base.top}px`,width:`${Math.max(0,end-start)}px`,height:`${Math.max(first.bottom,next.bottom)-Math.min(first.top,next.top)}px`});
     binding.host.dataset.axis=stacked?'vertical':'horizontal';binding.host.setAttribute('aria-valuemax',String(stacked?2000:Math.max(0,Math.min(2000,available-unitWidths.reduce((sum,width)=>sum+width,0)-gaps.reduce((sum,value,keyIndex)=>sum+(keyIndex===index?0:value),0)))));binding.host.setAttribute('aria-orientation',stacked?'vertical':'horizontal');binding.host.setAttribute('aria-valuenow',String(Math.round(gaps[index])));binding.host.setAttribute('aria-valuetext',`${Math.round(gaps[index])} pixels`);binding.host.firstElementChild!.textContent=String(Math.round(gaps[index]));binding.host.hidden=!this.state.enabled();binding.host.tabIndex=this.state.enabled()?0:-1;
    });
   });
  });
  this.handles.forEach((binding,id)=>{if(!present.has(id)){binding.dispose();binding.host.remove();this.handles.delete(id);}});
 }
 destroy(){cancelAnimationFrame(this.frame);this.observer.disconnect();this.resize.disconnect();this.handles.forEach(binding=>{binding.dispose();binding.host.remove();});this.handles.clear();}
}
