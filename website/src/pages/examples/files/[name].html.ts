import { HTML_EXAMPLES, exampleDocument } from '../../../lib/html-examples';
export const getStaticPaths = () => HTML_EXAMPLES.map(example => ({ params: { name: example.id }, props: { example } }));
export const GET = ({ props }: { props: { example: typeof HTML_EXAMPLES[number] } }) => new Response(exampleDocument(props.example), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
