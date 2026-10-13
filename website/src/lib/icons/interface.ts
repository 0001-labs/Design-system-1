import { scopedSvg } from './svgView';
import icons from './interface-catalog.json';
const $ = <T extends HTMLElement = HTMLElement>(id:string) => document.getElementById(id) as T;
let selected = icons.find(icon=>icon.key==='star') ?? icons[0];
let view = 'outline';
const geometry = 'path,rect,circle,ellipse,line,polyline,polygon';
function message(text:string) { $('vector-notice').textContent=text; }
function parsed(svg:string) { return new DOMParser().parseFromString(svg,'image/svg+xml').documentElement; }
function outline(svg:string) {
  const root=parsed(svg);
  root.querySelectorAll(geometry).forEach(shape=>{
    if(shape.closest('defs,clipPath,mask'))return;
    shape.setAttribute('fill','none'); shape.setAttribute('stroke','#6552d9');
    shape.setAttribute('stroke-width','0.045'); shape.setAttribute('stroke-opacity','1');shape.setAttribute('opacity','1');
    shape.removeAttribute('style');
  });
  return new XMLSerializer().serializeToString(root);
}
function render(){
  $('vector-name').textContent=selected.name;
  $('vector-artwork').innerHTML=scopedSvg(selected.svg,'focus-original');
  $('vector-outlines').innerHTML=scopedSvg(outline(selected.svg),'focus-outline');
  $('vector-stage').dataset.view=view;
  $('vector-grid-lines').style.display=$<HTMLInputElement>('vector-grid').checked?'':'none';
  const link=$<HTMLAnchorElement>('vector-download'); link.href=selected.url;link.download=selected.name.toLowerCase()+'.svg';
  const source=$<HTMLAnchorElement>('vector-source');
  source.href=selected.node?`https://www.figma.com/design/XAnoaRoq9LxVAHUZgtdO0r/ds1?node-id=${selected.node.replace(':','-')}`:selected.url;
  source.textContent=selected.node?'Figma source ↗':'SVG source ↗';
  for(const button of document.querySelectorAll<HTMLElement>('[data-vector-key]')){button.setAttribute('aria-pressed',String(button.dataset.vectorKey===selected.key));button.tabIndex=button.dataset.vectorKey===selected.key?0:-1;}
  for(const button of document.querySelectorAll<HTMLElement>('[data-vector-view]'))button.setAttribute('aria-pressed',String(button.dataset.vectorView===view));
}
function search(){
  const query=$<HTMLInputElement>('vector-search').value.trim().toLowerCase();let shown=0;
  for(const button of document.querySelectorAll<HTMLElement>('[data-vector-key]')){
    const icon=icons.find(icon=>icon.key===button.dataset.vectorKey)!;
    button.hidden=!`${icon.key} ${icon.name}`.toLowerCase().includes(query);
    if(!button.hidden)shown++;
  }
  const visible=Array.from(document.querySelectorAll<HTMLElement>('[data-vector-key]')).filter(b=>!b.hidden);
  for(const button of visible)button.tabIndex=button.dataset.vectorKey===selected.key?0:-1;
  if(visible.length&&!visible.some(b=>b.tabIndex===0))visible[0].tabIndex=0;
  $('vector-count').textContent=shown+' icons';$('vector-empty').hidden=shown!==0;
}
for(const button of document.querySelectorAll<HTMLElement>('[data-vector-key]'))button.addEventListener('click',()=>{
  selected=icons.find(icon=>icon.key===button.dataset.vectorKey)!;render();
  history.replaceState(null,'',`${location.pathname}#${selected.key}`);message('');
});
for(const button of document.querySelectorAll<HTMLElement>('[data-vector-view]'))button.addEventListener('click',()=>{view=button.dataset.vectorView!;render();});
$('vector-search').addEventListener('input',search);$('vector-grid').addEventListener('change',render);
async function copy(text:string,success:string){try{await navigator.clipboard.writeText(text);message(success);}catch{message('Clipboard unavailable. Download the SVG instead.');}}
$('vector-copy').addEventListener('click',()=>copy(selected.svg,'SVG copied.'));
$('vector-download-outlines').addEventListener('click',()=>{
  const blob=new Blob([outline(selected.svg)],{type:'image/svg+xml'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=selected.key+'-outlines.svg';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
});
function pickHash(){if(location.hash==='#builder'){selectTab('badge-tab');return;}const icon=icons.find(icon=>icon.key===location.hash.slice(1));if(icon){selected=icon;render();}}
window.addEventListener('hashchange',pickHash);render();
const tabs=[{tab:'interface-tab',panel:'interface-panel'},{tab:'badge-tab',panel:'badge-panel'}];
function selectTab(id:string){for(const entry of tabs){$(entry.panel).hidden=entry.tab!==id;$(entry.tab).setAttribute('aria-selected',String(entry.tab===id));$(entry.tab).tabIndex=entry.tab===id?0:-1;}}
for(const entry of tabs){$(entry.tab).addEventListener('click',()=>{selectTab(entry.tab);history.replaceState(null,'',`${location.pathname}#${entry.tab==='badge-tab'?'builder':selected.key}`);});$(entry.tab).addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const other=tabs.find(t=>t.tab!==entry.tab)!;selectTab(other.tab);$(other.tab).focus();}});}

pickHash();

new ResizeObserver(entries=>{for(const entry of entries)$('vector-stage').style.setProperty('--vector-scale',String(entry.contentRect.width/16));}).observe($('vector-stage'));

$('vector-tiles').addEventListener('keydown',event=>{
  const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'];
  if(!keys.includes(event.key))return;
  const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('[data-vector-key]')).filter(b=>!b.hidden);
  const index=buttons.indexOf(document.activeElement as HTMLButtonElement);if(index<0)return;
  event.preventDefault();
  const columns=getComputedStyle($('vector-tiles')).gridTemplateColumns.split(' ').length;
  const offset=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:event.key==='ArrowUp'?-columns:columns;
  const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:Math.max(0,Math.min(buttons.length-1,index+offset));
  buttons[next].click();buttons[next].focus();
});
