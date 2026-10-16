const css = `@font-face { font-family: "Inter Arrows"; src: url("https://designsystem1.com/resources/fonts/Inter-Arrows.woff2") format("woff2"); font-display: swap; unicode-range: U+2190-21FF, U+2794-27FF, U+2900-297F, U+2B00-2BFF; }
@font-face { font-family: "GT America"; src: url("https://designsystem1.com/resources/fonts/GT-America-Standard-Regular.woff2") format("woff2"); font-display: swap; }
@font-face { font-family: "Iosevka Extended"; src: url("https://designsystem1.com/resources/fonts/Iosevka-Regular.woff2") format("woff2"); font-display: swap; }
:root { --one-font: "Inter Arrows", "GT America", sans-serif; --one-font-medium: "Inter Arrows", "GT America", sans-serif; --one-font-display: "Inter Arrows", "GT America", sans-serif; --one-font-mono: "Inter Arrows", "Iosevka Extended", monospace; }
`;
export const GET = () => new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
