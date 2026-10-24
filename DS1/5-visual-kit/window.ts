import { LitElement, css, html } from 'lit';
import { define } from '../0-face/define';
import './app-chrome';
/** Window shell around real app DOM or an iframe. The default slot owns the viewport. */
export class DsWindow extends LitElement {
  static properties = { frameless:{type:Boolean,reflect:true}, kind:{reflect:true}, appearance:{reflect:true}, label:{}, address:{}, interactive:{type:Boolean}, favicon:{}, backAvailable:{type:Boolean,attribute:'back-available'}, forwardAvailable:{type:Boolean,attribute:'forward-available'} };
  declare frameless: boolean; declare kind: string; declare appearance: string; declare label: string; declare address: string; declare interactive: boolean; declare favicon: string; declare backAvailable: boolean; declare forwardAvailable: boolean;
  constructor(){super();this.frameless=false;this.kind='macos';this.appearance='light';this.label='Application';this.address='';this.interactive=false;this.favicon='';this.backAvailable=true;this.forwardAvailable=false;}
  static styles=css`
    :host { display:flex; flex-direction:column; min-width:0; height:var(--ds-window-height,100%); overflow:hidden; border-radius:12px; border:1px solid #0003; background:var(--ds-window-paper,#fff); box-shadow:0 20px 50px #0002; }
    :host([frameless]) { display:contents; }
    :host([frameless]) ds-app-chrome { display:none; }
    :host([frameless]) .viewport { display:contents; }
    :host([appearance=dark]) { border-color:#ffffff40; --ds-window-paper:#1c1c1e; }
    :host([kind=macos-compact]) { border-radius:10px; box-shadow:none; border-color:color-mix(in srgb,var(--ds-text-color,#26251e) 10%,transparent); }
    ds-app-chrome { flex:none; } .viewport { position:relative; flex:1; min-height:0; overflow:hidden; }
    ::slotted(iframe) { display:block; width:100%; height:100%; border:0; }
  `;
  render(){return html`<ds-app-chrome .kind=${this.kind} .appearance=${this.appearance} .label=${this.label} .address=${this.address} .interactive=${this.interactive} .favicon=${this.favicon} .backAvailable=${this.backAvailable} .forwardAvailable=${this.forwardAvailable}></ds-app-chrome><div class="viewport" part="viewport"><slot></slot></div>`;}
}
define('ds-window',DsWindow);
declare global { interface HTMLElementTagNameMap { 'ds-window': DsWindow; } }
