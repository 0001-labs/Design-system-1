// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  site: "https://designsystem1.com",
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
        // Override h1 to use ds-one text component
        h1: "./src/components/Heading.astro",
      },
      customCss: [
        // Custom CSS file
        "./src/styles/custom.css",
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "Overview", slug: "start-here/overview" },
            { label: "Use with HTML", slug: "start-here/quick-start" },
            { label: "Examples", slug: "start-here/examples" },
            { label: "Component examples", link: "/components/" },
            { label: "Email design", slug: "email" },
          ],
        },
        {
          label: "My libraries",
          items: [
            { label: "About My libraries", slug: "libraries" },
            { label: "Open My libraries", link: "/app/libraries" },
            { label: "API and tools", slug: "libraries/api" },
          ],
        },
        {
          label: "1 Root",
          items: [
            { label: "Colours", link: "/colours/" },
            { label: "Fonts", slug: "1-root/fonts" },
            { label: "Languages", slug: "1-root/languages" },
            { label: "Theming", slug: "1-root/theming" },
            { label: "Device", slug: "1-root/device" },
            { label: "Preferences", slug: "1-root/preferences" },
            { label: "Pricing", slug: "1-root/pricing" },
          ],
        },
        {
          label: "2 Core",
          items: [
            { label: "Avatar", slug: "2-core/avatar" },
            { label: "Banner", slug: "2-core/banner" },
            { label: "Button", slug: "2-core/button" },
            { label: "Card", slug: "2-core/card" },
            { label: "Chart", slug: "2-core/chart" },
            { label: "Cycle", slug: "2-core/cycle" },
            { label: "Date", slug: "2-core/date" },
            { label: "Gap", slug: "2-core/gap" },
            { label: "Icon", items: [
              { label: "Collection", slug: "2-core/icon/collection" },
              { label: "Builder", link: "/2-core/icon/collection/#builder" },
            ] },
            { label: "Input", slug: "2-core/input" },
            { label: "Language", slug: "2-core/language" },
            { label: "Link", slug: "2-core/link" },
            { label: "Text", slug: "2-core/text" },
            { label: "Toggle", slug: "2-core/toggle" },
            { label: "Tooltip", slug: "2-core/tooltip" },
          ],
        },
        {
          label: "3 Unit",
          items: [
            { label: "Accordion", slug: "3-unit/accordion" },
            { label: "Card", slug: "3-unit/card" },
            { label: "Form", slug: "3-unit/form" },
            { label: "List", slug: "3-unit/list" },
            { label: "Navigation", slug: "3-unit/navigation" },
            { label: "Panel", slug: "3-unit/panel" },
            { label: "Row", slug: "3-unit/row" },
            { label: "Sidebar", slug: "3-unit/sidebar" },
            { label: "Table", slug: "3-unit/table" },
          ],
        },
        {
          label: "4 Page",
          items: [
            { label: "Container", slug: "4-page/container" },
            { label: "Grid", slug: "4-page/grid" },
            { label: "Layout", slug: "4-page/layout" },
          ],
        },
        {
          label: "Advanced",
          items: [
            { label: "Theming", slug: "advanced/theming" },
          ],
        },
      ],
    }),
  ],
});
