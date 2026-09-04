// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  vite: {
    server: {
      fs: {
        // Allow serving files from parent directory
        allow: [".."],
      },
    },
  },
  integrations: [
    starlight({
      title: "Design system 1",
      description:
        "A component-based design system built with TypeScript and LitElement that provides reusable UI components with built-in theming, internationalization, and accessibility features.",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/0001-labs/Design-system-1",
        },
      ],
      components: {
        // Override the default Sidebar component
        Sidebar: "./src/components/MySidebar.astro",
        // Override the default Head component to load DS one from CDN
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
        "./src/styles/landing.css",
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            { label: "Introduction", slug: "" },
            { label: "Manual Setup", slug: "start-here/quick-start" },
          ],
        },
        {
          label: "Built-ins",
          items: [
            { label: "i18n", slug: "built-ins/i18n" },
            { label: "Theming", slug: "built-ins/theming" },
            { label: "Device", slug: "built-ins/device" },
            { label: "Preferences", slug: "built-ins/preferences" },
            { label: "Pricing", slug: "built-ins/pricing" },
          ],
        },
        {
          label: "1 Root",
          items: [
            { label: "Styling", slug: "1-root/styling" },
            { label: "Fonts", slug: "1-root/fonts" },
          ],
        },
        {
          label: "2 Core",
          items: [
            { label: "Banner", slug: "2-core/banner" },
            { label: "Button", slug: "2-core/button" },
            { label: "Card", slug: "2-core/card" },
            { label: "Cycle", slug: "2-core/cycle" },
            { label: "Date", slug: "2-core/date" },
            { label: "Gap", slug: "2-core/gap" },
            { label: "Icon", slug: "2-core/icon" },
            { label: "Input", slug: "2-core/input" },
            { label: "Link", slug: "2-core/link" },
            { label: "Text", slug: "2-core/text" },
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
            { label: "i18n", slug: "advanced/i18n" },
            { label: "Theming", slug: "advanced/theming" },
          ],
        },
        {
          label: "Demo",
          items: [{ label: "Interactive Demo", slug: "demo" }],
        },
      ],
    }),
  ],
});
