import { LitElement, css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../0-face/define';
import { bezelById, screenGeometry } from './bezels';
import './app-chrome';
/** Artwork and a measured, native-size screen. The entire screen scales uniformly into the bezel. */
export class DsDeviceBezel extends LitElement {
  static properties={ edgeToEdge:{type:Boolean,attribute:"edge-to-edge",reflect:true}, staticFrame:{type:Boolean,attribute:"static",reflect:true}, frameless:{type:Boolean,reflect:true}, responsive:{type:Boolean,reflect:true}, device:{}, assetBase:{attribute:'asset-base'}, chromeAssets:{attribute:'chrome-assets'}, network:{}, battery:{type:Number}, dualSim:{type:Boolean,attribute:'dual-sim'}, time:{}, address:{}, browser:{}, appearance:{reflect:true}, interactive:{type:Boolean}, status:{type:Boolean}, measuredWidth:{state:true} };
  declare edgeToEdge:boolean; declare frameless: boolean; declare responsive: boolean;
  declare staticFrame: boolean; declare device: string; declare assetBase: string; declare chromeAssets: string; declare network: string; declare battery: number; declare dualSim: boolean; declare time: string; declare address: string; declare browser: string; declare appearance: string; declare interactive: boolean; declare status: boolean;
  declare private measuredWidth: number;
  private observer?:ResizeObserver;
  constructor(){super();this.edgeToEdge=false;this.staticFrame=false;this.frameless=false;this.responsive=false;this.device='iphone-17-pro-max-deep-blue';this.assetBase='';this.chromeAssets='';this.network='4G';this.battery=80;this.dualSim=false;this.time='00:01';this.address='';this.browser='';this.appearance='light';this.interactive=false;this.status=true;this.measuredWidth=0;}
  static styles=css`
    :host { display:block; width:var(--ds-device-width,280px); max-width:100%; }
    :host([frameless]) { display:contents; }
    .status-wrap { flex:none; }
    :host([edge-to-edge]) .status-wrap { position:absolute; top:0; left:0; right:0; z-index:2; pointer-events:none; }
    :host([edge-to-edge]) .home { display:none; }
    /* Over the page, the status bar's ink follows appearance: black over a light page, white over a dark one. */
    :host([edge-to-edge]) ds-app-chrome { --chrome-screen:transparent; background:transparent; }
    .scaled-chrome { transform-origin:top left; }
    .device.compact { box-shadow:inset 0 0 0 3px #202124; border-radius:32px; background:#202124; }
    .compact .art { display:none; }
    .device { position:relative; width:100%; }
    .screen { position:absolute; transform-origin:top left; overflow:hidden; background:var(--ds-device-paper,#fff); display:flex; flex-direction:column; }
    :host([appearance=dark]) .screen { --ds-device-paper:#111; }
    .content { position:relative; flex:1; min-height:0; overflow:hidden; }
    .art { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
    .browser { position:absolute; left:0; right:0; bottom:34px; z-index:1; }
    .screen.with-browser .home { position:absolute; bottom:0; left:0; right:0; background:transparent; pointer-events:none; }
    .screen.with-browser .home::after { display:none; }
    .home { height:34px; flex:none; display:flex; align-items:center; justify-content:center; background:var(--ds-device-paper,#fff); }
    .home::after { content:''; width:134px; height:5px; border-radius:9px; background:#000; }
    :host([appearance=dark]) .home::after { background:#fff; }
    ds-app-chrome { flex:none; } ::slotted(iframe) { display:block; width:100%; height:100%; border:0; }
    .missing { padding:20px; border:1px solid currentColor; font:14px/20px sans-serif; }
  `;
  connectedCallback(){super.connectedCallback();this.observer=new ResizeObserver(entries=>{this.measuredWidth=entries[0].contentRect.width;});this.observer.observe(this);}
  disconnectedCallback(){this.observer?.disconnect();super.disconnectedCallback();}
  render(){
    if(this.frameless)return html`<slot></slot>`;
    const b=bezelById(this.device);
    if(!b||!this.assetBase)return html`<div class="missing" role="status">${b?'Set asset-base to your licensed bezel artwork.':'Unknown device bezel.'}</div>`;
    const g=screenGeometry(b,this.measuredWidth||b.width);
    const compact=this.responsive && this.measuredWidth>0 && this.measuredWidth<320;
    if(compact){g.left=3;g.top=3;g.scale=(this.measuredWidth-6)/g.width;}
    const screenStyle={left:g.left+'px',top:g.top+'px',width:g.width*(this.responsive?g.scale:1)+'px',height:g.height*(this.responsive?g.scale:1)+'px',borderRadius:(compact?29:b.screen.radius*(this.responsive?g.scale:1))+'px',transform:this.responsive?'none':`scale(${g.scale})`};
    const chromeStyle=this.responsive?`width:${g.width}px;transform:scale(${g.scale});`:'';
    const path=this.assetBase.replace(/\/?$/,'/')+b.asset.split('/').pop();
    return html`<div class=${compact?'device compact':'device'} style=${styleMap({aspectRatio:`${b.width} / ${b.height}`})}><div class=${this.browser==='safari'?'screen with-browser':'screen'} part="screen" style=${styleMap(screenStyle)}>${this.status?html`<div class="status-wrap" style=${this.responsive?`height:${(b.kind==='phone'?59:32)*g.scale}px`:""}><ds-app-chrome class="scaled-chrome" style=${chromeStyle} .kind=${b.kind==='phone'?'ios':'ipados'} .time=${this.time} .network=${this.network} .battery=${this.battery} .dualSim=${this.dualSim} .appearance=${this.appearance} .assetBase=${this.chromeAssets}></ds-app-chrome></div>`:nothing}<div class="content" part="viewport" ?inert=${this.staticFrame}><slot></slot></div>${this.browser==='safari'?html`<div class="browser" style=${this.responsive?`height:${49*g.scale}px;bottom:${34*g.scale}px`:""}><ds-app-chrome class="scaled-chrome" style=${chromeStyle} kind="safari-ios" .address=${this.address} .appearance=${this.appearance} .interactive=${this.interactive&&!this.staticFrame}></ds-app-chrome></div>`:nothing}<div class="home" aria-hidden="true"></div></div><img class="art" src=${path} alt="" width=${b.width} height=${b.height} @error=${()=>this.dispatchEvent(new CustomEvent('bezel-error',{detail:{device:b.id},bubbles:true,composed:true}))}></div>`;
  }
}
define('ds-device-bezel',DsDeviceBezel);
declare global { interface HTMLElementTagNameMap { 'ds-device-bezel': DsDeviceBezel; } }
