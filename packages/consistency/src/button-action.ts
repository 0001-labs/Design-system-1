import { readAction } from '../../../shared/consistency-content';
import { createSurfaceElement } from './editor-surface';
import '../../../DS1/3-unit/ds-select';
import '../../../DS1/2-core/ds-input';

export type ButtonAction = ReturnType<typeof readAction>;

/** The native destination fields; callers own hover or Context presentation. */
export function createButtonActionControls(doc:Document,initialAction:ButtonAction,canWrite:()=>boolean,onChange:(action:ButtonAction)=>void,options:{allowNone?:boolean}={}):{element:HTMLDivElement;dispose:()=>void} {
  const element=doc.createElement('div');element.setAttribute('data-aa-interactive','');element.setAttribute('aria-label','Button action');
  const select=createSurfaceElement(doc,'ds-select'),choice=doc.createElement('select');choice.setAttribute('aria-label','Button action type');
  for(const [key,label] of [['none','No action'],['link','Open a link'],['page','Open a page']]){if(key==='none'&&options.allowNone===false)continue;const option=doc.createElement('option');option.value=key;option.textContent=label;choice.append(option);}
  choice.value=initialAction?.kind ?? 'none';select.append(choice);
  const target=createSurfaceElement(doc,'ds-input');target.type='text';target.setAttribute('aria-label','Button destination');target.value=initialAction?.target ?? '';
  const paint=()=>{target.placeholder=choice.value==='page'?'/about':'https://example.com';target.hidden=choice.value==='none';};
  const update=()=>{
    paint();if(!canWrite())return;
    const kind=choice.value,action=readAction({kind,target:target.value.trim()});
    target.setAttribute('aria-invalid',String(kind!=='none'&&!!target.value&&!action));
    if(kind==='none'||action)onChange(action);
  };
  choice.addEventListener('change',update);target.addEventListener('change',update);paint();element.append(select,target);
  return {element,dispose:()=>{choice.removeEventListener('change',update);target.removeEventListener('change',update);}};
}
