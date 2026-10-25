import { css, html } from 'lit';

/**
 * The Reels frame: its size, its transparent face and the slotted media. App chrome draws it from
 * the start, so the picture shows and nothing moves while the overlay (`instagram.ts`) loads on demand.
 */
export const instagramFrameStyles = css`
  :host([kind=instagram]) { height:100%; background:transparent; color:white; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .reels { position:relative; height:100%; overflow:hidden; isolation:isolate; }
  .reels-media { position:absolute; inset:0; z-index:-2; }
  .reels ::slotted(*) { width:100%; height:100%; display:block; object-fit:cover; }
`;

/** The frame alone, until the overlay has loaded. */
export const instagramFrame = () => html`<div class="reels"><div class="reels-media"><slot></slot></div></div>`;
