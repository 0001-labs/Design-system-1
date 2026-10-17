// ds-layout.ts
// Simple grid layout component with view mode

import { LitElement, html, css, unsafeCSS } from "lit";
import styles from "./styles/ds-layout.css?inline";

declare global {
  interface CustomElementRegistry {
    define(name: string, constructor: typeof LitElement): void;
  }
  var customElements: CustomElementRegistry;
}

export class Layout extends LitElement {
  static properties = {
    mode: { type: String },
    align: { type: String },
    view: { type: Boolean },
  };

  // Declared, not class fields, so Lit's reactive accessors are not shadowed.
  declare mode: string;
  declare align?: string;
  declare view?: boolean;

  constructor() {
    super();
    this.mode = "portfolio";
  }

  static styles = [
    unsafeCSS(styles),
    css`
      :host {
        display: grid;
        position: relative;
        width: 100%;
      }

      slot {
        display: contents;
      }

      :host([mode="portfolio"]) {
        --portfolio-cols: 120px 480px 40px;
        --portfolio-rows: 120px 120px 60px 180px 60px 120px 60px 20px 120px
          120px;
        --portfolio-areas: "square . ." ". title ." ". header ." ". projects ."
          ". . ." ". bio ." ". . ." ". nav ." ". . ." ". footer ." ". . .";
        --portfolio-overlay-cols: 120px 480px;
        --portfolio-overlay-areas: "square ." ". title" ". header" ". projects"
          ". ." ". bio" ". ." ". nav" ". ." ". footer" ". .";
        grid-template-columns: var(--portfolio-cols);
        grid-template-rows: var(--portfolio-rows);
        grid-template-areas: var(--portfolio-areas);
        min-height: 600px;
        background-color: rgba(165, 165, 165, 0.03);
        max-width: 640px;
        margin: 0;
      }

      :host([mode="portfolio"]) .view-overlay {
        grid-template-columns: var(--portfolio-overlay-cols);
        grid-template-rows: var(--portfolio-rows);
        grid-template-areas: var(--portfolio-overlay-areas);
      }

      :host([mode="company"]) {
        --company-cols: auto 400px auto;
        --company-rows: 80px 20px 20px 120px 20px 120px;
        --company-areas: ". . ." ". header ." ". . ." ". content ." ". . ."
          ". footer .";
        grid-template-columns: var(--company-cols);
        grid-template-rows: var(--company-rows);
        grid-template-areas: var(--company-areas);
        gap: 0;
        max-width: 100%;
      }

      :host([mode="company"]) .view-overlay {
        grid-template-columns: var(--company-cols);
        grid-template-rows: var(--company-rows);
        grid-template-areas: var(--company-areas);
        gap: 0;
      }

      :host([align="left"]),
      :host([mode="portfolio"][align="left"]),
      :host([mode="company"][align="left"]),
      :host([mode="app"][align="left"]),
      :host([mode="list"][align="left"]),
      :host([mode="home"][align="left"]),
      :host([mode="settings"][align="left"]) {
        margin: 0;
        justify-self: start;
      }

      :host([align="center"]),
      :host([mode="portfolio"][align="center"]),
      :host([mode="company"][align="center"]),
      :host([mode="app"][align="center"]),
      :host([mode="list"][align="center"]),
      :host([mode="home"][align="center"]),
      :host([mode="settings"][align="center"]) {
        margin: 0 auto;
        justify-self: center;
      }

      :host([align="right"]),
      :host([mode="portfolio"][align="right"]),
      :host([mode="company"][align="right"]),
      :host([mode="app"][align="right"]),
      :host([mode="list"][align="right"]),
      :host([mode="home"][align="right"]),
      :host([mode="settings"][align="right"]) {
        margin: 0 0 0 auto;
        justify-self: end;
      }

      /* App mode - Base */
      :host([mode="app"]) {
        --app-cols: 100%;
        --app-overlay-cols: 100%;
        grid-template-columns: var(--app-cols);
        grid-template-rows: var(--app-layout);
        grid-template-areas: var(--app-layout-areas);
        min-height: 100vh;
        background-color: transparent;
        width: calc(240px * var(--sf, 1));
        max-width: calc(240px * var(--sf, 1));
        margin: 0 auto;
      }

      :host([mode="app"]) .view-overlay {
        grid-template-columns: var(--app-overlay-cols);
        grid-template-rows: var(--app-layout);
        grid-template-areas: var(--app-layout-areas);
      }

      /* List mode - Base */
      :host([mode="list"]) {
        --list-cols: 100%;
        --list-rows: calc(var(--unit) * var(--sf)) calc(var(--unit) * var(--sf))
          calc(var(--unit) * var(--sf)) calc(var(--twenty) * var(--sf));
        --list-areas: "banner" "." "header" "board";
        --list-overlay-cols: 100%;
        --list-overlay-rows: calc(var(--unit) * var(--sf))
          calc(var(--unit) * var(--sf)) calc(var(--unit) * var(--sf))
          calc(var(--twenty) * var(--sf));
        --list-overlay-areas: "banner" "." "header" "board";
        grid-template-columns: var(--list-cols);
        grid-template-rows: var(--list-rows);
        grid-template-areas: var(--list-areas);
        min-height: 100vh;
        background-color: transparent;
        width: calc(240px * var(--sf, 1));
        max-width: calc(240px * var(--sf, 1));
        margin: 0 auto;
      }

      :host([mode="list"]) .view-overlay {
        grid-template-columns: var(--list-overlay-cols);
        grid-template-rows: var(--list-overlay-rows);
        grid-template-areas: var(--list-overlay-areas);
      }

      /* Home mode - Base */
      :host([mode="home"]) {
        --home-cols: 100%;
        --home-areas: "banner" "." "header" "." "lists";
        --home-overlay-cols: 100%;
        --home-overlay-areas: "banner" "." "header" "." "lists";
        grid-template-columns: var(--home-cols);
        grid-template-rows: var(--home-layout);
        grid-template-areas: var(--home-areas);
        min-height: 100vh;
        background-color: transparent;
        width: calc(240px * var(--sf, 1));
        max-width: calc(240px * var(--sf, 1));
        margin: 0 auto;
      }

      :host([mode="home"]) .view-overlay {
        grid-template-columns: var(--home-overlay-cols);
        grid-template-rows: var(--home-layout);
        grid-template-areas: var(--home-overlay-areas);
      }

      /* Settings mode - Base */
      :host([mode="settings"]) {
        --settings-cols: 100%;
        --settings-overlay-cols: 100%;
        grid-template-columns: var(--settings-cols);
        grid-template-rows: var(--settings-layout);
        grid-template-areas: var(--settings-layout-areas);
        min-height: 100vh;
        background-color: transparent;
        width: calc(240px * var(--sf, 1));
        max-width: calc(240px * var(--sf, 1));
        margin: 0 auto;
      }

      :host([mode="settings"]) .view-overlay {
        grid-template-columns: var(--settings-overlay-cols);
        grid-template-rows: var(--settings-layout);
        grid-template-areas: var(--settings-layout-areas);
      }

      .view-overlay {
        position: absolute;
        margin-left: -1px;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: 1000;
        display: grid;
      }

      .view-area {
        display: flex;
        width: calc(240px * var(--sf, 1));
        height: 100%;
        align-items: center;
        justify-content: center;
        font-family: var(--typeface-regular);
        font-size: calc(var(--type-size-default) * var(--05));
        color: color-mix(in srgb, var(--tuned-red) 25%, transparent);
        background-color: color-mix(
          in srgb,
          var(--accent-color) 25%,
          transparent
        );
        opacity: 1;
        position: relative;
      }

      .grid-area-label {
        position: absolute;
        top: calc(-20px * var(--sf, 1));
        left: 0;
        height: calc(20px * var(--sf, 1));
        width: fit-content;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 calc(4px * var(--sf, 1));
        border-radius: calc(2px * var(--sf, 1));
        z-index: 10000;
        pointer-events: none;
        white-space: nowrap;
      }

      /* Banner label stays inside the area (first item) */
      :host([mode="app"]) .view-area.view-banner .grid-area-label,
      :host([mode="list"]) .view-area.view-banner .grid-area-label,
      :host([mode="home"]) .view-area.view-banner .grid-area-label,
      :host([mode="settings"]) .view-area.view-banner .grid-area-label,
      :host([mode="company"]) .view-area.view-header .grid-area-label,
      :host([mode="portfolio"]) .view-area.view-square .grid-area-label {
        top: 0;
      }

      .grid-area-label ds-text {
        font-size: calc(11px * var(--sf, 1));
        line-height: 1;
        color: white;
        text-transform: lowercase;
      }

      :host([mode="portfolio"]) .view-area:nth-of-type(1) {
        background-color: color-mix(in srgb, var(--tuned-red) 25%, transparent);
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(1) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--tuned-red) 70%, black) 0%,
            color-mix(in srgb, var(--tuned-red) 70%, black) 100%
          );
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(2) {
        border-color: var(--sharp-blue);
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(2) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 0%,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 100%
          );
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(3) {
        border-color: var(--yellow);
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(3) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--yellow) 70%, black) 0%,
            color-mix(in srgb, var(--yellow) 70%, black) 100%
          );
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(4) {
        border-color: var(--apple-green);
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(4) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--apple-green) 70%, black) 0%,
            color-mix(in srgb, var(--apple-green) 70%, black) 100%
          );
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(5) {
        border-color: var(--pink);
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(5) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--pink) 70%, black) 0%,
            color-mix(in srgb, var(--pink) 70%, black) 100%
          );
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(6) {
        border-color: var(--orange);
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(6) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--orange) 70%, black) 0%,
            color-mix(in srgb, var(--orange) 70%, black) 100%
          );
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(7) {
        border-color: var(--zenith-blue);
      }
      :host([mode="portfolio"]) .view-area:nth-of-type(7) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--zenith-blue) 70%, black) 0%,
            color-mix(in srgb, var(--zenith-blue) 70%, black) 100%
          );
      }

      :host([mode="company"]) .view-area:nth-of-type(1) {
        border-color: var(--tuned-red);
      }
      :host([mode="company"]) .view-area:nth-of-type(1) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--tuned-red) 70%, black) 0%,
            color-mix(in srgb, var(--tuned-red) 70%, black) 100%
          );
      }
      :host([mode="company"]) .view-area:nth-of-type(2) {
        border-color: var(--sharp-blue);
      }
      :host([mode="company"]) .view-area:nth-of-type(2) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 0%,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 100%
          );
      }
      :host([mode="company"]) .view-area:nth-of-type(3) {
        border-color: var(--yellow);
      }
      :host([mode="company"]) .view-area:nth-of-type(3) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--yellow) 70%, black) 0%,
            color-mix(in srgb, var(--yellow) 70%, black) 100%
          );
      }

      :host([mode="app"]) .view-area:nth-of-type(1) {
        background-color: color-mix(in srgb, var(--tuned-red) 25%, transparent);
      }
      :host([mode="app"]) .view-area:nth-of-type(1) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--tuned-red) 70%, black) 0%,
            color-mix(in srgb, var(--tuned-red) 70%, black) 100%
          );
      }
      :host([mode="app"]) .view-area:nth-of-type(2) {
        background-color: color-mix(
          in srgb,
          var(--sharp-blue) 25%,
          transparent
        );
      }
      :host([mode="app"]) .view-area:nth-of-type(2) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 0%,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 100%
          );
      }
      :host([mode="app"]) .view-area:nth-of-type(3) {
        background-color: color-mix(in srgb, var(--yellow) 25%, transparent);
      }
      :host([mode="app"]) .view-area:nth-of-type(3) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--yellow) 70%, black) 0%,
            color-mix(in srgb, var(--yellow) 70%, black) 100%
          );
      }
      :host([mode="app"]) .view-area:nth-of-type(4) {
        background-color: color-mix(
          in srgb,
          var(--apple-green) 25%,
          transparent
        );
      }
      :host([mode="app"]) .view-area:nth-of-type(4) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--apple-green) 70%, black) 0%,
            color-mix(in srgb, var(--apple-green) 70%, black) 100%
          );
      }
      :host([mode="app"]) .view-area:nth-of-type(5) {
        background-color: color-mix(in srgb, var(--pink) 25%, transparent);
      }
      :host([mode="app"]) .view-area:nth-of-type(5) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--pink) 70%, black) 0%,
            color-mix(in srgb, var(--pink) 70%, black) 100%
          );
      }

      :host([mode="list"]) .view-area:nth-of-type(1) {
        background-color: color-mix(in srgb, var(--tuned-red) 25%, transparent);
      }
      :host([mode="list"]) .view-area:nth-of-type(1) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--tuned-red) 70%, black) 0%,
            color-mix(in srgb, var(--tuned-red) 70%, black) 100%
          );
      }
      :host([mode="list"]) .view-area:nth-of-type(2) {
        background-color: color-mix(
          in srgb,
          var(--sharp-blue) 25%,
          transparent
        );
      }
      :host([mode="list"]) .view-area:nth-of-type(2) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 0%,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 100%
          );
      }
      :host([mode="list"]) .view-area:nth-of-type(3) {
        background-color: color-mix(in srgb, var(--yellow) 25%, transparent);
      }
      :host([mode="list"]) .view-area:nth-of-type(3) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--yellow) 70%, black) 0%,
            color-mix(in srgb, var(--yellow) 70%, black) 100%
          );
      }
      :host([mode="list"]) .view-area:nth-of-type(4) {
        background-color: color-mix(
          in srgb,
          var(--apple-green) 25%,
          transparent
        );
      }
      :host([mode="list"]) .view-area:nth-of-type(4) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--apple-green) 70%, black) 0%,
            color-mix(in srgb, var(--apple-green) 70%, black) 100%
          );
      }

      :host([mode="home"]) .view-area:nth-of-type(1) {
        background-color: color-mix(in srgb, var(--tuned-red) 25%, transparent);
      }
      :host([mode="home"]) .view-area:nth-of-type(1) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--tuned-red) 70%, black) 0%,
            color-mix(in srgb, var(--tuned-red) 70%, black) 100%
          );
      }
      :host([mode="home"]) .view-area:nth-of-type(2) {
        background-color: color-mix(
          in srgb,
          var(--sharp-blue) 25%,
          transparent
        );
      }
      :host([mode="home"]) .view-area:nth-of-type(2) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 0%,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 100%
          );
      }
      :host([mode="home"]) .view-area:nth-of-type(3) {
        background-color: color-mix(in srgb, var(--yellow) 25%, transparent);
      }
      :host([mode="home"]) .view-area:nth-of-type(3) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--yellow) 70%, black) 0%,
            color-mix(in srgb, var(--yellow) 70%, black) 100%
          );
      }
      :host([mode="home"]) .view-area:nth-of-type(4) {
        background-color: color-mix(
          in srgb,
          var(--apple-green) 25%,
          transparent
        );
      }
      :host([mode="home"]) .view-area:nth-of-type(4) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--apple-green) 70%, black) 0%,
            color-mix(in srgb, var(--apple-green) 70%, black) 100%
          );
      }
      :host([mode="home"]) .view-area:nth-of-type(5) {
        background-color: color-mix(in srgb, var(--pink) 25%, transparent);
      }
      :host([mode="home"]) .view-area:nth-of-type(5) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--pink) 70%, black) 0%,
            color-mix(in srgb, var(--pink) 70%, black) 100%
          );
      }

      .view-square {
        grid-area: square;
      }

      .view-title {
        grid-area: title;
      }

      .view-header {
        grid-area: header;
      }

      .view-projects {
        grid-area: projects;
      }

      .view-bio {
        grid-area: bio;
      }

      .view-nav {
        grid-area: nav;
      }

      .view-footer {
        grid-area: footer;
      }

      .view-content {
        grid-area: content;
      }

      .view-banner {
        grid-area: banner;
      }

      .view-main {
        grid-area: main;
      }

      .view-page-dots {
        grid-area: page-dots;
      }

      .view-board {
        grid-area: board;
      }

      .view-message {
        grid-area: message;
      }

      .view-lists {
        grid-area: lists;
      }

      .view-settings {
        grid-area: settings;
      }

      :host([mode="settings"]) .view-area:nth-of-type(1) {
        background-color: color-mix(in srgb, var(--tuned-red) 25%, transparent);
      }
      :host([mode="settings"]) .view-area:nth-of-type(1) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--tuned-red) 70%, black) 0%,
            color-mix(in srgb, var(--tuned-red) 70%, black) 100%
          );
      }
      :host([mode="settings"]) .view-area:nth-of-type(2) {
        background-color: color-mix(
          in srgb,
          var(--sharp-blue) 25%,
          transparent
        );
      }
      :host([mode="settings"]) .view-area:nth-of-type(2) .grid-area-label {
        background-image:
          linear-gradient(
            90deg,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(0, 0, 0, 0.2) 100%
          ),
          linear-gradient(
            90deg,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 0%,
            color-mix(in srgb, var(--sharp-blue) 70%, black) 100%
          );
      }
    `,
  ];

  render() {
    const isView = this.view || this.mode === "view";
    const isPortfolio = this.mode === "portfolio";
    const isCompany = this.mode === "company";
    const isApp = this.mode === "app";
    const isList = this.mode === "list";
    const isHome = this.mode === "home";
    const isSettings = this.mode === "settings";

    return html`
      <slot></slot>
      ${isView
        ? html`
            <div class="view-overlay">
              ${isSettings
                ? html`
                    <div class="view-area view-banner">
                      <div class="grid-area-label">
                        <ds-text text="banner"></ds-text>
                      </div>
                    </div>
                    <div class="view-area view-settings">
                      <div class="grid-area-label">
                        <ds-text text="settings"></ds-text>
                      </div>
                    </div>
                  `
                : isHome
                  ? html`
                      <div class="view-area view-banner">
                        <div class="grid-area-label">
                          <ds-text text="banner"></ds-text>
                        </div>
                      </div>
                      <div class="view-area view-header">
                        <div class="grid-area-label">
                          <ds-text text="header"></ds-text>
                        </div>
                      </div>
                      <div class="view-area view-message">
                        <div class="grid-area-label">
                          <ds-text text="message"></ds-text>
                        </div>
                      </div>
                      <div class="view-area view-lists">
                        <div class="grid-area-label">
                          <ds-text text="lists"></ds-text>
                        </div>
                      </div>
                      <div class="view-area view-footer">
                        <div class="grid-area-label">
                          <ds-text text="footer"></ds-text>
                        </div>
                      </div>
                    `
                  : isList
                    ? html`
                        <div class="view-area view-banner">
                          <div class="grid-area-label">
                            <ds-text text="banner"></ds-text>
                          </div>
                        </div>
                        <div class="view-area view-header">
                          <div class="grid-area-label">
                            <ds-text text="header"></ds-text>
                          </div>
                        </div>
                        <div class="view-area view-board">
                          <div class="grid-area-label">
                            <ds-text text="board"></ds-text>
                          </div>
                        </div>
                      `
                    : isApp
                      ? html`
                          <div class="view-area view-banner">
                            <div class="grid-area-label">
                              <ds-text text="banner"></ds-text>
                            </div>
                          </div>
                          <div class="view-area view-header">
                            <div class="grid-area-label">
                              <ds-text text="header"></ds-text>
                            </div>
                          </div>
                          <div class="view-area view-main">
                            <div class="grid-area-label">
                              <ds-text text="main"></ds-text>
                            </div>
                          </div>
                          <div class="view-area view-page-dots">
                            <div class="grid-area-label">
                              <ds-text text="page-dots"></ds-text>
                            </div>
                          </div>
                          <div class="view-area view-footer">
                            <div class="grid-area-label">
                              <ds-text text="footer"></ds-text>
                            </div>
                          </div>
                        `
                      : isCompany
                        ? html`
                            <div class="view-area view-header">
                              <div class="grid-area-label">
                                <ds-text text="header"></ds-text>
                              </div>
                            </div>
                            <div class="view-area view-content">
                              <div class="grid-area-label">
                                <ds-text text="content"></ds-text>
                              </div>
                            </div>
                            <div class="view-area view-footer">
                              <div class="grid-area-label">
                                <ds-text text="footer"></ds-text>
                              </div>
                            </div>
                          `
                        : isPortfolio
                          ? html`
                              <div class="view-area view-square">
                                <div class="grid-area-label">
                                  <ds-text text="square"></ds-text>
                                </div>
                              </div>
                              <div class="view-area view-title">
                                <div class="grid-area-label">
                                  <ds-text text="title"></ds-text>
                                </div>
                              </div>
                              <div class="view-area view-header">
                                <div class="grid-area-label">
                                  <ds-text text="header"></ds-text>
                                </div>
                              </div>
                              <div class="view-area view-projects">
                                <div class="grid-area-label">
                                  <ds-text text="projects"></ds-text>
                                </div>
                              </div>
                              <div class="view-area view-bio">
                                <div class="grid-area-label">
                                  <ds-text text="bio"></ds-text>
                                </div>
                              </div>
                              <div class="view-area view-nav">
                                <div class="grid-area-label">
                                  <ds-text text="nav"></ds-text>
                                </div>
                              </div>
                              <div class="view-area view-footer">
                                <div class="grid-area-label">
                                  <ds-text text="footer"></ds-text>
                                </div>
                              </div>
                            `
                          : ""}
            </div>
          `
        : ""}
    `;
  }
}

customElements.define("ds-layout", Layout);

declare global {
  interface HTMLElementTagNameMap {
    "ds-layout": Layout;
  }
}
