import { LitElement, css, html, nothing } from 'lit';
import { instagram, instagramStyles } from './instagram';
import { define } from '../0-face/define';
import '../2-core/ds-icon';
import { browserStyles } from './browser-styles';
import { mobileChromeStyles, cellularSignal } from './mobile-chrome';

export type AppChromeKind = 'macos' | 'macos-compact' | 'ios' | 'ipados' | 'safari' | 'chrome' | 'edge' | 'safari-ios' | 'instagram';
/** Platform presentation chrome. Controls emit requests; they never navigate or close the host app. */
export class DsAppChrome extends LitElement {
  static properties = {
    username: {}, caption: {}, avatar: {}, verified: {type:Boolean}, likes: {}, comments: {}, reposts: {}, shares: {}, progress: {type:Number},
    kind: { reflect: true }, appearance: { reflect: true }, time: {}, address: {}, label: {}, href: {},
    network: {}, battery: {type:Number}, dualSim: {type:Boolean,attribute:'dual-sim'},
    favicon: {}, backAvailable: {type:Boolean, attribute:'back-available'}, forwardAvailable: {type:Boolean, attribute:'forward-available'},
    assetBase: { attribute: 'asset-base' }, interactive: { type: Boolean, reflect: true },
  };
  declare username:string; declare caption:string; declare avatar:string; declare verified:boolean; declare likes:string; declare comments:string; declare reposts:string; declare shares:string; declare progress:number;
  declare kind: AppChromeKind;
  declare appearance: string;
  declare time: string;
  declare address: string;
  declare label: string;
  declare href: string;
  declare assetBase: string;
  declare interactive: boolean;
  declare favicon: string;
  declare network: string;
  declare battery: number;
  declare dualSim: boolean;
  declare backAvailable: boolean;
  declare forwardAvailable: boolean;
  constructor(){super();this.username='account';this.caption='';this.avatar='';this.verified=false;this.likes='';this.comments='';this.reposts='';this.shares='';this.progress=0;this.kind='macos';this.appearance='light';this.time='00:01';this.address='';this.label='Application';this.href='';this.assetBase='';this.interactive=false;this.favicon='';this.network='4G';this.battery=80;this.dualSim=false;this.backAvailable=true;this.forwardAvailable=false;}
  static styles = [css`
    :host { display:block; color:#202124; background:#f4f4f4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; font-size:13px; --chrome-line:#d6d6d6; --chrome-field:#fff; --chrome-selected:#fff; }
    :host([appearance=dark]) { color:#efefef; background:#292a2d; --chrome-line:#444; --chrome-field:#202124; --chrome-selected:#35363a; }
    * { box-sizing:border-box; } button { font:inherit; color:inherit; border:0; background:none; padding:0; display:grid; place-items:center; width:28px; height:28px; border-radius:5px; }
    button:focus-visible { outline:2px solid #1677ff; outline-offset:1px; } button:enabled:hover { background:color-mix(in srgb,currentColor 10%,transparent); }
    button:disabled { opacity:1; } svg { width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; }
    .lights { display:flex; align-items:center; gap:8px; width:72px; flex:none; padding-left:12px; }
    .lights button { width:12px; height:12px; border:1px solid #0002; border-radius:50%; background:#ff5f57; }
    .lights button:nth-child(2) { background:#febc2e; } .lights button:nth-child(3) { background:#28c840; }
    .lights svg { --chrome-icon-size:8px; opacity:0; width:8px; height:8px; stroke:#333; } :host([interactive]) .lights:hover svg { opacity:1; }
    .compact { --compact-scale:var(--sf,1); height:calc(30px * var(--compact-scale)); position:relative; display:flex; justify-content:center; align-items:center; border-bottom:1px solid var(--chrome-line); background:var(--ds-window-chrome-background,#f4f4f4); color:var(--ds-window-chrome-color,#26251e); font:calc(14px * var(--compact-scale))/calc(20px * var(--compact-scale)) var(--ds-typeface-regular,system-ui,sans-serif); }
    .compact .lights { position:absolute; left:calc(8px * var(--compact-scale)); top:0; width:auto; height:100%; padding:0; gap:calc(6px * var(--compact-scale)); }
    .compact .lights button { flex:none; width:calc(10px * var(--compact-scale)); height:calc(10px * var(--compact-scale)); border:0; background:color-mix(in srgb,currentColor 18%,transparent); }
    .compact .title { flex:initial; max-width:calc(100% - 120px * var(--compact-scale)); padding:0 calc(4px * var(--compact-scale)); font-weight:400; color:inherit; text-decoration:none; border-radius:calc(4px * var(--compact-scale)); }
    .compact a.title:hover { background:color-mix(in srgb,currentColor 8%,transparent); }
    .compact a.title:focus-visible { outline:2px solid currentColor; outline-offset:1px; }
    :host([appearance=dark]) .compact { --ds-window-chrome-background:#292a2d; --ds-window-chrome-color:#efefef; }
    .native { height:38px; display:flex; align-items:center; border-bottom:1px solid var(--chrome-line); }
    .title { text-align:center; flex:1; padding-right:72px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; font-weight:600; }
    .tabs { display:flex; align-items:center; height:38px; gap:8px; padding-right:8px; }
    .tab { align-self:end; height:30px; min-width:100px; width:220px; background:var(--chrome-selected); border-radius:10px 10px 0 0; display:flex; align-items:center; padding:0 12px; gap:8px; }
    .tab span { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .toolbar { min-height:42px; display:flex; align-items:center; gap:6px; padding:6px 10px; background:var(--chrome-selected); border-bottom:1px solid var(--chrome-line); }
    .address { min-width:0; flex:1; height:28px; padding:0 12px; display:flex; align-items:center; justify-content:center; gap:8px; background:var(--chrome-field); border:1px solid var(--chrome-line); border-radius:7px; }
    .address span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .status { height:62px; padding-top:3px; display:flex; align-items:center; justify-content:center; font-size:17.67px; font-weight:590; line-height:22px; background:var(--chrome-screen,#fff); color:var(--chrome-ink,#000); }
    :host([appearance=dark]) .status { background:var(--chrome-screen,#111); color:var(--chrome-ink,#fff); }
    .clock { flex:1; text-align:center; padding-left:10px; font-variant-numeric:tabular-nums; }
    .island-space { width:125px; flex:none; }
    .levels { flex:1; display:flex; justify-content:center; align-items:center; gap:8px; padding-right:10px; }
    .battery-art { position:relative; display:block; width:29.333px; height:13.667px; } .battery-art img { display:block; opacity:.3; } .battery-art .charge-art { position:absolute; inset:0; opacity:1; }
    .cellular { display:flex; align-items:end; gap:2.333px; height:15px; } .cellular i { display:block; width:3.333px; border-radius:4px; background:currentColor; }
    .cellular i:nth-child(1){height:6.333px}.cellular i:nth-child(2){height:8.67px}.cellular i:nth-child(3){height:11px}.cellular i:nth-child(4){height:13.667px}
    .battery-fallback { width:27px;height:13px;border:1px solid currentColor;border-radius:3px;padding:2px;position:relative; }.battery-fallback::before {content:"";display:block;height:100%;background:currentColor;border-radius:1px}.battery-fallback::after {content:"";position:absolute;right:-3px;top:3px;width:2px;height:5px;background:currentColor;border-radius:0 1px 1px 0}.wifi { width:19.333px; height:14.333px; }.battery { width:29.333px; height:13.667px; }
    :host([appearance=dark]) .levels img { filter:invert(1); }
    :host([kind=ipados]) .status { height:32px; font-size:13px; justify-content:space-between; padding:0 26px; }
    :host([kind=ipados]) .clock { flex:none; padding:0; } :host([kind=ipados]) .island-space { display:none; } :host([kind=ipados]) .levels { flex:none; padding:0; }
    .mobile { padding:8px 16px; background:var(--chrome-selected); }
    .mobile .address { height:44px; border-radius:22px; }
    .mobile-actions { display:flex; justify-content:space-between; margin-top:8px; }
  `, browserStyles, mobileChromeStyles, instagramStyles];
  private drawIcon?: typeof import('./browser-icons').browserIcon;
  protected updated(changed: Map<string, unknown>) {
    if (!changed.has('kind') && !changed.has('interactive')) return;
    if (this.kind === 'instagram') return;
    if (this.kind === 'ios' || this.kind === 'ipados') return;
    if ((this.kind === 'macos' || this.kind === 'macos-compact') && !this.interactive) return;
    void import('./browser-icons').then(async (icons) => {
      await icons.loadBrowserIcons(this.kind);
      this.drawIcon = icons.browserIcon;
      this.requestUpdate();
    }).catch(() => {
      this.dispatchEvent(new CustomEvent('chrome-error', { detail: { kind: this.kind }, bubbles: true, composed: true }));
    });
  }
  private icon(name: string) {
    return this.drawIcon?.(name, this.kind) ?? nothing;
  }
  private control(action: string, label: string, available = true) {
    return html`<button type="button" aria-label=${label} class=${available?'':'unavailable'} ?disabled=${!this.interactive || !available} tabindex=${this.interactive&&available?0:-1} @click=${()=>this.dispatchEvent(new CustomEvent('chrome-action',{detail:{action},bubbles:true,composed:true}))}>${this.icon(action)}</button>`;
  }
  private lights() { return html`<div class="lights">${this.control('close','Close window')}${this.control('minimize','Minimize window')}${this.control('zoom','Zoom window')}</div>`; }
  render() {
    if(this.kind==='instagram') return instagram({...this, interactive:this.interactive, username:this.username, caption:this.caption, avatar:this.avatar, verified:this.verified, likes:this.likes, comments:this.comments, reposts:this.reposts, shares:this.shares, progress:this.progress, action:(action:string)=>this.dispatchEvent(new CustomEvent('chrome-action',{detail:{action},bubbles:true,composed:true}))});
    if(this.kind==='ios'||this.kind==='ipados') return html`<div class="status"><span class="clock">${this.time}</span><span class="island-space"></span><span class="levels">${this.dualSim ? cellularSignal(true) : html`<span class="cellular" role="img" aria-label="Full signal"><i></i><i></i><i></i><i></i></span>`}${this.network==='wifi' ? (this.assetBase ? html`<img class="wifi" alt="Wi-Fi" src=${this.assetBase+'status-wifi.svg'}>` : html`<ds-icon type="wifi" class="wifi" aria-label="Wi-Fi" style="--ds-icon-size:19px"></ds-icon>`) : html`<span class="network">${this.network}</span>`}${this.assetBase ? html`<span class="battery-art" role="img" aria-label=${`Battery ${Math.min(100,Math.max(0,this.battery))}%`}><img class="battery" alt="" src=${this.assetBase+'status-battery.svg'}><img class="battery charge-art" alt="" src=${this.assetBase+'status-battery.svg'} style=${`clip-path:inset(0 ${100-Math.min(100,Math.max(0,this.battery))}% 0 0)`}></span>` : html`<span class="battery-meter" role="img" aria-label=${`Battery ${Math.min(100,Math.max(0,this.battery))}%`} style=${`--battery-charge:${Math.min(100,Math.max(0,this.battery))}%`}><span class="charge"></span></span>`}</span></div>`;
    if(this.kind==='macos-compact') return html`<div class="compact">${this.lights()}${this.href?html`<a class="title" href=${this.href} target="_blank" rel="noopener noreferrer" title=${this.href}>${this.address || this.label}</a>`:html`<span class="title">${this.address || this.label}</span>`}</div>`;
    if(this.kind==='macos') return html`<div class="native">${this.lights()}<span class="title">${this.label}</span><slot name="controls"></slot></div>`;
    if(this.kind==='safari-ios') return html`<div class="mobile">${this.control('back','Back',this.backAvailable)}<div class="address">${this.control('page-menu','Page menu')}<span>${this.address}</span>${this.control('reload','Reload')}</div>${this.control('tabs','Tabs')}</div>`;
    if(this.kind==='safari') return html`<div class="toolbar safari-toolbar">${this.lights()}<div class="safari-group sidebar-group">${this.control('sidebar','Sidebar')}${this.control('chevron-down','Tab groups')}</div><div class="safari-group history">${this.control('back','Back',this.backAvailable)}${this.control('forward','Forward',this.forwardAvailable)}</div><div class="address safari-address">${this.favicon?html`<img class="favicon" src=${this.favicon} alt="">`:nothing}<span>${this.address}</span>${this.control('page-menu','Page menu')}</div><div class="safari-group safari-actions">${this.control('share','Share')}${this.control('plus','New tab')}${this.control('tabs','Tab overview')}</div></div>`;
    const edge=this.kind==='edge';
    return html`<div class="tabs">${this.lights()}${this.control('chevron-down','Search tabs')}<div class="tab">${this.favicon?html`<img class="favicon" src=${this.favicon} alt="">`:this.icon('globe')}<span>${this.label}</span>${this.control('close-tab','Close tab')}</div>${this.control('plus','New tab')}</div><div class="toolbar browser-toolbar">${this.control('back','Back',this.backAvailable)}${!edge||this.forwardAvailable?this.control('forward','Forward',this.forwardAvailable):nothing}${this.control('reload','Reload')}<div class="address">${this.control(edge?'lock':'tune','Site information')}<span>${this.address}</span>${edge?this.control('reading','Reading mode'):nothing}${this.control('star',edge?'Add to favorites':'Bookmark this tab')}</div>${this.control(edge?'favorites':'extensions',edge?'Favorites':'Extensions')}${this.control('profile','Profile')}${this.control(edge?'more-horizontal':'more','Settings and more')}</div>`;
  }
}
define('ds-app-chrome', DsAppChrome);
declare global { interface HTMLElementTagNameMap { 'ds-app-chrome': DsAppChrome; } }
