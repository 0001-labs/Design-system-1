/** Hosted sites supply a native page, its trusted canvas and a revisioned save transport.
 * The same page editor is used by templates, drafts and the lab. */
import {LitElement,html,nothing} from 'lit';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-empty';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/3-unit/ds-select';
import {failureWords,firstPage,pageGroups,pressAction,siteAddress,siteOrigins,type SitePage,type SiteSummary} from './site-editing';
import { editableControl } from './control-edit';
import type {NativePageSnapshot} from './native-site';
import {ConsistencyPageEditor} from './page-editor';
import './site-editor.css';
async function request<T>(url:string,init?:RequestInit):Promise<T>{const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...init}),body=await response.json().catch(()=>null);if(!response.ok)throw Object.assign(Error(failureWords(response.status,body?.error)),{status:response.status});return body as T;}
export class ConsistencySiteEditor extends LitElement {
 static properties={pages:{state:true},path:{state:true},problem:{state:true}};
 pages:SitePage[]|null=null;path:string|null=null;problem='';site!:SiteSummary;picker=true;
 private readonly cache=new Map<string,{editor:ConsistencyPageEditor;snapshot:NativePageSnapshot}>();
 private opening=0;private retry=0;private detach?:()=>void;
 private get pageEditor(){return this.path?this.cache.get(this.path)?.editor:undefined;}
 createRenderRoot(){return this;}
 connectedCallback(){super.connectedCallback();if(!this.pages)void this.load();}
 disconnectedCallback(){super.disconnectedCallback();this.opening++;this.detach?.();for(const entry of this.cache.values())entry.editor.destroy();this.cache.clear();this.pages=null;}
 private async read(path:string,canvas=true){
  const snapshot=await request<NativePageSnapshot&{canvas?:string}>(siteAddress.nativePage(this.site.code,path)+(canvas?'&canvas=1':''));
  if(snapshot.kind!=='native')throw Error('This page needs its block migration before it can be edited.');
  return snapshot;
 }
 private async load(){
  // Most sites open at /. Discover navigation alongside that page instead of putting it in front of it.
  const firstRead=this.read('/').then(snapshot=>({snapshot}),error=>({error}));
  try{const result=await request<{pages:SitePage[]}>(siteAddress.pages(this.site.code));if(!this.isConnected)return;this.pages=result.pages;const first=firstPage(result.pages);if(first)await this.open(first,false,first==='/'?firstRead:undefined);}catch(error){this.problem=(error as Error).message;}
 }
 async open(path:string,retry=false,prepared?:Promise<{snapshot?:NativePageSnapshot&{canvas?:string};error?:unknown}>):Promise<boolean>{
  if(!retry)this.retry=0;
  if(!await this.flush())return false;
  const ticket=++this.opening;
  const cached=this.cache.get(path);
  if(cached&&!retry){this.cache.delete(path);this.cache.set(path,cached);this.path=path;this.problem='';this.show();void this.refresh(path,cached,ticket);return true;}
  try{
   const previous=this.cache.get(path)?.snapshot;
   const result=prepared?await prepared:{snapshot:await this.read(path)};
   if(result.error)throw result.error;
   const {canvas,...snapshot}=result.snapshot!;
   if(ticket!==this.opening||!this.isConnected)return false;
   if(!await this.flush()||ticket!==this.opening)return false;
   // A save completed during the read: retain its newer document and fetch again.
   if(previous&&this.cache.get(path)?.snapshot!==previous)return this.open(path,true);
   const editor=new ConsistencyPageEditor();
   const entry={editor,snapshot};
   editor.addEventListener('page-ready',()=>{if(this.path===path)this.wire(editor.canvas);});
   editor.addEventListener('page-reopen',()=>{if(this.path===path&&this.retry++<1)void this.open(path,true);else this.problem='This page is being published. Open it again in a moment.';});
   editor.addEventListener('page-error',()=>{this.problem='This page could not finish opening. Open it again to retry.';if(this.cache.get(path)===entry)this.cache.delete(path);editor.remove();});
   if(cached)cached.editor.remove();
   this.cache.set(path,entry);this.path=path;this.problem='';
   void editor.open(snapshot,async value=>{
    const accepted=await request<NativePageSnapshot>(siteAddress.nativePage(this.site.code,path),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)});
    entry.snapshot=accepted;return accepted;
   },{url:siteAddress.document(this.site.code,path),html:canvas});
   this.show();this.requestUpdate();
   // A small live page cache retains selection/undo without keeping an entire large site resident.
   for(const [key,value]of this.cache){if(this.cache.size<=4)break;if(key!==path&&!value.editor.pending){value.editor.remove();this.cache.delete(key);}}
   return true;
  }catch(error){if(ticket===this.opening)this.problem=(error as Error).message;return false;}
 }
 private async refresh(path:string,entry:{editor:ConsistencyPageEditor;snapshot:NativePageSnapshot},ticket:number){
  try{
   const latest=await this.read(path,false);
   if(ticket!==this.opening||this.path!==path||entry!==this.cache.get(path))return;
   const before=entry.snapshot;
   if(JSON.stringify(latest)!==JSON.stringify(before)&&!entry.editor.pending){
    // Reopen only after an authoritative change. A local edit always retains its guarded revision.
    await this.open(path,true);
   }
  }catch(error){if(ticket===this.opening){this.problem=(error as Error).message;if([401,403,404].includes((error as Error&{status:number}).status)){this.detach?.();for(const value of this.cache.values())value.editor.remove();this.cache.clear();this.path=null;}}}
 }
 protected updated(){const stage=this.querySelector('.consistency-site-stage');if(stage)for(const entry of this.cache.values())if(entry.editor.parentElement!==stage)stage.append(entry.editor);this.show();}
 private show(){for(const[key,entry]of this.cache)entry.editor.active=key===this.path;if(this.pageEditor?.canvas.contentDocument?.querySelector('[data-editor-surface]'))this.wire(this.pageEditor.canvas);}
 async flush(){return await this.pageEditor?.flush()??true;}
 private wire(frame:HTMLIFrameElement){this.detach?.();const doc=frame.contentDocument!,origin=new URL(this.site.url).origin;
  const press=(event:MouseEvent)=>{
   if(event.defaultPrevented)return;
   const target=event.composedPath()[0] as HTMLElement,root=doc.querySelector<HTMLElement>('[data-editor-surface]')!;
   const control=editableControl(target,root);
   if(control?.hasAttribute('data-c9y-control-editing')&&!event.metaKey&&!event.ctrlKey)return;
   if(!control)return;
   const link=event.composedPath().find(node=>(node as Node).nodeType===1&&(node as Element).matches('a[href],ds-button[href],ds-link[href]')) as HTMLElement|undefined;
   if(!link)return;
   event.preventDefault();
   if(link.matches('[disabled],[aria-disabled="true"]')||control.matches('[disabled],[aria-disabled="true"]'))return;
   let href:URL;try{href=new URL(link.getAttribute('href')??'',origin);}catch{return;}
   const action=pressAction({inEditing:false,field:false,link:{href:href.href},mod:event.metaKey||event.ctrlKey},{origins:siteOrigins(this.site),paths:(this.pages??[]).map(page=>page.path)});
   if(action.do==='go'){
    if(action.path===this.path&&href.hash){let id=href.hash.slice(1);try{id=decodeURIComponent(id);}catch{}doc.getElementById(id)?.scrollIntoView();return;}
    void this.open(action.path);
   }else if(['https:','http:','mailto:','tel:'].includes(href.protocol))window.open(href.href,'_blank','noopener,noreferrer');
  };
  const hold=(event:Event)=>event.preventDefault();doc.addEventListener('click',press,true);doc.addEventListener('auxclick',hold,true);doc.addEventListener('submit',hold,true);this.detach=()=>{doc.removeEventListener('click',press,true);doc.removeEventListener('auxclick',hold,true);doc.removeEventListener('submit',hold,true);};
 }
 render(){const live=this.path?new URL(this.path,this.site.url).href:this.site.url;return html`${this.picker?html`<div class="consistency-site-bar">${this.pages?.length?html`<ds-select><select aria-label="Page" .value=${this.path??''} @change=${(event:Event)=>{const select=event.target as HTMLSelectElement,before=this.path;void this.open(select.value).then(ok=>{if(!ok&&before)select.value=before;});}}>${pageGroups(this.pages).map(group=>html`<optgroup label=${group.lang}>${group.pages.map(page=>html`<option value=${page.path}>${page.title||page.path}</option>`)}</optgroup>`)}</select></ds-select>`:nothing}<ds-button href=${live} blank secondary>Open the page</ds-button></div>`:nothing}${this.problem?html`<ds-message tone="danger" literal .text=${this.problem}></ds-message>`:nothing}${this.pages&&!this.pages.length?html`<ds-empty literal heading="No pages" text="This site has no pages yet."></ds-empty>`:nothing}<div class="consistency-site-stage" ?hidden=${!this.path}></div>`;}
}
customElements.define('consistency-site-editor',ConsistencySiteEditor);
declare global{interface HTMLElementTagNameMap{'consistency-site-editor':ConsistencySiteEditor}}
