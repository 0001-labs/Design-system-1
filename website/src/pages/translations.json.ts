import translations from '../data/translations.json';

export const prerender = true;
export function GET(): Response {
  return Response.json(translations);
}
