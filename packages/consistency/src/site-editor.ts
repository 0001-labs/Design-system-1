/** Hosted sites supply a native page, its trusted canvas and a revisioned save transport.
 * The same page editor is used by templates, drafts and the lab. */
import {LitElement,html,nothing} from 'lit';
import '../../../DS1/2-core/ds-button';
import '../../../DS1/2-core/ds-empty';
import '../../../DS1/2-core/ds-message';
import '../../../DS1/3-unit/ds-select';
import {failureWords,firstPage,pageGroups,pressAction,siteAddress,siteOrigins,type SitePage,type SiteSummary} from './site-editing';
import type {NativePageSnapshot} from './native-site';
import {ConsistencyPageEditor} from './page-editor';
import './site-editor.css';
async function request<T>(url:string,init?:RequestInit):Promise<T>{const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...init}),body=await response.json().catch(()=>null);if(!response.ok)throw Error(failureWords(response.status,body?.error));return body as T;}
export class ConsistencySiteEditor extends LitElement {
 static properties={pages:{state:true},path:{state:true},problem:{state:true}};
 pages:SitePage[]|null=null;path:string|null=null;problem='';site!:SiteSummary;picker=true;
 private readonly pageEditor=new ConsistencyPageEditor();private opening=0;private retry=0;private detach?:()=>void;
 constructor(){super();this.pageEditor.addEventListener('page-ready',event=>this.wire((event as CustomEvent<{frame:HTMLIFrameElement}>).detail.frame));this.pageEditor.addEventListener('page-reopen',()=>{if(this.path&&this.retry++<1)void this.open(this.path,true);else this.problem='This page is being published. Open it again in a moment.';});}
 createRenderRoot(){return this;}
 connectedCallback(){super.connectedCallback();if(!this.pages)void this.load();}
 disconnectedCallback(){super.disconnectedCallback();this.opening++;this.detach?.();this.pageEditor.destroy();}
 private async load(){try{const result=await request<{pages:SitePage[]}>(siteAddress.pages(this.site.code));if(!this.isConnected)return;this.pages=result.pages;const first=firstPage(result.pages);if(first)await this.open(first);}catch(error){this.problem=(error as Error).message;}}
 async open(path:string,retry=false):Promise<boolean>{if(!retry)this.retry=0;if(!await this.flush())return false;const ticket=++this.opening;try{const snapshot=await request<NativePageSnapshot>(siteAddress.nativePage(this.site.code,path));if(ticket!==this.opening||!this.isConnected)return false;if(snapshot.kind!=='native')throw Error('This page needs its block migration before it can be edited.');this.path=snapshot.path;this.problem='';void this.pageEditor.open(snapshot,value=>request<NativePageSnapshot>(siteAddress.nativePage(this.site.code,snapshot.path),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)}),{url:siteAddress.document(this.site.code,snapshot.path)});return true;}catch(error){this.problem=(error as Error).message;return false;}}
 async flush(){return this.pageEditor.flush();}
 private wire(frame:HTMLIFrameElement){this.detach?.();const doc=frame.contentDocument!,origin=new URL(this.site.url).origin;
  const press=(event:MouseEvent)=>{const target=event.target as Element;if(event.defaultPrevented||target.closest('[data-editor-chrome]')||!event.metaKey&&!event.ctrlKey&&target.closest('aa-editor,[contenteditable]'))return;const link=target.closest<HTMLElement>('a[href],ds-button[href]');if(!link&&target.closest('summary'))return;event.preventDefault();const action=pressAction({inEditing:false,field:false,link:link?{href:new URL(link.getAttribute('href')??'',origin).href}:null,mod:event.metaKey||event.ctrlKey},{origins:siteOrigins(this.site),paths:(this.pages??[]).map(page=>page.path)});if(action.do==='go')void this.open(action.path);};
  const hold=(event:Event)=>event.preventDefault();doc.addEventListener('click',press,true);doc.addEventListener('auxclick',hold,true);doc.addEventListener('submit',hold,true);this.detach=()=>{doc.removeEventListener('click',press,true);doc.removeEventListener('auxclick',hold,true);doc.removeEventListener('submit',hold,true);};
 }
 render(){const live=this.path?new URL(this.path,this.site.url).href:this.site.url;return html`${this.picker?html`<div class="consistency-site-bar">${this.pages?.length?html`<ds-select><select aria-label="Page" .value=${this.path??''} @change=${(event:Event)=>{const select=event.target as HTMLSelectElement,before=this.path;void this.open(select.value).then(ok=>{if(!ok&&before)select.value=before;});}}>${pageGroups(this.pages).map(group=>html`<optgroup label=${group.lang}>${group.pages.map(page=>html`<option value=${page.path}>${page.title||page.path}</option>`)}</optgroup>`)}</select></ds-select>`:nothing}<ds-button href=${live} blank secondary>Open the page</ds-button></div>`:nothing}${this.problem?html`<ds-message tone="danger" literal .text=${this.problem}></ds-message>`:nothing}${this.pages&&!this.pages.length?html`<ds-empty literal heading="No pages" text="This site has no pages yet."></ds-empty>`:nothing}<div class="consistency-site-stage" ?hidden=${!this.path}>${this.pageEditor}</div>`;}
}
customElements.define('consistency-site-editor',ConsistencySiteEditor);
declare global{interface HTMLElementTagNameMap{'consistency-site-editor':ConsistencySiteEditor}}
