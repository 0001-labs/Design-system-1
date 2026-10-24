import { LitElement, css, html, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { define } from '../0-face/define';
import { bezelById, screenGeometry } from './bezels';
import './app-chrome';
/** Artwork and a measured, native-size screen. The entire screen scales uniformly into the bezel. */
export class DsDeviceBezel extends LitElement {
  static properties={ device:{}, assetBase:{attribute:'asset-base'}, chromeAssets:{attribute:'chrome-assets'}, time:{}, address:{}, browser:{}, appearance:{reflect:true}, interactive:{type:Boolean}, status:{type:Boolean}, measuredWidth:{state:true} };
  device='iphone-17-pro-max-deep-blue'; assetBase=''; chromeAssets=''; time='00:01'; address=''; browser=''; appearance='light'; interactive=false; status=true;
  private measuredWidth=0;
  private observer?:ResizeObserver;
  static styles=css`
    :host { display:block; width:var(--ds-device-width,280px); max-width:100%; }
    .device { position:relative; width:100%; }
    .screen { position:absolute; transform-origin:top left; overflow:hidden; background:var(--ds-device-paper,#fff); display:flex; flex-direction:column; }
    :host([appearance=dark]) .screen { --ds-device-paper:#111; }
    .content { position:relative; flex:1; min-height:0; overflow:hidden; }
    .art { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
    .home { height:34px; flex:none; display:flex; align-items:center; justify-content:center; background:var(--ds-device-paper,#fff); }
    .home::after { content:''; width:134px; height:5px; border-radius:9px; background:#000; }
    :host([appearance=dark]) .home::after { background:#fff; }
    ds-app-chrome { flex:none; } ::slotted(iframe) { display:block; width:100%; height:100%; border:0; }
    .missing { padding:20px; border:1px solid currentColor; font:14px/20px sans-serif; }
  `;
  connectedCallback(){super.connectedCallback();this.observer=new ResizeObserver(entries=>{this.measuredWidth=entries[0].contentRect.width;});this.observer.observe(this);}
  disconnectedCallback(){this.observer?.disconnect();super.disconnectedCallback();}
  render(){
    const b=bezelById(this.device);
    if(!b||!this.assetBase)return html`<div class="missing" role="status">${b?'Set asset-base to your licensed bezel artwork.':'Unknown device bezel.'}</div>`;
    const g=screenGeometry(b,this.measuredWidth||b.width);
    const screenStyle={left:g.left+'px',top:g.top+'px',width:g.width+'px',height:g.height+'px',borderRadius:b.screen.radius+'px',transform:`scale(${g.scale})`};
    const path=this.assetBase.replace(/\/?$/,'/')+b.asset.split('/').pop();
    return html`<div class="device" style=${styleMap({aspectRatio:`${b.width} / ${b.height}`})}><div class="screen" part="screen" style=${styleMap(screenStyle)}>${this.status?html`<ds-app-chrome .kind=${b.kind==='phone'?'ios':'ipados'} .time=${this.time} .appearance=${this.appearance} .assetBase=${this.chromeAssets}></ds-app-chrome>`:nothing}<div class="content" part="viewport"><slot></slot></div>${this.browser==='safari'?html`<ds-app-chrome kind="safari-ios" .address=${this.address} .appearance=${this.appearance} .interactive=${this.interactive}></ds-app-chrome>`:nothing}<div class="home" aria-hidden="true"></div></div><img class="art" src=${path} alt="" width=${b.width} height=${b.height} @error=${()=>this.dispatchEvent(new CustomEvent('bezel-error',{detail:{device:b.id},bubbles:true,composed:true}))}></div>`;
  }
}
define('ds-device-bezel',DsDeviceBezel);
declare global { interface HTMLElementTagNameMap { 'ds-device-bezel': DsDeviceBezel; } }
