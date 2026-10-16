---
title: Page
description: Layout structures that arrange units into a complete screen.
---

Page is the composition layer for the whole screen. It establishes regions, containment and alignment so content and controls share the same grid. It does not decide an application’s data model or access rules.

## Choose a layout structure

| Topic | Responsibility |
| --- | --- |
| [Container](/4-page/container/) | Bound and align a region of content. |
| [Grid](/4-page/grid/) | Place content using shared units and columns. |
| [Layout](/4-page/layout/) | Combine regions into an overall page structure. |

A page can contain navigation, a working area and supporting content. Give each region a clear purpose, and let its contents determine which [Units](/3-unit/overview/) and [Core components](/2-core/overview/) belong there.

## Follow the foundation

Use [Root’s](/1-root/overview/) scale, spacing, type and theme. Reflow regions for narrower screens without inventing another control scale or losing keyboard access. A layout should preserve the controls’ native behavior, accessible names and reading order.

## Keep application behavior outside the layout

The application owns routing, loading, permissions and persistence. A Page composition arranges what may be shown; it does not authorize access. Public documentation, authenticated libraries and private workspaces can share components while keeping their data and routes separate.
