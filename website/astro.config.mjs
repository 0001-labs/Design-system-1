// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://designsystem1.com",
  // Checkbox and Switch were one page; the old address goes to the checkbox (19 October 2026).
  redirects: {
    "/2-core/choice/": "/2-core/checkbox/",
    // The front page became the Overview, in the docs (21 October 2026).
    "/start-here/overview/": "/",
    "/examples/": "/start-here/examples/",
    "/examples/settings/": "/start-here/examples/#general-settings",
    "/examples/shop/": "/start-here/examples/#shop",
    "/examples/planner/": "/start-here/examples/#planning-app",
    "/examples/finance/": "/start-here/examples/#finance-app",
    "/examples/product/": "/start-here/examples/#product-showcase",
  },
  devToolbar: { enabled: false },
  vite: {
    // Preview frames load components dynamically. Prebundle their shared
    // dependencies before serving any frame so the first preview cannot
    // invalidate another frame's Lit URLs halfway through registration.
    optimizeDeps: {
      include: ['lit', 'lit/directives/unsafe-html.js', '@lit-labs/signals'],
    },
    server: {
      // Keep the embedded app same-origin while the docs and editor run locally.
      proxy: {
        '/app': { target: process.env.DS1_APP_DEV_ORIGIN || 'http://127.0.0.1:5173', ws: true },
      },
      fs: {
        // Allow serving files from parent directory
        allow: [".."],
      },
    },
  },
  integrations: [
    starlight({
      title: "Design system 1",
      expressiveCode: {
        // Long lines wrap: nothing in the docs scrolls inside itself.
        defaultProps: { wrap: true },
        // Code frames draw themselves: keep Design system 1's prose sheet out of them.
        plugins: [
          {
            name: "Not prose",
            hooks: {
              postprocessRenderedBlock: ({ renderData }) => {
                renderData.blockAst.properties.dataDsNotProse = "";
              },
            },
          },
        ],
      },
      pagefind: false,
      favicon: "/icons/design-system-1.svg",
      description:
        "A component-based design system built with TypeScript and LitElement that provides reusable UI components with built-in theming, internationalization, and accessibility features.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/0001-labs/ds-one",
        },
      ],
      components: {
        // Override the default Sidebar component
        Sidebar: "./src/components/MySidebar.astro",
        // Override the default Head component to load Design system 1 from CDN
        Head: "./src/components/MyHead.astro",
        // Override the default Header component
        Header: "./src/components/MyHeader.astro",
        // Override the default PageFrame to use our custom layout
        PageFrame: "./src/layouts/Layout.astro",
        // Mark the Markdown body as prose for Design system 1's prose sheet
        MarkdownContent: "./src/components/MarkdownContent.astro",
        // The page's title, drawn as Design system 1's display text
        PageTitle: "./src/components/Heading.astro",
        TableOfContents: "./src/components/TableOfContents.astro",
      },
      customCss: [
        // Custom CSS file
        "./src/styles/custom.css",
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "Overview", link: "/" },
            { label: "Use with HTML", slug: "start-here/quick-start" },
          ],
        },
        {
          label: "1 Root",
          items: [
            { label: "Colours", link: "/colours/" },
            { label: "Fonts", slug: "1-root/fonts" },
            { label: "Languages", slug: "1-root/languages" },
            { label: "Formatting", slug: "1-root/formatting" },
            { label: "Theming", slug: "1-root/theming" },
            { label: "Prose", slug: "1-root/prose" },
            { label: "Feedback", slug: "1-root/feedback" },
            { label: "Keys", slug: "1-root/keys" },
            { label: "Device", slug: "1-root/device" },
            { label: "Scaling", slug: "1-root/scaling" },
            { label: "Preferences", slug: "1-root/preferences" },
            { label: "Pricing", slug: "1-root/pricing" },
          ],
        },
        {
          label: "2 Core",
          items: [
            { label: "Avatar", slug: "2-core/avatar" },
            { label: "Button", slug: "2-core/button" },
            { label: "Card", slug: "2-core/card" },
            { label: "Chart", slug: "2-core/chart" },
            { label: "Checkbox", slug: "2-core/checkbox" },
            { label: "Cycle", slug: "2-core/cycle" },
            { label: "Empty state", slug: "2-core/empty" },
            { label: "Gap", slug: "2-core/gap" },
            { label: "Icon", slug: "2-core/icon" },
            { label: "Image", slug: "2-core/image" },
            { label: "Input", slug: "2-core/input" },
            { label: "Link", slug: "2-core/link" },
            { label: "Message", slug: "2-core/message" },
            { label: "Progress", slug: "2-core/progress" },
            { label: "Stat", slug: "2-core/stat" },
            { label: "Switch", slug: "2-core/switch" },
            { label: "Tag", slug: "2-core/tag" },
            { label: "Text", slug: "2-core/text" },
            { label: "Tooltip", slug: "2-core/tooltip" },
          ],
        },
        {
          label: "3 Unit",
          items: [
            { label: "Accordion", slug: "3-unit/accordion" },
            { label: "Calendar", slug: "3-unit/calendar" },
            { label: "Bento", slug: "3-unit/bento" },
            { label: "Carousel", slug: "3-unit/carousel" },
            { label: "Context", slug: "3-unit/context" },
            { label: "Form", slug: "3-unit/form" },
            { label: "List", slug: "3-unit/list" },
            { label: "Matrix", slug: "3-unit/matrix" },
            { label: "Row", slug: "3-unit/row" },
            { label: "Select", slug: "3-unit/select" },
            { label: "Sidebar", slug: "3-unit/sidebar" },
            { label: "Table", slug: "3-unit/table" },
            { label: "Table of contents", slug: "3-unit/table-of-contents" },
            { label: "Tabs", slug: "3-unit/tabs" },
          ],
        },
        {
          label: "4 Page",
          items: [
            { label: "Container", slug: "4-page/container" },
            { label: "Document", slug: "4-page/document" },
            { label: "Footer", slug: "4-page/footer" },
            { label: "Grid", slug: "4-page/grid" },
            { label: "Header", slug: "4-page/header" },
            { label: "Overlay", slug: "4-page/overlay" },
            { label: "Page", slug: "4-page/page" },
            { label: "Panel", slug: "4-page/panel" },
          ],
        },
        { label: "Examples", slug: "start-here/examples" },
        {
          label: "Advanced",
          items: [
            { label: "Native", slug: "advanced/native" },
            { label: "Email kit", slug: "email" },
            { label: "Film kit", slug: "advanced/film-kit" },
          ],
        },
      ],
    }),
  ],
});
