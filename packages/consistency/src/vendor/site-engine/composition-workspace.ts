import { h } from './dom';
export interface Draft { id:string; name:string; revision:number; updatedAt:number; document?:Record<string,unknown> }
export interface EditorAdapter { element:HTMLElement; controls?:HTMLElement; read():Record<string,unknown>; destroy?():void }
/** One of the workspace's sites, from `/api/consistency/sites`, by its IDv1 code. */
export interface WorkspaceSite { code:string; name:string; url:string }
/** A site opened in the work: its words saved as it goes; `flush` settles a word being edited before leaving, false to stay. */
export interface SiteAdapter { element:HTMLElement; flush?():Promise<boolean>; destroy?():void }
export interface WorkspaceOptions {
  /** Lets an editor place navigation, draft actions and composition controls in one sidebar. */
  shell?(navigation:HTMLElement, documentBar:HTMLElement, stage:HTMLElement, controls:HTMLElement):void;
  create(document?:Record<string,unknown>):EditorAdapter;
  /** Opens a site in the work, where the editor can; without it, Sites link to each site's own editor. */
  openSite?(site:WorkspaceSite):SiteAdapter;
}
/** CMS navigation and persistence; the composition engine owns canvas interactions, a site's adapter its words. */
export function compositionWorkspace(root:HTMLElement,options:WorkspaceOptions):()=>void {
  let current:Draft|null=null,editor:EditorAdapter|undefined,dirty=false,saving:Promise<boolean>|null=null,conflict=false,disposed=false;
  let timer:ReturnType<typeof setTimeout>|undefined;
  let pages:Draft[]=[];
  let site:{code:string;adapter:SiteAdapter}|null=null;
  const siteButtons=new Map<string,HTMLElement>();
  const status=h('span',{role:'status','aria-live':'polite',class:'composition-status'});
  const title=h('input',{class:'ds-input','aria-label':'Page name',maxlength:'160',value:'Untitled'});
  const retry=h('button',{class:'ds-button',hidden:true,onclick:()=>void save()},'Try again');
  const copy=h('button',{class:'ds-button',hidden:true,onclick:()=>void saveCopy()},'Save a copy');
  const stage=h('main',{class:'composition-work','data-ds-grid-scroll':''});
  const sidebar=document.createElement('ds-sidebar') as HTMLElement & {items:unknown[]};sidebar.setAttribute('narrow','');sidebar.setAttribute('label','Pages');
  const newPage=h('button',{class:'ds-button',onclick:()=>void createPage()},'New page');
  const sidebarHeader=h('div',{slot:'header'},h('strong',{},'Pages'),newPage);sidebar.append(sidebarHeader);
  const signOut=h('button',{slot:'footer',class:'ds-button',onclick:async()=>{if(!await flush())return;const r=await fetch('/api/dashboard/session',{method:'DELETE'});if(r.ok)location.href='/app/signin';else status.textContent='Could not sign out. Try again.';}},'Sign out');sidebar.append(signOut);
  const sites=h('div',{slot:'footer',class:'composition-sites'},h('strong',{},'Sites'));sidebar.append(sites);
  void fetch('/api/consistency/sites').then(async response=>{if(!response.ok)return;const data=await response.json() as {sites:WorkspaceSite[]};for(const entry of data.sites){const url=new URL(entry.url);if(url.protocol!=='https:')continue;
    if(!options.openSite){sites.append(h('a',{href:url.href,target:'_blank',rel:'noopener'},entry.name));continue;}
    const button=h('button',{type:'button',class:'ds-row','data-site':entry.code,onclick:()=>void openSite(entry)},h('span',{class:'ds-row__name'},entry.name));siteButtons.set(entry.code,button);sites.append(button);}}).catch(()=>{sites.append(h('span',{},'Sites unavailable'));});
  const bar=h('div',{class:'composition-document-bar'},title,status,retry,copy);
  const content=h('div',{class:'composition-content'},bar,stage);
  const header=h('header',{class:'ds-header ds-header--app'},h('a',{class:'ds-header__brand',href:'/'},'Consistency'));
  const controls=h('div',{class:'composition-editor-controls'});
  if(options.shell)options.shell(sidebar,bar,stage,controls);
  else root.replaceChildren(header,h('div',{class:'composition-shell'},sidebar,content));
  async function api(path:string,init?:RequestInit){const r=await fetch('/api/consistency/pages'+path,{credentials:'same-origin',...init});const body=await r.json();if(!r.ok)throw Object.assign(new Error(r.status===409?'This page changed in another tab. Save a copy to keep these edits.':r.status===401||r.status===403?'Your session expired. Your edits are still here; sign in in another tab, then try again.':body.error||'Could not save. Try again.'),{status:r.status});return body;}
  function draw(){sidebar.items=pages.map(page=>({id:page.id,label:page.name,current:page.id===current?.id}));title.hidden=!current;bar.hidden=Boolean(site);for(const [id,button] of siteButtons){if(id===site?.code)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}}
  /** Leaves the open site, once its word being edited is settled; false keeps it open. */
  async function leaveSite():Promise<boolean>{if(!site)return true;if(site.adapter.flush&&!await site.adapter.flush())return false;site.adapter.destroy?.();site=null;draw();return true;}
  /** A site in the work: the draft is saved and put away first, and no draft is current while it is open. */
  async function openSite(entry:WorkspaceSite){if(navigating||!options.openSite||site?.code===entry.code)return;navigating=true;
    try{if(!await flush()||!await leaveSite())return;editor?.destroy?.();editor=undefined;current=null;dirty=false;conflict=false;retry.hidden=true;copy.hidden=true;status.textContent='';
      const adapter=options.openSite(entry);site={code:entry.code,adapter};controls.replaceChildren();stage.replaceChildren(adapter.element);draw();}
    finally{navigating=false;}}
  function changed(){if(!current)return;dirty=true;status.textContent='Unsaved';clearTimeout(timer);if(!conflict)timer=setTimeout(()=>void save(),700);}
  title.addEventListener('input',changed);
  async function save():Promise<boolean>{
    clearTimeout(timer);if(saving)return saving;if(!dirty||!current||!editor)return true;if(conflict)return false;
    const draft=current,document=editor.read(),name=title.value.trim()||'Untitled';dirty=false;status.textContent='Saving…';retry.hidden=true;
    saving=(async()=>{try{const saved=await api('/'+encodeURIComponent(draft.id),{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,document,revision:draft.revision})}) as Draft;
      current={...saved,document};pages=[saved,...pages.filter(p=>p.id!==saved.id)];draw();status.textContent=dirty?'Unsaved':'Saved';return true;
    }catch(error){dirty=true;conflict=(error as {status?:number}).status===409;status.textContent=(error as Error).message;retry.hidden=conflict;copy.hidden=false;return false;}finally{saving=null;if(dirty&&!conflict&&status.textContent==='Unsaved')timer=setTimeout(()=>void save(),100);}})();return saving;
  }
  async function flush():Promise<boolean>{do {if(!await save())return false;}while(dirty||saving);return true;}
  function mount(draft:Draft){editor?.destroy?.();editor=options.create(draft.document);stage.replaceChildren(editor.element);controls.replaceChildren(...(editor.controls?[editor.controls]:[]));current=draft;title.value=draft.name;dirty=false;conflict=false;retry.hidden=true;copy.hidden=true;status.textContent='Saved';editor.element.addEventListener('consistency-change',changed);draw();}
  let navigating=false;
  async function open(id:string){if(navigating)return;navigating=true;if(!await flush()||!await leaveSite()){navigating=false;return;}try{const draft=await api('/'+encodeURIComponent(id));if(!disposed)mount(draft);}catch(error){status.textContent=(error as Error).message;}finally{navigating=false;}}
  async function createPage(){if(navigating)return;navigating=true;if(!await flush()||!await leaveSite()){navigating=false;return;}const draft={id:crypto.randomUUID(),name:'Untitled',revision:0,updatedAt:Date.now()};mount(draft);dirty=true;await save();navigating=false;}
  async function saveCopy(){if(!editor||!current)return;await saving;current={...current,id:crypto.randomUUID(),revision:0};title.value=(title.value.trim()||'Untitled')+' copy';conflict=false;dirty=true;await save();}
  sidebar.addEventListener('sidebar-activate',event=>void open((event as CustomEvent).detail.id));
  const beforeUnload=(event:BeforeUnloadEvent)=>{if(dirty||saving){event.preventDefault();event.returnValue='';}};window.addEventListener('beforeunload',beforeUnload);
  stage.append(h('p',{},'Create a page to begin. Your drafts are private.'));
  title.hidden=true;
  void api('').then(async data=>{if(disposed)return;pages=data.pages;draw();if(pages.length)await open(pages[0].id);}).catch(error=>{status.textContent=(error as Error).message;});
  return()=>{disposed=true;clearTimeout(timer);editor?.destroy?.();site?.adapter.destroy?.();window.removeEventListener('beforeunload',beforeUnload);};
}
