import { css } from 'lit';

/** macOS reference layouts: Safari 27 compact, Chrome 155, Edge 156. CSS pixels at 1×. */
export const browserStyles = css`
  :host { --browser-strip:#dee1e6; --browser-toolbar:#fff; --browser-address:#f1f3f4; --browser-ink:#3c4043; }
  :host([appearance=dark]) { --browser-strip:#202124; --browser-toolbar:#35363a; --browser-address:#202124; --browser-ink:#e8eaed; }
  :host([kind=edge]) { --browser-strip:#f3f3f3; --browser-toolbar:#fff; --browser-address:#fff; --browser-ink:#242424; }
  :host([kind=edge][appearance=dark]) { --browser-strip:#202020; --browser-toolbar:#2b2b2b; --browser-address:#2b2b2b; --browser-ink:#f5f5f5; }
  .unavailable { opacity:.35 !important; }
  .favicon { width:16px; height:16px; object-fit:contain; flex:none; }
  .lights { width:80px; padding-left:12px; gap:8px; height:100%; }
  .lights svg { width:8px; height:8px; }
  .tabs { height:40px; gap:8px; padding:0 8px 0 0; background:var(--browser-strip); color:var(--browser-ink); }
  .tabs > button { width:28px; height:28px; flex:none; border-radius:8px; }
  .tab { position:relative; isolation:isolate; height:34px; width:232px; min-width:80px; border-radius:12px 12px 0 0; padding:0 10px; gap:8px; background:var(--browser-toolbar); font-size:13px; font-weight:400; }
  .tab::before,.tab::after { content:''; position:absolute; bottom:0; width:12px; height:12px; background:transparent; z-index:-1; }
  .tab::before { left:-12px; border-radius:0 0 12px 0; box-shadow:4px 4px 0 4px var(--browser-toolbar); }
  .tab::after { right:-12px; border-radius:0 0 0 12px; box-shadow:-4px 4px 0 4px var(--browser-toolbar); }
  .tab > svg { flex:none; width:16px; height:16px; color:#5f6368; }
  :host([appearance=dark]) .tab > svg { color:#bdc1c6; }
  .tab button { flex:none; width:20px; height:20px; border-radius:50%; }
  .tab button svg { width:16px; height:16px; }
  .browser-toolbar { height:46px; min-height:46px; padding:6px; gap:2px; background:var(--browser-toolbar); color:var(--browser-ink); border-bottom:1px solid #00000015; }
  .browser-toolbar > button { width:34px; height:34px; flex:none; border-radius:50%; }
  .browser-toolbar svg { width:20px; height:20px; stroke-width:1.65; }
  .browser-toolbar .address { height:34px; padding:0 6px; gap:4px; margin:0 4px; border:0; border-radius:17px; background:var(--browser-address); justify-content:start; }
  .address > span { flex:1; min-width:0; font-size:14px; }
  .browser-toolbar .address button { flex:none; width:28px; height:28px; border-radius:50%; }
  .browser-toolbar .address button svg { width:18px; height:18px; }
  :host([kind=edge]) .tabs { background:var(--browser-strip); gap:6px; }
  :host([kind=edge]) .tab { height:36px; width:240px; border-radius:10px 10px 0 0; }
  :host([kind=edge]) .browser-toolbar { height:40px; min-height:40px; padding:4px; gap:0; }
  :host([kind=edge]) .browser-toolbar > button { width:36px; height:32px; border-radius:6px; }
  :host([kind=edge]) .browser-toolbar svg { stroke-width:1.3; }
  :host([kind=edge]) .address { height:32px; border:1px solid #c7c7c7; margin:0 4px 0 0; padding:0 5px; }
  :host([kind=edge][appearance=dark]) .address { border-color:#555; }
  :host([kind=safari]) { background:#f8f8f8; color:#424242; }
  :host([kind=safari][appearance=dark]) { background:#444448; color:#f4f4f4; }
  :host([kind=safari]) .toolbar { height:52px; min-height:52px; padding:8px 12px 8px 0; gap:8px; border-bottom:1px solid #00000018; }
  .safari-group { display:flex; align-items:center; height:36px; border-radius:18px; background:#eaeaea; flex:none; padding:0 4px; }
  .safari-group button { width:32px; height:32px; border-radius:50%; }
  .safari-group svg { width:18px; height:18px; stroke-width:1.5; }
  .sidebar-group { gap:0; padding:0 8px; }
  .sidebar-group button:last-child { width:16px; }
  .sidebar-group button:last-child svg { width:12px; }
  :host([kind=safari]) .safari-address { height:36px; max-width:none; margin:0; padding:0 10px 0 16px; border-radius:18px; background:#eaeaea; border:1px solid #00000008; box-shadow:0 1px 2px #00000008; gap:8px; }
  .safari-address span { text-align:center; font-size:13px; }
  .safari-address button { width:24px; height:28px; flex:none; }
  .safari-actions { padding:0 8px; }
  :host([kind=safari][appearance=dark]) .safari-group { background:#5b5b5f; }
  :host([kind=safari][appearance=dark]) .safari-address { background:#505054; border-color:#ffffff10; }
  @media(max-width:480px) { .tab { width:180px; } }
`;
