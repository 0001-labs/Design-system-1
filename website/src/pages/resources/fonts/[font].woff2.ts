import { readFileSync } from 'node:fs';
const names = ['Inter-Arrows', 'GT-America-Standard-Regular', 'GT-America-Standard-Medium', 'GT-America-Compressed-Regular', 'GT-Canon-M-Standard-Medium-Trial', 'Iosevka-Regular'];
export const getStaticPaths = () => names.map(font => ({ params: { font } }));
export const GET = ({ params }: { params: { font?: string } }) => {
  if (!params.font || !names.includes(params.font)) return new Response('Not found', { status: 404 });
  return new Response(readFileSync(new URL(`../../../../../DS1/1-root/fonts/${params.font}.woff2`, import.meta.url)), { headers: { 'Content-Type': 'font/woff2', 'Access-Control-Allow-Origin': '*' } });
};
