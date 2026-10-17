// What a Vite page declares for imports with a query (vite/client), and nothing else of Vite's.
declare module "*?inline" {
  const css: string;
  export default css;
}
declare module "*?raw" {
  const text: string;
  export default text;
}
