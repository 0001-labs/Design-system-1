import { readFileSync, readdirSync } from 'node:fs';
const root = new URL('../../../../DS1/1-root/', import.meta.url);
const dist = new URL('../../../../dist/', import.meta.url);
const styles = ['one.css', 'grid.css', 'text.css', 'component-tokens.css', 'component-metrics.css', 'component-appearance.css', 'fonts.css', 'palette.css', 'prose.css'];
const scripts = readdirSync(dist).filter(file => file.endsWith('.js') && (file.startsWith('design-system-1.bundle') || /-[\w-]+\.js$/.test(file)));
const assets = [...styles, ...scripts, 'design-system-1.js', 'design-system-1.css'];
export const getStaticPaths = () => [...new Set(assets)].map(asset => ({ params: { asset } }));
export const GET = ({ params }: { params: { asset?: string } }) => {
  const name = params.asset;
  if (!name || !assets.includes(name)) return new Response('Not found', { status: 404 });
  const body = name === 'design-system-1.css'
    ? '@import "./one.css";\n@import "./prose.css";\n' + readFileSync(new URL(name, dist), 'utf8') + '\nhtml:root { --ds-sf: var(--sf, 1); }\n'
    : readFileSync(new URL(name === 'design-system-1.js' ? 'design-system-1.bundle.min.js' : name, styles.includes(name) ? root : dist), 'utf8');
  return new Response(body, { headers: { 'Content-Type': name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
};
