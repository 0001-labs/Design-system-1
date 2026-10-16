import css from '../../../../DS1/1-root/one.semantic.css?raw';
export const GET = () => new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
