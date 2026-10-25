import { css, html, svg, nothing } from 'lit';

/** Presentation based on the supplied October 2026 iPhone Reels reference. Its frame and media are `instagram-frame.ts`, drawn before this loads. */
export const instagramStyles = css`
  .reels::before { content:''; position:absolute; inset:0; z-index:-1; pointer-events:none; background:linear-gradient(#0005,transparent 23%,transparent 55%,#0009); }
  .reels button { width:44px; height:44px; border-radius:8px; color:white; }
  .reels svg { width:27px; height:27px; stroke-width:1.8; }
  .reels-header { position:absolute; top:68px; left:12px; right:12px; display:flex; align-items:center; justify-content:space-between; }
  .reels-tabs { display:flex; gap:14px; font-size:24px; font-weight:700; }
  .reels-tabs span:last-child { color:#ffffffa6; }
  .reels-actions { position:absolute; right:10px; bottom:118px; display:grid; gap:15px; text-align:center; }
  .reels-action { display:grid; justify-items:center; font-size:13px; line-height:18px; }
  .reels-action button { height:36px; }
  .reels-action span:empty { display:none; }
  .reels-author { position:absolute; left:16px; right:64px; bottom:120px; font-size:14px; }
  .reels-identity { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
  .reels-avatar { flex:none; width:40px; height:40px; border:2px solid #fb44b8; border-radius:50%; padding:2px; background:#ffd52a; color:#111; display:grid; place-items:center; overflow:hidden; }
  .reels-avatar img { width:100%; height:100%; object-fit:cover; border-radius:50%; }
  .reels-name { font-weight:650; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .reels-verified { font-size:15px; }
  .reels .reels-follow { width:auto; height:28px; padding:0 9px; border:1px solid #ffffff80; font-size:14px; }
  .reels-caption { margin:0; line-height:20px; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; }
  .reels-progress { position:absolute; bottom:98px; left:16px; right:16px; height:2px; background:#ffffff40; border-radius:2px; overflow:hidden; }
  .reels-progress i { display:block; height:100%; background:white; transform-origin:left; }
  .reels-nav { position:absolute; bottom:26px; left:50px; right:50px; height:52px; padding:3px; border:1px solid #ffffff40; border-radius:30px; background:#3339; backdrop-filter:blur(20px); display:flex; align-items:center; justify-content:space-around; }
  .reels-nav button { flex:1; border-radius:30px; height:44px; }
  .reels-nav .selected { background:#ffffff30; }
`;
const paths: Record<string,string> = {
  plus:'M12 3v18M3 12h18', heart:'M12 21 3.5 13C-3 6 6-1 12 6 18-1 27 6 20.5 13Z',
  comment:'M21 20 20 15a9 9 0 1 0-5 5Z', repost:'m15 2 4 4-4 4M19 6H7a4 4 0 0 0-4 4v3m6 9-4-4 4-4M5 18h12a4 4 0 0 0 4-4v-3',
  send:'m3 3 19 1-8 18-4-11Z M10 11 22 4', more:'M4 8h16M4 14h11',
  home:'m3 10 9-8 9 8v11h-6v-8H9v8H3Z', reels:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z m5 4 7 5-7 5Z',
  search:'M17 17 22 22M20 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0', profile:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3v18', filters:'M2 6h20M2 18h20M7 3v6M17 15v6',
};
interface ReelsOptions { interactive:boolean; username:string; caption:string; avatar:string; verified:boolean; likes:string; comments:string; reposts:string; shares:string; progress:number; action:(action:string)=>void }
export function instagram(o:ReelsOptions) {
  const button=(action:string,label:string,selected=false)=>html`<button type="button" class=${selected?'selected':''} aria-label=${label} ?disabled=${!o.interactive} tabindex=${o.interactive?0:-1} @click=${()=>o.action(action)}>${svg`<svg viewBox="0 0 24 24" aria-hidden="true"><path d=${paths[action] ?? paths.profile}></path></svg>`}</button>`;
  const action=(name:string,label:string,count:string)=>html`<div class="reels-action">${button(name,label)}<span>${count}</span></div>`;
  return html`<div class="reels"><div class="reels-media"><slot></slot></div><div class="reels-header">${button('plus','Create')}<div class="reels-tabs"><span>Reels</span><span>Friends</span></div>${button('filters','Feed preferences')}</div><div class="reels-actions">${action('heart','Like',o.likes)}${action('comment','Comment',o.comments)}${action('repost','Repost',o.reposts)}${action('send','Share',o.shares)}${action('more','More','')}</div><div class="reels-author"><div class="reels-identity"><span class="reels-avatar">${o.avatar?html`<img src=${o.avatar} alt="">`:html`<span>◎</span>`}</span><span class="reels-name">${o.username}</span>${o.verified?html`<span class="reels-verified" aria-label="Verified">✹</span>`:nothing}<button class="reels-follow" ?disabled=${!o.interactive} tabindex=${o.interactive?0:-1} @click=${()=>o.action('follow')}>Follow</button></div><p class="reels-caption">${o.caption}</p></div><div class="reels-progress" aria-hidden="true"><i style=${`transform:scaleX(${Math.min(1,Math.max(0,o.progress))})`}></i></div><nav class="reels-nav" aria-label="Instagram">${button('home','Home')}${button('reels','Reels',true)}${button('send','Messages')}${button('search','Search')}${button('profile','Profile')}</nav></div>`;
}
