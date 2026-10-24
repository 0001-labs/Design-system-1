import { LitElement, css, html } from 'lit';
import { define } from '../0-face/define';
import './app-chrome';
/** Window shell around real app DOM or an iframe. The default slot owns the viewport. */
export class DsWindow extends LitElement {
  static properties = { kind:{reflect:true}, appearance:{reflect:true}, label:{}, address:{}, interactive:{type:Boolean}, favicon:{}, backAvailable:{type:Boolean,attribute:'back-available'}, forwardAvailable:{type:Boolean,attribute:'forward-available'} };
  kind='macos'; appearance='light'; label='Application'; address=''; interactive=false; favicon=''; backAvailable=true; forwardAvailable=false;
  static styles=css`
    :host { display:flex; flex-direction:column; min-width:0; height:var(--ds-window-height,100%); overflow:hidden; border-radius:12px; border:1px solid #0003; background:var(--ds-window-paper,#fff); box-shadow:0 20px 50px #0002; }
    :host([appearance=dark]) { border-color:#ffffff40; --ds-window-paper:#1c1c1e; }
    ds-app-chrome { flex:none; } .viewport { position:relative; flex:1; min-height:0; overflow:hidden; }
    ::slotted(iframe) { display:block; width:100%; height:100%; border:0; }
  `;
  render(){return html`<ds-app-chrome .kind=${this.kind} .appearance=${this.appearance} .label=${this.label} .address=${this.address} .interactive=${this.interactive} .favicon=${this.favicon} .backAvailable=${this.backAvailable} .forwardAvailable=${this.forwardAvailable}></ds-app-chrome><div class="viewport" part="viewport"><slot></slot></div>`;}
}
define('ds-window',DsWindow);
declare global { interface HTMLElementTagNameMap { 'ds-window': DsWindow; } }
