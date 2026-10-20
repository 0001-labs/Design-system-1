/**
 * Design system 1 - Main entry point for all components
 *
 * This module initializes core utilities and exports all design system components
 * organized by layer: 0-face (foundation), 2-core (components), 3-unit (composites), 4-page (layouts)
 */

// ============================================================================
// Initialization (side-effect imports)
// ============================================================================

// Initialize device detection (will auto-detect and log on load)
import "./0-face/device";

// Initialize language utilities (will auto-load external translations if available)
import "./0-face/i18n";

// ============================================================================
// 0-face: Foundation & Utilities
// ============================================================================

export * from "./0-face/device";
export * from "./0-face/grid";
export * from "./0-face/tooltips";
export * from "./0-face/i18n";
export * from "./0-face/languages";
export * from "./0-face/language-routing";
export * from "./0-face/translations-format";
export * from "./0-face/format";
export * from "./0-face/preferences";
export * from "./0-face/pricing";
export * from "./0-face/theme";
export * from "./0-face/keys";
export * from "./0-face/sidebar";

// ============================================================================
// 2-core: Core Components
// ============================================================================

export * from "./2-core/ds-badge";
export * from "./2-core/ds-tag";
export * from "./2-core/ds-button";
export * from "./2-core/ds-checkbox";
export * from "./2-core/ds-radio";
export * from "./2-core/ds-switch";
export * from "./3-unit/ds-select";
export * from "./2-core/ds-color";
export * from "./2-core/ds-swatch";
export * from "./2-core/ds-card";
export * from "./2-core/ds-cycle";
export * from "./2-core/ds-empty";
export * from "./2-core/ds-gap";
export * from "./2-core/ds-icon";
export * from "./2-core/ds-input";
export * from "./2-core/ds-file-picker";
export * from "./2-core/ds-composer";
export * from "./2-core/ds-message";
export * from "./2-core/ds-notice";
export * from "./2-core/ds-stat";
export * from "./2-core/ds-progress";
export * from "./2-core/ds-text";
export * from "./2-core/ds-toast";
export * from "./2-core/ds-tooltip";

// ============================================================================
// 3-unit: Composite Components
// ============================================================================

export * from "./3-unit/ds-accordion";
export * from "./2-core/ds-avatar";
export * from "./3-unit/ds-avatar-group";
export * from "./3-unit/ds-calendar";
export * from "./3-unit/ds-calendar-large";
export * from "./3-unit/ds-bento";
export * from "./3-unit/ds-carousel";
export * from "./3-unit/ds-form";
export * from "./3-unit/ds-list";
export * from "./3-unit/ds-matrix";
export * from "./3-unit/ds-row";
export * from "./3-unit/ds-table";
export * from "./3-unit/ds-table-of-contents";

// ============================================================================
// 4-page: Layout Components
// ============================================================================

export * from "./4-page/ds-container";
export * from "./4-page/ds-grid";
export * from "./4-page/ds-page";
export * from "./4-page/ds-header";
export * from "./4-page/ds-footer";
export * from "./4-page/ds-document";

export * from "./3-unit/ds-menu";
export * from "./3-unit/ds-context";
export * from "./3-unit/ds-tabs";
export * from "./4-page/ds-panel";
export * from "./4-page/ds-overlay";

export * from "./2-core/ds-token";
export * from "./3-unit/ds-token-field";

export * from "./3-unit/ds-sidebar";

export * from "./2-core/ds-chart";

export * from "./0-face/component-visibility";

export * from "./2-core/ds-image";
