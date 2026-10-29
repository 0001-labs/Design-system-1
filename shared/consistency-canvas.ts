/** A canvas runs only callbacks installed by the trusted parent editor. WebKit suppresses
 * those callbacks without allow-scripts (WebKit 218086). CSP, installed before any page
 * content, still forbids every script supplied by the canvas itself. Keep both together. */
export const CANVAS_SANDBOX = 'allow-same-origin allow-scripts';
export const FACE_HOSTS = { styles: 'https://fonts.googleapis.com', fonts: 'https://fonts.gstatic.com' } as const;
export const CANVAS_POLICY = `default-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline' ${FACE_HOSTS.styles}; img-src 'self' data: https:; font-src 'self' data: ${FACE_HOSTS.fonts}; media-src 'self' https:; form-action 'none'; base-uri 'none'`;
/** The policy must precede even malformed trusted-shell markup, including an early script. */
export function protectCanvasHTML(source: string): string {
  const doctype = source.match(/^\s*<!doctype[^>]*>/i)?.[0] ?? '';
  return `${doctype}<meta http-equiv="Content-Security-Policy" content="${CANVAS_POLICY}">${source.slice(doctype.length)}`;
}
