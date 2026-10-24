import { css, html, svg } from 'lit';

/** Measured from the supplied 1179×2556 iPhone capture at 3× (393×852 points). */
export const mobileChromeStyles = css`
  :host([kind=safari-ios]) { background:transparent; color:#080808; }
  :host([kind=safari-ios][appearance=dark]) { color:#f5f5f5; }
  .mobile { display:flex; align-items:center; gap:7px; padding:0 33px; height:49px; background:transparent; }
  .mobile > button,.mobile .address { height:49px; border:1px solid #00000016; border-radius:28px; background:linear-gradient(155deg,#ffffffa0,#ffffff66 45%,#ffffffb8); box-shadow:inset 0 1px 1px #fff,inset 0 -1px 2px #ffffffb0,0 2px 9px #00000005; backdrop-filter:blur(3px) saturate(1.5); -webkit-backdrop-filter:blur(3px) saturate(1.5); }
  .mobile > button { width:49px; flex:none; }
  .mobile .address { min-width:0; flex:1; padding:0 12px; gap:6px; justify-content:space-between; }
  .mobile .address span { text-align:center; color:inherit; font-size:17px; font-weight:600; letter-spacing:-.4px; }
  .mobile .address button { width:24px; height:36px; flex:none; }
  .mobile svg { width:28px; height:28px; stroke-width:1.65; }
  .mobile > button:first-child svg { width:27px; height:27px; stroke-width:1.8; }
  .mobile .address button svg { width:24px; height:24px; }
  :host([kind=safari-ios][appearance=dark]) .mobile > button,:host([kind=safari-ios][appearance=dark]) .mobile .address { border-color:#ffffff24; background:linear-gradient(155deg,#303030b8,#20202080 45%,#202020e0); box-shadow:inset 0 1px 1px #ffffff35,inset 0 -1px 2px #ffffff18,0 2px 9px #0001; }
  :host([kind=ios]) .status { height:59px; padding-top:0; }
  .network { font-size:14px; font-weight:500; line-height:16px; letter-spacing:-.4px; }
  .signal { display:block; width:20px; height:16px; fill:currentColor; stroke:none; }
  .status .levels { gap:6px; }
  .status .battery-meter { display:block; position:relative; width:25px; height:13px; border-radius:4.5px; background:color-mix(in srgb,currentColor 30%,transparent); overflow:visible; }
  .battery-meter .charge { display:block; height:100%; width:var(--battery-charge,80%); background:currentColor; border-radius:4.5px 0 0 4.5px; }
  .battery-meter::after { content:''; position:absolute; left:26px; top:4px; width:2px; height:5px; border-radius:0 2px 2px 0; background:color-mix(in srgb,currentColor 30%,transparent); }
`;
export const cellularSignal = (dual: boolean) => html`<svg class="signal" viewBox="0 0 20 16" role="img" aria-label=${dual?'Full dual-SIM signal':'Full signal'}>${[0,1,2,3].map(i=>svg`<rect x=${i*5} y=${dual?4-i:7-i*2} width="3.5" height=${dual?6+i:8+i*2} rx="1.75"></rect>${dual?svg`<rect x=${i*5} y="12" width="3.5" height="3.5" rx="1.75"></rect>`:''}`)}</svg>`;
