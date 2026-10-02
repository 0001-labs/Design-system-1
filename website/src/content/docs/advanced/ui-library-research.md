---
title: "UI Library Research"
description: "Research findings from analyzing Radix UI, Base UI, and Shadcn"
---

# UI Library Research: Radix UI, Base UI & Shadcn

This document summarizes research findings from analyzing three major UI component libraries that could inform improvements to Design system 1. Each library offers different patterns and approaches that may be valuable for enhancing our design system.

---

## Overview Comparison

| Library                                            | GitHub Stars | Approach                                 | Framework        |
| -------------------------------------------------- | ------------ | ---------------------------------------- | ---------------- |
| [Radix UI](https://github.com/radix-ui/primitives) | 18,304       | Unstyled primitives                      | React            |
| [Base UI](https://github.com/mui/base-ui)          | 7,074        | Unstyled primitives (hooks + components) | React            |
| [Shadcn UI](https://github.com/shadcn-ui/ui)       | 102,801      | Styled components (copy-paste)           | React + Tailwind |

---

## 1. Radix UI Primitives

**Repository:** https://github.com/radix-ui/primitives

**Description:** Low-level UI component library with a focus on accessibility, customization, and developer experience. Maintained by WorkOS.

### Architecture Patterns

#### Compound Components

Radix uses a compound component pattern where complex components are composed of smaller, individually accessible parts:

```tsx
// Radix compound component pattern
<Accordion type="single">
  <Accordion.Item value="item-1">
    <Accordion.Trigger>Title</Accordion.Trigger>
    <Accordion.Content>Content</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

#### Context-Based State Management

Uses React Context with scoped providers for sharing state between compound components:

```tsx
const [createAccordionContext, createAccordionScope] = createContextScope(
  ACCORDION_NAME,
  [createCollectionScope, createCollapsibleScope]
);
```

#### Key Utilities

- **`createContextScope`** - Scoped context providers for component composition
- **`useControllableState`** - Controlled/uncontrolled state management
- **`composeEventHandlers`** - Event handler composition
- **`useComposedRefs`** - Ref forwarding and composition
- **`Primitive`** - Base element wrapper with `asChild` support for component polymorphism

#### Component List (45+ primitives)

- **Overlays:** Dialog, AlertDialog, Popover, Tooltip, HoverCard, ContextMenu, DropdownMenu
- **Navigation:** NavigationMenu, Menubar, Tabs
- **Form Controls:** Checkbox, RadioGroup, Select, Slider, Switch, Toggle, Form
- **Display:** Accordion, Collapsible, Avatar, Progress, Separator, ScrollArea
- **Utilities:** Portal, Presence, VisuallyHidden, FocusScope, DismissableLayer

### Patterns Applicable to Design system 1

1. **`asChild` Pattern for Polymorphism**
   - Allows rendering a component as a different element or another component
   - Could solve the issue of `ds-button` needing to work as links or other elements

2. **Controllable State Hook**
   - Unified pattern for controlled/uncontrolled components
   - Applicable to `ds-accordion`, `ds-input`, and future form components

3. **Collection Management**
   - Radix tracks items in collections for keyboard navigation
   - Useful for `ds-list`, `ds-table` accessibility

4. **Focus Management**
   - `FocusScope` for trapping focus in modals/dialogs
   - `RovingFocus` for arrow key navigation in lists/menus

---

## 2. Base UI

**Repository:** https://github.com/mui/base-ui

**Description:** Unstyled UI components from the creators of Radix, Floating UI, and Material UI. Focuses on accessibility with zero styling.

### Architecture Patterns

#### Hooks + Components Pattern

Base UI offers both headless hooks and unstyled components:

```tsx
// Hook approach for maximum flexibility
import { useButton } from "@base-ui/react/button";

const { getButtonProps, buttonRef } = useButton({
  disabled,
  focusableWhenDisabled,
  native: true,
});

// Component approach for convenience
import { Button } from "@base-ui/react/button";

<Button disabled focusableWhenDisabled>
  Click
</Button>;
```

#### Part-Based Component Structure

Components are split into semantic parts in separate files:

```
/dialog/
  ├── backdrop/
  ├── close/
  ├── description/
  ├── popup/
  ├── portal/
  ├── root/
  ├── title/
  ├── trigger/
  └── viewport/
```

#### Key Utilities

- **`useRenderElement`** - Unified render logic with state/ref/props merging
- **`mergeProps`** - Prop merging with event handler composition
- **`useControlled`** - Controlled/uncontrolled state (from MUI)
- **`useStableCallback`** - Stable callback references
- **`useIsoLayoutEffect`** - SSR-safe useLayoutEffect

#### Component List (35+ components)

- **Core:** Button, Checkbox, Field, Fieldset, Form, Input, Label, Switch
- **Selection:** ComboBox, Menu, Select, Radio, Tabs, Autocomplete
- **Display:** Accordion, Avatar, Collapsible, Meter, Progress, Separator
- **Overlays:** Dialog, AlertDialog, Popover, Tooltip, Toast, PreviewCard
- **Navigation:** NavigationMenu, Menubar
- **Layout:** Slider, ScrollArea

### Patterns Applicable to Design system 1

1. **Headless Hook Pattern**
   - Expose `useButton`, `useAccordion`, etc. hooks for custom implementations
   - Users can build their own styled components using Design system 1 logic

2. **`render` Prop Pattern**
   - Base UI uses `render` prop for element customization
   - Alternative to Radix's `asChild` pattern

3. **`focusableWhenDisabled`**
   - Accessibility feature allowing focus on disabled elements
   - Important for form error states and screen readers

4. **Stable Callbacks**
   - `useStableCallback` prevents unnecessary re-renders
   - Important for optimizing Lit component updates

5. **Direction Provider**
   - RTL/LTR support at the provider level
   - Could enhance Design system 1's i18n capabilities

---

## 3. Shadcn UI

**Repository:** https://github.com/shadcn-ui/ui

**Description:** A collection of beautifully-designed, accessible components that you copy into your project. Not a traditional npm package.

### Architecture Patterns

#### Copy-Paste Distribution

Components are meant to be copied into your codebase, not installed as dependencies:

```bash
npx shadcn@latest add button
```

#### Built on Primitives

Shadcn wraps Radix (previously) and Base UI (v4) primitives with styling:

```tsx
// Shadcn button - thin wrapper with variants
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "cn-button inline-flex items-center justify-center...",
  {
    variants: {
      variant: {
        default: "cn-button-variant-default",
        outline: "cn-button-variant-outline",
        destructive: "cn-button-variant-destructive",
        ghost: "cn-button-variant-ghost",
        link: "cn-button-variant-link",
      },
      size: {
        default: "cn-button-size-default",
        sm: "cn-button-size-sm",
        lg: "cn-button-size-lg",
        icon: "cn-button-size-icon",
      },
    },
  }
);
```

#### CSS Class Naming Convention

Uses semantic `data-slot` attributes and class prefixes (`cn-*`) for styling hooks:

```tsx
<DialogPrimitive.Popup
  data-slot="dialog-content"
  className={cn("cn-dialog-content fixed top-1/2 left-1/2 z-50...")}
/>
```

#### Component List (50+ components)

- **Core:** Button, Input, Label, Textarea, Select, Checkbox, Radio, Switch, Slider
- **Display:** Accordion, Alert, Avatar, Badge, Card, Carousel, Progress, Skeleton, Table
- **Overlays:** Dialog, Drawer, Sheet, AlertDialog, Popover, Tooltip, HoverCard
- **Navigation:** Breadcrumb, Command, ContextMenu, DropdownMenu, Menubar, NavigationMenu, Pagination, Sidebar, Tabs
- **Specialized:** Calendar, Chart, Combobox, DataTable, Resizable, Sonner (toasts), InputOTP

### Patterns Applicable to Design system 1

1. **Variant System with CVA**
   - Class Variance Authority for type-safe variant props
   - Could inform a more structured variant system for Design system 1

2. **`data-slot` Attributes**
   - Semantic slot identification for styling hooks
   - Useful for external CSS targeting without breaking encapsulation

3. **Component Composition**
   - Shadcn's `DialogContent` composes multiple Base UI parts
   - Shows how to create higher-level components from primitives

4. **CLI-Based Component Management**
   - Interesting distribution model for enterprise design systems
   - Users get source code ownership with update capabilities

---

## Recommendations for Design system 1

### High Priority

#### 1. Add Controllable State Pattern

Implement a unified pattern for controlled/uncontrolled components across all interactive elements.

```typescript
// Proposed utility for Design system 1 (Lit version)
function useControllableState<T>(options: {
  value?: T;
  defaultValue: T;
  onChange?: (value: T) => void;
}) {
  // Implementation for Lit reactive controllers
}
```

#### 2. Implement Compound Component Pattern for Complex Components

Refactor `ds-accordion` to use a compound pattern:

```html
<!-- Current -->
<ds-accordion summary="Title" details="Content"></ds-accordion>

<!-- Proposed -->
<ds-accordion type="single">
  <ds-accordion-item value="1">
    <ds-accordion-trigger>Title</ds-accordion-trigger>
    <ds-accordion-content>Content</ds-accordion-content>
  </ds-accordion-item>
</ds-accordion>
```

#### 3. Add Missing Core Components

Based on common patterns across all three libraries:

| Component        | Priority | Rationale                                |
| ---------------- | -------- | ---------------------------------------- |
| `ds-dialog`      | High     | Modal/dialog pattern is universal        |
| `ds-select`      | High     | Form selection component                 |
| `ds-popover`     | High     | Positioning primitive for menus/tooltips |
| `ds-checkbox`    | Medium   | Form control                             |
| `ds-radio-group` | Medium   | Form control                             |
| `ds-switch`      | Medium   | Toggle alternative                       |
| `ds-slider`      | Medium   | Range input                              |
| `ds-tabs`        | Medium   | Content organization                     |
| `ds-progress`    | Low      | Loading states                           |
| `ds-separator`   | Low      | Visual divider                           |

### Medium Priority

#### 4. Add `slot` Attribute Support for Polymorphism

Allow components to render as different elements similar to Radix's `asChild`:

```html
<!-- Current: ds-button can only be a button -->
<ds-button href="/link">Link Button</ds-button>

<!-- Proposed: slot-based polymorphism -->
<ds-button>
  <a slot="root" href="/link">Link Button</a>
</ds-button>
```

#### 5. Create Headless Hooks (Lit Reactive Controllers)

Expose component logic as reactive controllers for custom implementations:

```typescript
// Proposed pattern
class AccordionController implements ReactiveController {
  constructor(host: ReactiveControllerHost, options: AccordionOptions) {
    // Implementation
  }

  get isOpen(): boolean {}
  toggle(): void {}
  getItemProps(value: string): object {}
}
```

#### 6. Enhance Focus Management

Add utilities for:

- Focus trapping (for modals)
- Roving tabindex (for lists/toolbars)
- Focus restoration

### Low Priority

#### 7. Add `data-slot` Attributes

Enable external styling without deep CSS selectors:

```html
<ds-button>
  <!-- Internal structure -->
  <button data-slot="button">
    <span data-slot="content"><slot></slot></span>
  </button>
</ds-button>
```

#### 8. Add Direction Provider

Enhance i18n with RTL support:

```typescript
// Add to theme system
export const direction = signal<"ltr" | "rtl">("ltr");

export function setDirection(dir: "ltr" | "rtl"): void {
  direction.set(dir);
  document.documentElement.dir = dir;
}
```

---

## Implementation Considerations

### Web Components vs React

All three researched libraries are React-based. When adapting patterns to Design system 1's Lit-based web components:

1. **Context → Events + Slots**
   - React Context becomes custom events and slot composition
   - Consider using Lit's Context protocol for shared state

2. **Hooks → Reactive Controllers**
   - React hooks translate to Lit reactive controllers
   - Controllers provide reusable behavior logic

3. **`asChild` → Slotted Polymorphism**
   - Web Components use slots for composition
   - Consider a `slot="root"` pattern for polymorphism

4. **Controlled/Uncontrolled → Property Reflection**
   - Lit's property system naturally supports both patterns
   - Use `@property` with custom setters for controlled behavior

### Browser Compatibility

Base UI and Radix use Floating UI for positioning. Consider:

- Adopting Floating UI for `ds-tooltip`, `ds-popover`
- Native CSS `anchor()` (when widely supported)
- CSS `position: absolute` with JS positioning fallback

---

## Resources

- [Radix UI Documentation](https://radix-ui.com/primitives)
- [Base UI Documentation](https://base-ui.com)
- [Shadcn UI Documentation](https://ui.shadcn.com)
- [Floating UI](https://floating-ui.com) - Positioning library used by Base UI
- [Class Variance Authority](https://cva.style/docs) - Variant management
- [Lit Reactive Controllers](https://lit.dev/docs/composition/controllers/) - Reusable behavior pattern
