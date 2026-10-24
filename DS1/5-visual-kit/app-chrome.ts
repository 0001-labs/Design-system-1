import { LitElement, css, html, nothing } from 'lit';
import { define } from '../0-face/define';
import '../2-core/ds-icon';

export type AppChromeKind = 'macos' | 'ios' | 'ipados' | 'safari' | 'chrome' | 'edge' | 'safari-ios';
/** Platform presentation chrome. Controls emit requests; they never navigate or close the host app. */
export class DsAppChrome extends LitElement {
  static properties = {
    kind: { reflect: true }, appearance: { reflect: true }, time: {}, address: {}, label: {},
    assetBase: { attribute: 'asset-base' }, interactive: { type: Boolean, reflect: true },
  };
  kind: AppChromeKind = 'macos';
  appearance = 'light';
  time = '00:01';
  address = '';
  label = 'Application';
  assetBase = '';
  interactive = false;
  static styles = css`
    :host { display:block; color:#202124; background:#f4f4f4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:13px; --chrome-line:#d6d6d6; --chrome-field:#fff; --chrome-selected:#fff; }
    :host([appearance=dark]) { color:#efefef; background:#292a2d; --chrome-line:#444; --chrome-field:#202124; --chrome-selected:#35363a; }
    * { box-sizing:border-box; } button { font:inherit; color:inherit; border:0; background:none; padding:0; display:grid; place-items:center; width:28px; height:28px; border-radius:5px; }
    button:focus-visible { outline:2px solid #1677ff; outline-offset:1px; } button:enabled:hover { background:color-mix(in srgb,currentColor 10%,transparent); }
    button:disabled { opacity:1; } svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
    .lights { display:flex; align-items:center; gap:8px; width:72px; flex:none; padding-left:12px; }
    .lights button { width:12px; height:12px; border:1px solid #0002; border-radius:50%; background:#ff5f57; }
    .lights button:nth-child(2) { background:#febc2e; } .lights button:nth-child(3) { background:#28c840; }
    .lights ds-icon { --chrome-icon-size:8px; opacity:0; width:8px; height:8px; stroke:#333; } :host([interactive]) .lights:hover ds-icon { opacity:1; }
    .native { height:38px; display:flex; align-items:center; border-bottom:1px solid var(--chrome-line); }
    .title { text-align:center; flex:1; padding-right:72px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-weight:600; }
    .tabs { display:flex; align-items:center; height:38px; gap:8px; padding-right:8px; }
    .tab { align-self:end; height:30px; min-width:100px; width:220px; background:var(--chrome-selected); border-radius:10px 10px 0 0; display:flex; align-items:center; padding:0 12px; gap:8px; }
    .tab span { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .toolbar { min-height:42px; display:flex; align-items:center; gap:6px; padding:6px 10px; background:var(--chrome-selected); border-bottom:1px solid var(--chrome-line); }
    .address { min-width:0; flex:1; height:28px; padding:0 12px; display:flex; align-items:center; justify-content:center; gap:8px; background:var(--chrome-field); border:1px solid var(--chrome-line); border-radius:7px; }
    .address span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    :host([kind=chrome]) .address { border-radius:20px; justify-content:start; background:color-mix(in srgb,var(--chrome-field) 90%,currentColor); }
    :host([kind=edge]) .tab { border-radius:8px 8px 0 0; } :host([kind=edge]) .tabs { background:color-mix(in srgb,#bdd7d0 20%,transparent); }
    :host([kind=safari]) .toolbar { height:52px; background:transparent; gap:8px; }
    :host([kind=safari]) .address { margin-inline:20px; max-width:600px; }
    .status { height:62px; padding-top:3px; display:flex; align-items:center; justify-content:center; font-size:17.67px; font-weight:590; line-height:22px; background:var(--chrome-screen,#fff); color:var(--chrome-ink,#000); }
    :host([appearance=dark]) .status { --chrome-screen:#111; --chrome-ink:#fff; }
    .clock { flex:1; text-align:center; padding-left:10px; font-variant-numeric:tabular-nums; }
    .island-space { width:125px; flex:none; }
    .levels { flex:1; display:flex; justify-content:center; align-items:center; gap:8px; padding-right:10px; }
    .cellular { display:flex; align-items:end; gap:2.333px; height:15px; } .cellular i { display:block; width:3.333px; border-radius:4px; background:currentColor; }
    .cellular i:nth-child(1){height:6.333px}.cellular i:nth-child(2){height:8.67px}.cellular i:nth-child(3){height:11px}.cellular i:nth-child(4){height:13.667px}
    .battery-fallback { width:27px;height:13px;border:1px solid currentColor;border-radius:3px;padding:2px;position:relative; }.battery-fallback::before {content:"";display:block;height:100%;background:currentColor;border-radius:1px}.battery-fallback::after {content:"";position:absolute;right:-3px;top:3px;width:2px;height:5px;background:currentColor;border-radius:0 1px 1px 0}.wifi { width:19.333px; height:14.333px; }.battery { width:29.333px; height:13.667px; }
    :host([appearance=dark]) .levels img { filter:invert(1); }
    :host([kind=ipados]) .status { height:32px; font-size:13px; justify-content:space-between; padding:0 26px; }
    :host([kind=ipados]) .clock { flex:none; padding:0; } :host([kind=ipados]) .island-space { display:none; } :host([kind=ipados]) .levels { flex:none; padding:0; }
    .mobile { padding:8px 16px; background:var(--chrome-selected); }
    .mobile .address { height:44px; border-radius:22px; }
    .mobile-actions { display:flex; justify-content:space-between; margin-top:8px; }
  `;
  private icon(name: string) {
    const types: Record<string,string> = { back:'left', forward:'right', reload:'refresh', share:'shared', tabs:'tabs', sidebar:'window', plus:'plus', close:'close', 'close-tab':'close', minimize:'minus', zoom:'up-right', more:'more', lock:'lock' };
    return html`<ds-icon type=${types[name] || 'more'} aria-hidden="true" style="--ds-icon-size:var(--chrome-icon-size,16px);--ds-sf:1"></ds-icon>`;
  }
  private control(action: string, label: string) {
    return html`<button type="button" aria-label=${label} ?disabled=${!this.interactive} tabindex=${this.interactive?0:-1} @click=${()=>this.dispatchEvent(new CustomEvent('chrome-action',{detail:{action},bubbles:true,composed:true}))}>${this.icon(action)}</button>`;
  }
  private lights() { return html`<div class="lights">${this.control('close','Close window')}${this.control('minimize','Minimize window')}${this.control('zoom','Zoom window')}</div>`; }
  private location() { return html`<div class="address">${this.icon('lock')}<span>${this.address}</span>${this.control('reload','Reload')}</div>`; }
  render() {
    if(this.kind==='ios'||this.kind==='ipados') return html`<div class="status"><span class="clock">${this.time}</span><span class="island-space"></span><span class="levels"><span class="cellular" aria-label="Full signal"><i></i><i></i><i></i><i></i></span>${this.assetBase ? html`<img class="wifi" alt="Wi-Fi" src=${this.assetBase+'status-wifi.svg'}><img class="battery" alt="Full battery" src=${this.assetBase+'status-battery.svg'}>` : html`<ds-icon type="wifi" class="wifi" aria-label="Wi-Fi" style="--ds-icon-size:19px"></ds-icon><span class="battery-fallback" role="img" aria-label="Full battery"></span>`}</span></div>`;
    if(this.kind==='macos') return html`<div class="native">${this.lights()}<span class="title">${this.label}</span><slot name="controls"></slot></div>`;
    if(this.kind==='safari-ios') return html`<div class="mobile">${this.location()}<div class="mobile-actions">${this.control('back','Back')}${this.control('forward','Forward')}${this.control('share','Share')}${this.control('tabs','Tabs')}</div></div>`;
    const safari=this.kind==='safari';
    return html`${safari?nothing:html`<div class="tabs">${this.lights()}<div class="tab"><span>${this.label}</span>${this.control('close-tab','Close tab')}</div>${this.control('plus','New tab')}</div>`}<div class="toolbar">${safari?this.lights():nothing}${this.control('back','Back')}${this.control('forward','Forward')}${safari?this.control('sidebar','Sidebar'):this.control('reload','Reload')}${this.location()}${this.control(safari?'share':'more',safari?'Share':'Menu')}${safari?this.control('tabs','Tabs'):nothing}</div>`;
  }
}
define('ds-app-chrome', DsAppChrome);
declare global { interface HTMLElementTagNameMap { 'ds-app-chrome': DsAppChrome; } }
