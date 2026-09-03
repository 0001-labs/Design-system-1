import {
  createElement,
  Fragment,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import semanticCssTemplate from "../../DS1/1-root/one.semantic.css?raw";
import { readCustomProperty, replaceCustomProperty } from "./lib/cssText";

type ComponentKind =
  | "a"
  | "blockquote"
  | "button"
  | "code"
  | "details"
  | "headings"
  | "hr"
  | "input"
  | "p"
  | "progress"
  | "section"
  | "select"
  | "table"
  | "textarea";
type CopyLength = "short" | "default" | "long";
type ButtonFamily = "button" | "button-danger" | "icon-button" | "button-group";

const BUTTON_MATRIX_SIZES = [
  { label: "Medium", small: false },
  { label: "Small", small: true },
] as const;

const BUTTON_MATRIX_GROUPS = [
  {
    key: "standard",
    label: "Button",
    variants: [
      { label: "Primary", value: undefined },
      { label: "Neutral", value: "neutral" },
      { label: "Subtle", value: "subtle" },
    ],
  },
  {
    key: "danger",
    label: "Button",
    variants: [
      { label: "Danger", value: "danger" },
      { label: "Danger / Subtle", value: "danger-subtle" },
    ],
  },
] as const;

const BUTTON_MATRIX_STATES = [
  { label: "Default", value: "default" },
  { label: "Hover", value: "hover" },
  { label: "Disabled", value: "disabled" },
] as const;

const ICON_BUTTON_VARIANTS = [
  { label: "Primary", value: undefined },
  { label: "Neutral", value: "neutral" },
  { label: "Subtle", value: "subtle" },
] as const;

const INPUT_FIELD_STATES = [
  { label: "Default", value: "default" },
  { label: "Disabled", value: "disabled" },
  { label: "Error", value: "error" },
] as const;

const INPUT_FIELD_VALUE_TYPES = [
  { label: "Value", placeholder: false },
  { label: "Placeholder", placeholder: true },
] as const;

const BUTTON_FAMILIES: Array<{
  key: ButtonFamily;
  label: string;
  semantic: string;
}> = [
  { key: "button", label: "Button", semantic: "<button>" },
  {
    key: "button-danger",
    label: "Button Danger",
    semantic: '<button variant="danger">',
  },
  {
    key: "icon-button",
    label: "Icon Button",
    semantic: '<button aria-label="…">',
  },
  {
    key: "button-group",
    label: "Button Group",
    semantic: "<fieldset>",
  },
];

type ComponentConfig = {
  copyLength: CopyLength;
  text: string;
  detail: string;
  placeholder: string;
  paddingX: number;
  paddingY: number;
  gap: number;
  radius: number;
  borderTop?: number;
  borderRight?: number;
  borderBottom?: number;
  borderLeft?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
};

const BORDER_FIELDS = {
  top: "borderTop",
  right: "borderRight",
  bottom: "borderBottom",
  left: "borderLeft",
} as const;

type BorderField = (typeof BORDER_FIELDS)[keyof typeof BORDER_FIELDS];

const BORDER_FIELD_LIST: BorderField[] = [
  "borderTop",
  "borderRight",
  "borderBottom",
  "borderLeft",
];

const MARGIN_FIELDS = {
  top: "marginTop",
  right: "marginRight",
  bottom: "marginBottom",
  left: "marginLeft",
} as const;

type MarginField = (typeof MARGIN_FIELDS)[keyof typeof MARGIN_FIELDS];

const MARGIN_FIELD_LIST: MarginField[] = [
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
];

type ConfigByKind = Record<ComponentKind, ComponentConfig>;

const componentLibrary: Array<{
  copy?: boolean;
  kind: ComponentKind;
  label: string;
  semantic: string;
}> = [
  {
    kind: "a",
    label: "Link",
    semantic: "<a>",
  },
  {
    kind: "blockquote",
    label: "Blockquote",
    semantic: "<blockquote>",
  },
  {
    kind: "button",
    label: "Buttons",
    semantic: "<button>",
  },
  {
    kind: "code",
    label: "Code",
    semantic: "<code>",
  },
  {
    kind: "details",
    label: "Details",
    semantic: "<details>",
  },
  {
    kind: "headings",
    label: "Headings",
    semantic: "<h1> – <h6>",
  },
  {
    copy: false,
    kind: "hr",
    label: "Divider",
    semantic: "<hr>",
  },
  {
    kind: "input",
    label: "Inputs",
    semantic: "<input>",
  },
  {
    kind: "p",
    label: "Paragraph",
    semantic: "<p>",
  },
  {
    copy: false,
    kind: "progress",
    label: "Progress",
    semantic: "<progress>",
  },
  {
    kind: "section",
    label: "Section",
    semantic: "<section>",
  },
  {
    kind: "select",
    label: "Select",
    semantic: "<select>",
  },
  {
    kind: "table",
    label: "Table",
    semantic: "<table>",
  },
  {
    kind: "textarea",
    label: "Text area",
    semantic: "<textarea>",
  },
];

const copyExamples: Record<
  ComponentKind,
  Record<CopyLength, Pick<ComponentConfig, "text" | "detail" | "placeholder">>
> = {
  a: {
    short: {
      text: "Learn more",
      detail: "",
      placeholder: "",
    },
    default: {
      text: "Read the documentation",
      detail: "",
      placeholder: "",
    },
    long: {
      text: "Explore the complete design system",
      detail: "",
      placeholder: "",
    },
  },
  blockquote: {
    short: {
      text: "Make it clear.",
      detail: "",
      placeholder: "",
    },
    default: {
      text: "Good design makes the right action feel obvious.",
      detail: "",
      placeholder: "",
    },
    long: {
      text: "A design system earns trust when every element behaves consistently and the content remains easy to understand.",
      detail: "",
      placeholder: "",
    },
  },
  button: {
    short: {
      text: "Save",
      detail: "",
      placeholder: "",
    },
    default: {
      text: "Get started",
      detail: "",
      placeholder: "",
    },
    long: {
      text: "Create your account",
      detail: "",
      placeholder: "",
    },
  },
  code: {
    short: {
      text: "npm i ds-one",
      detail: "",
      placeholder: "",
    },
    default: {
      text: "<button>Get started</button>",
      detail: "",
      placeholder: "",
    },
    long: {
      text: '<link rel="stylesheet" href="one.semantic.css">',
      detail: "",
      placeholder: "",
    },
  },
  details: {
    short: {
      text: "What is this?",
      detail: "A CSS-only primitive.",
      placeholder: "",
    },
    default: {
      text: "How does it work?",
      detail:
        "Use native HTML and let the stylesheet provide consistent visual defaults.",
      placeholder: "",
    },
    long: {
      text: "How does the classless framework work?",
      detail:
        "Write accessible semantic HTML, include the stylesheet, and refine the shared tokens without adding a component runtime.",
      placeholder: "",
    },
  },
  headings: {
    short: {
      text: "Title",
      detail: "",
      placeholder: "",
    },
    default: {
      text: "Heading",
      detail: "",
      placeholder: "",
    },
    long: {
      text: "A clear heading",
      detail: "",
      placeholder: "",
    },
  },
  p: {
    short: {
      text: "Design with clarity.",
      detail: "",
      placeholder: "",
    },
    default: {
      text: "A clear design system helps teams build consistent interfaces.",
      detail: "",
      placeholder: "",
    },
    long: {
      text: "A clear design system helps teams build consistent interfaces while keeping typography, spacing, color, and interaction decisions easy to understand.",
      detail: "",
      placeholder: "",
    },
  },
  hr: {
    short: { text: "", detail: "", placeholder: "" },
    default: { text: "", detail: "", placeholder: "" },
    long: { text: "", detail: "", placeholder: "" },
  },
  input: {
    short: {
      text: "Email",
      detail: "",
      placeholder: "name@example.com",
    },
    default: {
      text: "Email address",
      detail: "",
      placeholder: "you@example.com",
    },
    long: {
      text: "Your preferred contact email",
      detail: "",
      placeholder: "your.name@example.com",
    },
  },
  section: {
    short: {
      text: "WWF History",
      detail: "WWF was founded in 1961.",
      placeholder: "",
    },
    default: {
      text: "WWF History",
      detail:
        "The World Wide Fund for Nature (WWF) is an international organization working on issues regarding the conservation, research and restoration of the environment, formerly named the World Wildlife Fund. WWF was founded in 1961.",
      placeholder: "",
    },
    long: {
      text: "WWF History",
      detail:
        "The World Wide Fund for Nature (WWF) is an international organization working on issues regarding the conservation, research and restoration of the environment, formerly named the World Wildlife Fund. WWF was founded in 1961. Its work connects local action with global conservation goals.",
      placeholder: "",
    },
  },
  progress: {
    short: { text: "", detail: "", placeholder: "" },
    default: { text: "", detail: "", placeholder: "" },
    long: { text: "", detail: "", placeholder: "" },
  },
  select: {
    short: {
      text: "Theme",
      detail: "",
      placeholder: "",
    },
    default: {
      text: "Choose a theme",
      detail: "",
      placeholder: "",
    },
    long: {
      text: "Choose your preferred interface theme",
      detail: "",
      placeholder: "",
    },
  },
  table: {
    short: {
      text: "Spacing",
      detail: "8px",
      placeholder: "",
    },
    default: {
      text: "Spacing token",
      detail: "8px",
      placeholder: "",
    },
    long: {
      text: "Default spacing token",
      detail: "8px",
      placeholder: "",
    },
  },
  textarea: {
    short: {
      text: "Notes",
      detail: "",
      placeholder: "Add a note",
    },
    default: {
      text: "Project notes",
      detail: "",
      placeholder: "Add context for the team",
    },
    long: {
      text: "Project notes and implementation context",
      detail: "",
      placeholder: "Add useful context for everyone working on this project",
    },
  },
};

const initialBoxModel = {
  radius: 8,
  borderTop: 1,
  borderRight: 1,
  borderBottom: 1,
  borderLeft: 1,
  marginTop: 4,
  marginRight: 4,
  marginBottom: 4,
  marginLeft: 4,
} satisfies Partial<ComponentConfig>;

const initialConfigs: ConfigByKind = {
  a: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.a.default,
    paddingX: 0,
    paddingY: 0,
    gap: 0,
  },
  blockquote: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.blockquote.default,
    paddingX: 20,
    paddingY: 0,
    gap: 0,
  },
  button: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.button.default,
    paddingX: 12,
    paddingY: 12,
    gap: 0,
  },
  code: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.code.default,
    paddingX: 5,
    paddingY: 2,
    gap: 0,
  },
  details: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.details.default,
    paddingX: 0,
    paddingY: 12,
    gap: 0,
  },
  headings: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.headings.default,
    paddingX: 0,
    paddingY: 0,
    gap: 0,
  },
  p: {
    ...initialBoxModel,
    borderTop: 0,
    borderRight: 0,
    borderBottom: 0,
    borderLeft: 0,
    copyLength: "default",
    ...copyExamples.p.default,
    paddingX: 0,
    paddingY: 0,
    gap: 0,
  },
  hr: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.hr.default,
    paddingX: 0,
    paddingY: 0,
    gap: 0,
  },
  input: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.input.default,
    paddingX: 16,
    paddingY: 12,
    gap: 8,
  },
  section: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.section.default,
    paddingX: 24,
    paddingY: 24,
    gap: 12,
  },
  progress: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.progress.default,
    paddingX: 0,
    paddingY: 0,
    gap: 0,
  },
  select: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.select.default,
    paddingX: 12,
    paddingY: 10,
    gap: 8,
  },
  table: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.table.default,
    paddingX: 12,
    paddingY: 12,
    gap: 0,
  },
  textarea: {
    ...initialBoxModel,
    copyLength: "default",
    ...copyExamples.textarea.default,
    paddingX: 12,
    paddingY: 10,
    gap: 8,
  },
};

const SNAP_GRID = 4;
const DRAG_THRESHOLD = 3;
const CSS_EDITOR_LINE_HEIGHT = 16;
const CSS_EDITOR_CHAR_WIDTH = 6.1;
const CSS_EDITOR_PADDING = 14;
const SPACING_KEYS = ["paddingX", "paddingY", "gap"] as const;

const componentCssTargets: Record<ComponentKind, string> = {
  a: "a {",
  blockquote: "blockquote {",
  button: "  button,",
  code: ":where(code, kbd) {",
  details: "details {",
  headings: ":where(h1, h2, h3, h4, h5, h6) {",
  hr: "hr {",
  input: "  input:not(",
  p: "p + p {",
  progress: "progress {",
  section: "section {",
  select: "  select,",
  table: "table {",
  textarea: "textarea {",
};

const componentBoxSelectors: Record<ComponentKind, string> = {
  a: "a",
  blockquote: "blockquote",
  button:
    ':where(button, input[type="button"], input[type="submit"], input[type="reset"])',
  code: ":where(code, kbd)",
  details: "details",
  headings: ":where(h1, h2, h3, h4, h5, h6)",
  hr: "hr",
  input:
    'input:not([type="button"], [type="submit"], [type="reset"], [type="checkbox"], [type="radio"])',
  p: "p",
  progress: "progress",
  section: "section",
  select: "select",
  table: "table",
  textarea: "textarea",
};

const componentCssProperties: Record<
  ComponentKind,
  Partial<Record<"paddingX" | "paddingY" | "gap", string>>
> = {
  a: {
    paddingX: "--one-link-padding-inline",
    paddingY: "--one-link-padding-block",
  },
  blockquote: {
    paddingX: "--one-blockquote-padding-inline",
    paddingY: "--one-blockquote-padding-block",
  },
  button: {
    paddingX: "--one-button-padding-inline",
    paddingY: "--one-button-padding-block",
  },
  code: {
    paddingX: "--one-code-padding-inline",
    paddingY: "--one-code-padding-block",
  },
  details: {
    paddingX: "--one-details-padding-inline",
    paddingY: "--one-details-padding-block",
  },
  headings: {
    paddingX: "--one-text-padding-inline",
    paddingY: "--one-text-padding-block",
  },
  p: {
    paddingX: "--one-text-padding-inline",
    paddingY: "--one-text-padding-block",
  },
  hr: {},
  input: {
    paddingX: "--one-input-padding-inline",
    paddingY: "--one-input-padding-block",
    gap: "--one-input-gap",
  },
  section: {
    paddingX: "--one-section-padding-inline",
    paddingY: "--one-section-padding-block",
    gap: "--one-section-gap",
  },
  progress: {},
  select: {
    paddingX: "--one-input-padding-inline",
    paddingY: "--one-input-padding-block",
    gap: "--one-input-gap",
  },
  table: {
    paddingX: "--one-table-cell-padding-inline",
    paddingY: "--one-table-cell-padding-block",
  },
  textarea: {
    paddingX: "--one-input-padding-inline",
    paddingY: "--one-input-padding-block",
    gap: "--one-input-gap",
  },
};

function clampSpacing(value: number) {
  return Math.min(96, Math.max(0, value));
}

function clampBorder(value: number) {
  return Math.min(24, Math.max(0, value));
}

function snapSpacing(value: number) {
  return clampSpacing(Math.round(value / SNAP_GRID) * SNAP_GRID);
}

function borderRuleMarker(kind: ComponentKind) {
  return `/* Box model border: ${kind} */`;
}

function borderRuleRange(css: string, kind: ComponentKind) {
  const start = css.indexOf(borderRuleMarker(kind));
  if (start < 0) return null;

  const openingBrace = css.indexOf("{", start);
  const closingBrace = css.indexOf("}", openingBrace);
  if (openingBrace < 0 || closingBrace < 0) return null;

  return { end: closingBrace + 1, start };
}

function upsertBorderRule(
  css: string,
  kind: ComponentKind,
  config: ComponentConfig,
) {
  const widths = BORDER_FIELD_LIST.map((field) =>
    Math.round(clampBorder(config[field] ?? 0)),
  );
  const colorDeclaration =
    kind === "button" || kind === "input"
      ? ""
      : "\n  border-color: var(--one-border);";
  const rule = `${borderRuleMarker(kind)}
${componentBoxSelectors[kind]} {
  border-style: solid;${colorDeclaration}
  border-width: ${widths.map((value) => `${value}px`).join(" ")};
}`;
  const range = borderRuleRange(css, kind);

  if (!range) return `${css.trimEnd()}\n\n${rule}\n`;
  return `${css.slice(0, range.start)}${rule}${css.slice(range.end)}`;
}

function readBorderWidths(
  css: string,
  kind: ComponentKind,
  fallback: ComponentConfig,
) {
  const range = borderRuleRange(css, kind);
  if (!range) {
    return Object.fromEntries(
      BORDER_FIELD_LIST.map((field) => [field, fallback[field]]),
    ) as Pick<ComponentConfig, BorderField>;
  }

  const rule = css.slice(range.start, range.end);
  const values = rule
    .match(/border-width:\s*([^;]+);/)?.[1]
    ?.trim()
    .split(/\s+/)
    .map((value) => clampBorder(Number.parseFloat(value)));

  if (!values?.length || values.some((value) => !Number.isFinite(value))) {
    return Object.fromEntries(
      BORDER_FIELD_LIST.map((field) => [field, fallback[field]]),
    ) as Pick<ComponentConfig, BorderField>;
  }

  const [top, right = top, bottom = top, left = right] = values;
  return {
    borderTop: top,
    borderRight: right,
    borderBottom: bottom,
    borderLeft: left,
  };
}

function marginRuleMarker(kind: ComponentKind) {
  return `/* Box model margin: ${kind} */`;
}

function marginRuleRange(css: string, kind: ComponentKind) {
  const start = css.indexOf(marginRuleMarker(kind));
  if (start < 0) return null;

  const openingBrace = css.indexOf("{", start);
  const closingBrace = css.indexOf("}", openingBrace);
  if (openingBrace < 0 || closingBrace < 0) return null;

  return { end: closingBrace + 1, start };
}

function upsertMarginRule(
  css: string,
  kind: ComponentKind,
  config: ComponentConfig,
) {
  const margins = MARGIN_FIELD_LIST.map((field) =>
    Math.round(clampSpacing(config[field] ?? 0)),
  );
  const rule = `${marginRuleMarker(kind)}
${componentBoxSelectors[kind]} {
  margin: ${margins.map((value) => `${value}px`).join(" ")};
}`;
  const range = marginRuleRange(css, kind);

  if (!range) return `${css.trimEnd()}\n\n${rule}\n`;
  return `${css.slice(0, range.start)}${rule}${css.slice(range.end)}`;
}

function readMargins(
  css: string,
  kind: ComponentKind,
  fallback: ComponentConfig,
) {
  const range = marginRuleRange(css, kind);
  if (!range) {
    return Object.fromEntries(
      MARGIN_FIELD_LIST.map((field) => [field, fallback[field]]),
    ) as Pick<ComponentConfig, MarginField>;
  }

  const rule = css.slice(range.start, range.end);
  const values = rule
    .match(/margin:\s*([^;]+);/)?.[1]
    ?.trim()
    .split(/\s+/)
    .map((value) => clampSpacing(Number.parseFloat(value)));

  if (!values?.length || values.some((value) => !Number.isFinite(value))) {
    return Object.fromEntries(
      MARGIN_FIELD_LIST.map((field) => [field, fallback[field]]),
    ) as Pick<ComponentConfig, MarginField>;
  }

  const [top, right = top, bottom = top, left = right] = values;
  return {
    marginTop: top,
    marginRight: right,
    marginBottom: bottom,
    marginLeft: left,
  };
}

function buildSemanticCss(configs: ConfigByKind, accent: string) {
  const values: Array<[string, string]> = [
    ["--one-accent-color", accent],
    ["--one-radius", `${Math.round(configs.button.radius)}px`],
  ];
  const seenProperties = new Set<string>();

  componentLibrary.forEach(({ kind }) => {
    SPACING_KEYS.forEach((key) => {
      const property = componentCssProperties[kind][key];
      if (!property || seenProperties.has(property)) return;

      seenProperties.add(property);
      values.push([property, `${Math.round(configs[kind][key])}px`]);
    });
  });

  const cssWithTokens = values.reduce(
    (css, [name, value]) => replaceCustomProperty(css, name, value),
    semanticCssTemplate,
  );

  return componentLibrary.reduce(
    (css, { kind }) =>
      upsertMarginRule(
        upsertBorderRule(css, kind, configs[kind]),
        kind,
        configs[kind],
      ),
    cssWithTokens,
  );
}

function scopeSemanticCss(css: string) {
  const scoped = css
    .replace(/^@import[^;]+;\s*/gm, "")
    .replace(/@font-face\s*{[^}]*}\s*/gs, "")
    .replace(":root {", ":scope {")
    .replace(
      /^body\s*{[^}]*}/m,
      `:scope {
  color: var(--one-text);
  font-family: var(--one-font);
  font-size: var(--one-font-size);
  line-height: var(--one-line-height);
}`,
    )
    .replaceAll("body > ", ":scope > ")
    .replaceAll(
      ":hover",
      ':is(:hover, [data-preview-state="hover"])',
    );

  return `@scope (.semantic-preview) {\n${scoped}\n}`;
}

function readSpacing(css: string, name: string, fallback: number) {
  const value = Number.parseFloat(readCustomProperty(css, name) ?? "");
  return Number.isFinite(value) ? clampSpacing(value) : fallback;
}

function cssTextPosition(css: string, index: number) {
  const before = css.slice(0, Math.max(0, index));
  const lastBreak = before.lastIndexOf("\n");
  return {
    column: index - lastBreak - 1,
    line: before.split("\n").length - 1,
  };
}

function SpacingHandle({
  axis,
  label,
  layer,
  side,
  value,
  onPreview,
  onCommit,
}: {
  axis: "x" | "y";
  label: string;
  layer: "padding" | "border" | "margin";
  side: "top" | "right" | "bottom" | "left";
  value: number;
  onPreview: (value: number) => void;
  onCommit: (value: number) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [liveValue, setLiveValue] = useState(value);
  const cleanupRef = useRef<(() => void) | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    cleanupRef.current?.();

    const target = event.currentTarget;
    const pointerId = event.pointerId;
    const startPoint = axis === "x" ? event.clientX : event.clientY;
    const startValue = value;
    const direction = side === "left" || side === "top" ? -1 : 1;
    let didDrag = false;
    let latestValue = startValue;

    const finish = (
      finishEvent: PointerEvent,
      reason: "pointerup" | "pointercancel" | "lostpointercapture",
    ) => {
      if (finishEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      target.removeEventListener("lostpointercapture", onLostCapture);
      cleanupRef.current = null;
      document.body.classList.remove("spacing-resize-x", "spacing-resize-y");
      setIsDragging(false);

      if (didDrag && reason === "pointerup") {
        const committed =
          layer === "border"
            ? Math.round(clampBorder(latestValue))
            : snapSpacing(latestValue);
        setLiveValue(committed);
        onPreview(committed);
        onCommit(committed);
      } else if (didDrag) {
        setLiveValue(startValue);
        onPreview(startValue);
      }
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const point = axis === "x" ? moveEvent.clientX : moveEvent.clientY;
      const delta = (point - startPoint) * direction;
      if (!didDrag && Math.abs(delta) < DRAG_THRESHOLD) return;

      if (!didDrag) {
        didDrag = true;
        setIsDragging(true);
        document.body.classList.add(
          axis === "x" ? "spacing-resize-x" : "spacing-resize-y",
        );
      }

      latestValue =
        layer === "border"
          ? clampBorder(startValue + delta)
          : clampSpacing(startValue + delta);
      setLiveValue(latestValue);
      onPreview(latestValue);
    };

    const onPointerUp = (upEvent: PointerEvent) => finish(upEvent, "pointerup");
    const onPointerCancel = (cancelEvent: PointerEvent) =>
      finish(cancelEvent, "pointercancel");
    const onLostCapture = (lostEvent: PointerEvent) =>
      finish(lostEvent, "lostpointercapture");

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    target.addEventListener("lostpointercapture", onLostCapture);

    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Window listeners keep the interaction working without pointer capture.
    }

    cleanupRef.current = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      target.removeEventListener("lostpointercapture", onLostCapture);
    };
  };

  return (
    <div
      aria-label={`${label}: ${Math.round(isDragging ? liveValue : value)} pixels`}
      className={`spacing-handle spacing-handle--${layer} spacing-handle--${side}${
        isDragging ? " is-dragging" : ""
      }`}
      data-axis={axis}
      onPointerDown={handlePointerDown}
      role="slider"
      tabIndex={0}
    >
      <span className="spacing-handle__line" />
      <span className="spacing-handle__label">
        {Math.round(isDragging ? liveValue : value)}
      </span>
    </div>
  );
}

function ComponentPreview({
  config,
  kind,
}: {
  config: ComponentConfig;
  kind: ComponentKind;
}) {
  if (kind === "headings") {
    return (
      <div className="heading-preview" data-preview-component>
        <h1>{config.text} 1</h1>
        <h2>{config.text} 2</h2>
        <h3>{config.text} 3</h3>
        <h4>{config.text} 4</h4>
        <h5>{config.text} 5</h5>
        <h6>{config.text} 6</h6>
      </div>
    );
  }

  if (kind === "p") {
    return <p data-preview-component>{config.text}</p>;
  }

  if (kind === "a") {
    return (
      <a
        data-preview-component
        href="#documentation"
        onClick={(event) => event.preventDefault()}
      >
        {config.text}
      </a>
    );
  }

  if (kind === "blockquote") {
    return <blockquote data-preview-component>{config.text}</blockquote>;
  }

  if (kind === "button") {
    return (
      <button data-preview-component type="button">
        {config.text}
      </button>
    );
  }

  if (kind === "code") {
    return <code data-preview-component>{config.text}</code>;
  }

  if (kind === "details") {
    return (
      <details data-preview-component open>
        <summary>{config.text}</summary>
        <p>{config.detail}</p>
      </details>
    );
  }

  if (kind === "hr") {
    return <hr data-preview-component />;
  }

  if (kind === "input") {
    const inputExamples = [
      {
        ariaLabel: "Text",
        name: "text",
        placeholder: "Text",
        type: "text",
      },
      {
        ariaLabel: "Email",
        autoComplete: "email",
        name: "email",
        placeholder: "Email",
        type: "email",
      },
      {
        ariaLabel: "Number",
        name: "number",
        placeholder: "Number",
        type: "number",
      },
      {
        ariaLabel: "Password",
        name: "password",
        placeholder: "Password",
        type: "password",
      },
      {
        ariaLabel: "Tel",
        autoComplete: "tel",
        name: "tel",
        placeholder: "Tel",
        type: "tel",
      },
      {
        ariaLabel: "Url",
        autoComplete: "url",
        name: "url",
        placeholder: "Url",
        type: "url",
      },
    ];

    return (
      <div className="input-preview">
        {inputExamples.map((input) => (
          <div
            className="input-preview__instance"
            data-preview-component
            key={input.type}
          >
            <input
              aria-label={input.ariaLabel}
              autoComplete={input.autoComplete}
              data-preview-measure
              name={input.name}
              placeholder={input.placeholder}
              readOnly
              type={input.type}
            />
          </div>
        ))}
      </div>
    );
  }

  if (kind === "progress") {
    return <progress data-preview-component max="100" value="64" />;
  }

  if (kind === "select") {
    return (
      <label data-preview-component htmlFor="story-select">
        <span>{config.text}</span>
        <select defaultValue="system" id="story-select">
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    );
  }

  if (kind === "table") {
    const rows = [
      [config.text, config.detail],
      ["Line height", "1.45"],
      ["Page width", "72rem"],
    ].slice(0, config.copyLength === "short" ? 1 : config.copyLength === "long" ? 3 : 2);

    return (
      <table data-preview-component>
        <thead>
          <tr>
            <th>Token</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, value]) => (
            <tr key={name}>
              <td>{name}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (kind === "textarea") {
    return (
      <label data-preview-component htmlFor="story-textarea">
        <span>{config.text}</span>
        <textarea
          id="story-textarea"
          placeholder={config.placeholder}
          readOnly
        />
      </label>
    );
  }

  return (
    <section data-preview-component>
      <h2>{config.text}</h2>
      <p>{config.detail}</p>
    </section>
  );
}

function ControlField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="control-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

type BoxRegion = "margin" | "border" | "padding" | "content" | "all";

function ScrubbableBoxValue({
  ariaLabel,
  className,
  disabled = false,
  max,
  min,
  onValueChange,
  step,
  value,
}: {
  ariaLabel: string;
  className: string;
  disabled?: boolean;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  step: number;
  value: number;
}) {
  const suppressClickRef = useRef(false);

  const handlePointerDown = (
    event: ReactPointerEvent<HTMLInputElement>,
  ) => {
    if (disabled || !event.isPrimary || event.button !== 0) return;

    const target = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startValue = value;
    let didDrag = false;
    let lockedDelta = 0;

    try {
      const pointerLockRequest = (
        target.requestPointerLock as () => void | Promise<void>
      )();
      if (pointerLockRequest instanceof Promise) {
        pointerLockRequest.catch(() => {
          // Pointer capture below remains available as a fallback.
        });
      }
    } catch {
      // Pointer capture below remains available as a fallback.
    }

    try {
      target.setPointerCapture(pointerId);
    } catch {
      // Window listeners keep scrubbing active when capture is unavailable.
    }

    const finish = (finishEvent: PointerEvent) => {
      if (finishEvent.pointerId !== pointerId) return;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      document.body.classList.remove("box-value-scrubbing");
      suppressClickRef.current = didDrag;

      if (document.pointerLockElement === target) {
        document.exitPointerLock();
      }

      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const isPointerLocked = document.pointerLockElement === target;
      if (isPointerLocked) {
        lockedDelta += moveEvent.movementX;
      }
      const delta = isPointerLocked
        ? lockedDelta
        : moveEvent.clientX - startX;
      if (!didDrag && Math.abs(delta) < DRAG_THRESHOLD) return;

      if (!didDrag) {
        didDrag = true;
        target.blur();
        document.body.classList.add("box-value-scrubbing");
      }

      moveEvent.preventDefault();
      const steps = Math.round(delta / 6);
      onValueChange(
        Math.min(max, Math.max(min, startValue + steps * step)),
      );
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  return (
    <input
      aria-label={ariaLabel}
      className={className}
      disabled={disabled}
      max={max}
      min={min}
      onChange={(event) =>
        onValueChange(
          Math.min(max, Math.max(min, Number(event.target.value))),
        )
      }
      onClick={(event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        suppressClickRef.current = false;
      }}
      onPointerDown={handlePointerDown}
      step={step}
      type="number"
      value={value}
    />
  );
}

function BoxModel({
  config,
  contentSize,
  hoverRegion,
  onChange,
  onHoverRegion,
  supportsSpacing,
}: {
  config: ComponentConfig;
  contentSize: { height: number; width: number };
  hoverRegion: BoxRegion | null;
  onChange: (patch: Partial<ComponentConfig>) => void;
  onHoverRegion: (region: BoxRegion | null) => void;
  supportsSpacing: boolean;
}) {
  const paddingX = supportsSpacing ? Math.round(config.paddingX) : 0;
  const paddingY = supportsSpacing ? Math.round(config.paddingY) : 0;

  const paddingInput = (
    axis: "x" | "y",
    position: "top" | "right" | "bottom" | "left",
  ) => {
    const value = axis === "x" ? paddingX : paddingY;

    return (
      <ScrubbableBoxValue
        ariaLabel={`Padding ${position}`}
        className={`box-model__value box-model__value--${position}`}
        disabled={!supportsSpacing}
        max={96}
        min={0}
        onValueChange={(nextValue) =>
          onChange({
            [axis === "x" ? "paddingX" : "paddingY"]:
              clampSpacing(nextValue),
          })
        }
        step={4}
        value={value}
      />
    );
  };

  const radiusInput = (
    position: "top-left" | "top-right" | "bottom-right" | "bottom-left",
  ) => (
    <ScrubbableBoxValue
      ariaLabel={`Border radius ${position}`}
      className={`box-model__value box-model__radius-value box-model__radius-value--${position}`}
      max={48}
      min={0}
      onValueChange={(radius) => onChange({ radius: clampSpacing(radius) })}
      step={1}
      value={Math.round(config.radius)}
    />
  );

  const borderInput = (position: "top" | "right" | "bottom" | "left") => {
    const field = BORDER_FIELDS[position];

    return (
      <ScrubbableBoxValue
        ariaLabel={`Border ${position}`}
        className={`box-model__value box-model__value--${position}`}
        max={24}
        min={0}
        onValueChange={(nextValue) =>
          onChange({ [field]: clampBorder(nextValue) })
        }
        step={1}
        value={config[field] ?? 0}
      />
    );
  };

  const marginInput = (position: "top" | "right" | "bottom" | "left") => {
    const field = MARGIN_FIELDS[position];

    return (
      <ScrubbableBoxValue
        ariaLabel={`Margin ${position}`}
        className={`box-model__value box-model__value--${position}`}
        max={96}
        min={0}
        onValueChange={(nextValue) =>
          onChange({ [field]: clampSpacing(nextValue) })
        }
        step={4}
        value={config[field] ?? 0}
      />
    );
  };

  const handleRegionHover = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-region]",
    );
    onHoverRegion((target?.dataset.region as BoxRegion | undefined) ?? null);
  };

  return (
    <div
      aria-label="Box model"
      className="box-model"
      data-hover={hoverRegion ?? undefined}
      data-region="margin"
      onMouseLeave={() => onHoverRegion(null)}
      onMouseOver={handleRegionHover}
    >
      <span className="box-model__label">margin</span>
      {marginInput("top")}
      {marginInput("right")}
      {marginInput("bottom")}
      {marginInput("left")}

      <div className="box-model__border" data-region="border">
        <span className="box-model__label">border</span>
        {radiusInput("top-left")}
        {radiusInput("top-right")}
        {radiusInput("bottom-right")}
        {radiusInput("bottom-left")}
        {borderInput("top")}
        {borderInput("right")}
        {borderInput("bottom")}
        {borderInput("left")}

        <div className="box-model__padding" data-region="padding">
          <span className="box-model__label">padding</span>
          {paddingInput("y", "top")}
          {paddingInput("x", "right")}
          {paddingInput("y", "bottom")}
          {paddingInput("x", "left")}
          <div className="box-model__content" data-region="content">
            {contentSize.width}×{contentSize.height}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The advisory UI state persisted alongside the stylesheet. */
export interface WorkbenchConfig {
  schema: 1;
  accent: string;
  configs: ConfigByKind;
}

export interface AppProps {
  /**
   * Seed the editor from a saved draft. This text is authoritative: `configs`
   * is re-derived from it, never the other way round.
   */
  initialCss?: string;
  /** Advisory UI state that CSS cannot express, e.g. which copy length is shown. */
  initialConfig?: WorkbenchConfig;
  /** Called whenever the stylesheet or the controls change. */
  onDirty?: (state: { css: string; config: WorkbenchConfig }) => void;
  /** Rendered above the workbench, for library chrome the workbench must not know about. */
  headerSlot?: ReactNode;
}

/**
 * With no props this behaves exactly as it did before persistence existed,
 * which is what keeps `/playground` free.
 */
export function App({ initialCss, initialConfig, onDirty, headerSlot }: AppProps = {}) {
  const [selectedKind, setSelectedKind] = useState<ComponentKind>("button");
  const [selectedButtonFamily, setSelectedButtonFamily] =
    useState<ButtonFamily>("button");
  const [configs, setConfigs] = useState<ConfigByKind>(
    () => initialConfig?.configs ?? initialConfigs,
  );
  const [accent, setAccent] = useState(() => initialConfig?.accent ?? "#0066ff");
  const [cssSource, setCssSource] = useState(
    () => initialCss ?? buildSemanticCss(initialConfigs, "#0066ff"),
  );
  const [cssHighlight, setCssHighlight] = useState<{
    end: number;
    start: number;
  } | null>(null);
  const [editorScroll, setEditorScroll] = useState({ left: 0, top: 0 });
  const [contentSize, setContentSize] = useState({ height: 0, width: 0 });
  const [hoverRegion, setHoverRegion] = useState<BoxRegion | null>(null);
  const cssEditorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const selectedMeta = componentLibrary.find(
    (item) => item.kind === selectedKind,
  )!;
  const config = configs[selectedKind];
  const selectedCssProperties = componentCssProperties[selectedKind];
  const supportsCopy = selectedMeta.copy !== false;
  const supportsGap = Boolean(selectedCssProperties.gap);
  const supportsSpacing = Boolean(
    selectedCssProperties.paddingX || selectedCssProperties.paddingY,
  );
  const previewCss = useMemo(() => scopeSemanticCss(cssSource), [cssSource]);

  /**
   * The only place this component learns that persistence exists.
   *
   * It is complete despite being one effect: every mutation path already
   * funnels into these three states — updateConfig, updateAccent,
   * updateCanvasFromCss, and the SpacingHandle commits (which call
   * updateConfig). No handler needed touching.
   */
  useEffect(() => {
    onDirty?.({ css: cssSource, config: { schema: 1, accent, configs } });
  }, [onDirty, cssSource, accent, configs]);

  useEffect(() => {
    const preview =
      previewRef.current?.querySelector<HTMLElement>(
        "[data-preview-measure]",
      ) ??
      previewRef.current?.querySelector<HTMLElement>(
        "[data-preview-component]",
      );
    if (!preview) return;

    const updateSize = () => {
      const rect = preview.getBoundingClientRect();
      setContentSize({
        height: Math.round(rect.height),
        width: Math.round(rect.width),
      });
    };
    const observer = new ResizeObserver(updateSize);

    observer.observe(preview);
    updateSize();

    return () => observer.disconnect();
  }, [selectedButtonFamily, selectedKind]);

  const revealCssRange = (css: string, start: number, end: number) => {
    if (start < 0 || end <= start) return;

    const position = cssTextPosition(css, start);
    setCssHighlight({ end, start });

    window.requestAnimationFrame(() => {
      const editor = cssEditorRef.current;
      if (!editor) return;

      editor.scrollTop = Math.max(
        0,
        position.line * CSS_EDITOR_LINE_HEIGHT - editor.clientHeight * 0.3,
      );
      editor.scrollLeft = Math.max(
        0,
        position.column * CSS_EDITOR_CHAR_WIDTH - editor.clientWidth * 0.75,
      );
      setEditorScroll({
        left: editor.scrollLeft,
        top: editor.scrollTop,
      });
    });
  };

  const revealCssTarget = (css: string, target: string) => {
    const start = css.indexOf(target);
    revealCssRange(css, start, start + target.length);
  };

  const revealCssProperty = (css: string, name: string) => {
    const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
    if (!match?.[1]) return;

    const valueStart = match.index + match[0].indexOf(match[1]);
    revealCssRange(css, valueStart, valueStart + match[1].length);
  };

  const selectComponent = (kind: ComponentKind) => {
    setSelectedKind(kind);
    revealCssTarget(cssSource, componentCssTargets[kind]);
  };

  const updateConfig = (patch: Partial<ComponentConfig>) => {
    setConfigs((current) => {
      const next = {
        ...current,
        [selectedKind]: { ...current[selectedKind], ...patch },
      };

      SPACING_KEYS.forEach((key) => {
        const value = patch[key];
        const property = componentCssProperties[selectedKind][key];
        if (value === undefined || !property) return;

        componentLibrary.forEach(({ kind }) => {
          if (componentCssProperties[kind][key] !== property) return;
          next[kind] = { ...next[kind], [key]: value };
        });
      });

      if (patch.radius !== undefined) {
        componentLibrary.forEach(({ kind }) => {
          next[kind] = { ...next[kind], radius: patch.radius! };
        });
      }

      return next;
    });

    let nextCss = cssSource;
    let changedProperty: string | undefined;
    const changesBorder = BORDER_FIELD_LIST.some(
      (field) => patch[field] !== undefined,
    );
    const changesMargin = MARGIN_FIELD_LIST.some(
      (field) => patch[field] !== undefined,
    );

    SPACING_KEYS.forEach((key) => {
      const value = patch[key];
      const property = componentCssProperties[selectedKind][key];
      if (value === undefined || !property) return;

      nextCss = replaceCustomProperty(
        nextCss,
        property,
        `${Math.round(value)}px`,
      );
      changedProperty = property;
    });

    if (patch.radius !== undefined) {
      nextCss = replaceCustomProperty(
        nextCss,
        "--one-radius",
        `${Math.round(patch.radius)}px`,
      );
      changedProperty = "--one-radius";
    }

    if (changesBorder) {
      nextCss = upsertBorderRule(nextCss, selectedKind, {
        ...config,
        ...patch,
      });
    }

    if (changesMargin) {
      nextCss = upsertMarginRule(nextCss, selectedKind, {
        ...config,
        ...patch,
      });
    }

    if (nextCss !== cssSource) {
      setCssSource(nextCss);
      if (changedProperty) {
        revealCssProperty(nextCss, changedProperty);
      } else if (changesBorder) {
        const range = borderRuleRange(nextCss, selectedKind);
        if (range) {
          const rule = nextCss.slice(range.start, range.end);
          const declarationIndex = rule.indexOf("border-width:");
          const valueStart =
            range.start + declarationIndex + "border-width:".length + 1;
          const valueEnd = nextCss.indexOf(";", valueStart);
          revealCssRange(
            nextCss,
            valueStart,
            valueEnd,
          );
        }
      } else if (changesMargin) {
        const range = marginRuleRange(nextCss, selectedKind);
        if (range) {
          const rule = nextCss.slice(range.start, range.end);
          const declarationIndex = rule.indexOf("margin:");
          const valueStart =
            range.start + declarationIndex + "margin:".length + 1;
          const valueEnd = nextCss.indexOf(";", valueStart);
          revealCssRange(nextCss, valueStart, valueEnd);
        }
      }
    }
  };

  const updateAccent = (value: string) => {
    const nextCss = replaceCustomProperty(cssSource, "--one-accent-color", value);
    setAccent(value);
    setCssSource(nextCss);
    revealCssProperty(nextCss, "--one-accent-color");
  };

  const updateCanvasFromCss = (nextCss: string) => {
    setCssSource(nextCss);
    setCssHighlight(null);

    setConfigs((current) => {
      const next = { ...current };

      componentLibrary.forEach(({ kind }) => {
        const properties = componentCssProperties[kind];
        const currentConfig = current[kind];
        const borderWidths = readBorderWidths(nextCss, kind, currentConfig);
        const margins = readMargins(nextCss, kind, currentConfig);
        next[kind] = {
          ...currentConfig,
          ...borderWidths,
          ...margins,
          radius: readSpacing(nextCss, "--one-radius", currentConfig.radius),
          gap: properties.gap
            ? readSpacing(nextCss, properties.gap, currentConfig.gap)
            : currentConfig.gap,
          paddingX: properties.paddingX
            ? readSpacing(nextCss, properties.paddingX, currentConfig.paddingX)
            : currentConfig.paddingX,
          paddingY: properties.paddingY
            ? readSpacing(nextCss, properties.paddingY, currentConfig.paddingY)
            : currentConfig.paddingY,
        };
      });

      return next;
    });

    const nextAccent = readCustomProperty(nextCss, "--one-accent-color");
    if (nextAccent && /^#[\da-f]{6}$/i.test(nextAccent)) {
      setAccent(nextAccent);
    }
  };

  const changeCopyLength = (direction: -1 | 1) => {
    const lengths: CopyLength[] = ["short", "default", "long"];
    const currentIndex = lengths.indexOf(config.copyLength);
    const nextLength =
      lengths[
        Math.min(lengths.length - 1, Math.max(0, currentIndex + direction))
      ];

    updateConfig({
      copyLength: nextLength,
      ...copyExamples[selectedKind][nextLength],
    });
  };

  const cssHighlightStyle = useMemo<CSSProperties | undefined>(() => {
    if (!cssHighlight) return undefined;

    const start = cssTextPosition(cssSource, cssHighlight.start);
    const width = Math.max(
      8,
      (cssHighlight.end - cssHighlight.start) * CSS_EDITOR_CHAR_WIDTH,
    );

    return {
      height: CSS_EDITOR_LINE_HEIGHT,
      left:
        CSS_EDITOR_PADDING +
        start.column * CSS_EDITOR_CHAR_WIDTH -
        editorScroll.left,
      top:
        CSS_EDITOR_PADDING +
        start.line * CSS_EDITOR_LINE_HEIGHT -
        editorScroll.top,
      width,
    };
  }, [cssHighlight, cssSource, editorScroll]);

  const cssColorSwatches = useMemo(() => {
    const swatches: Array<{
      color: string;
      key: string;
      left: number;
      top: number;
    }> = [];
    const tokenColorPattern =
      /^\s*--[\w-]+:\s{3,}(#[\da-f]{6}(?:[\da-f]{2})?)\s*;/gim;

    for (const match of cssSource.matchAll(tokenColorPattern)) {
      const color = match[1];
      if (!color || match.index === undefined) continue;

      const colorIndex = match.index + match[0].indexOf(color);
      const position = cssTextPosition(cssSource, colorIndex);
      swatches.push({
        color,
        key: `${colorIndex}-${color}`,
        left:
          CSS_EDITOR_PADDING +
          (position.column - 2) * CSS_EDITOR_CHAR_WIDTH -
          editorScroll.left,
        top:
          CSS_EDITOR_PADDING +
          position.line * CSS_EDITOR_LINE_HEIGHT +
          3 -
          editorScroll.top,
      });
    }

    return swatches;
  }, [cssSource, editorScroll]);

  const handleDefinitions = [
    {
      axis: "y",
      field: "marginTop",
      layer: "margin",
      side: "top",
    },
    {
      axis: "x",
      field: "marginRight",
      layer: "margin",
      side: "right",
    },
    {
      axis: "y",
      field: "marginBottom",
      layer: "margin",
      side: "bottom",
    },
    {
      axis: "x",
      field: "marginLeft",
      layer: "margin",
      side: "left",
    },
    {
      axis: "y",
      field: "borderTop",
      layer: "border",
      side: "top",
    },
    {
      axis: "x",
      field: "borderRight",
      layer: "border",
      side: "right",
    },
    {
      axis: "y",
      field: "borderBottom",
      layer: "border",
      side: "bottom",
    },
    {
      axis: "x",
      field: "borderLeft",
      layer: "border",
      side: "left",
    },
    {
      axis: "y",
      field: "paddingY",
      layer: "padding",
      side: "top",
    },
    {
      axis: "x",
      field: "paddingX",
      layer: "padding",
      side: "right",
    },
    {
      axis: "y",
      field: "paddingY",
      layer: "padding",
      side: "bottom",
    },
    {
      axis: "x",
      field: "paddingX",
      layer: "padding",
      side: "left",
    },
  ] as const;

  const boxModelHandles = handleDefinitions
    .filter(({ layer }) => layer !== "padding" || supportsSpacing)
    .map(({ axis, field, layer, side }) => {
      const updateHandleValue = (value: number) =>
        updateConfig(
          layer === "border"
            ? {
                borderTop: value,
                borderRight: value,
                borderBottom: value,
                borderLeft: value,
              }
            : ({ [field]: value } as Partial<ComponentConfig>),
        );

      return (
        <SpacingHandle
          axis={axis}
          key={`${layer}-${side}`}
          label={layer}
          layer={layer}
          onCommit={updateHandleValue}
          onPreview={updateHandleValue}
          side={side}
          value={config[field] ?? 0}
        />
      );
    });

  return (
    <div
      className="workbench"
      data-testid="workbench"
      style={{ "--workbench-accent": accent } as CSSProperties}
    >
      <style>{previewCss}</style>
      {headerSlot}
      <div className="design-pane">
        <aside className="library-panel">
          <div className="library-scroll">
            <nav aria-label="Component library" className="component-tree">
              {componentLibrary.map((item) =>
                item.kind === "button" ? (
                  <div className="component-tree__group" key={item.kind}>
                    <span className="component-tree__group-label">
                      {item.label}
                    </span>
                    <div className="component-tree__submenu">
                      {BUTTON_FAMILIES.map((family) => (
                        <button
                          aria-current={
                            selectedKind === "button" &&
                            selectedButtonFamily === family.key
                              ? "page"
                              : undefined
                          }
                          className={
                            selectedKind === "button" &&
                            selectedButtonFamily === family.key
                              ? "is-selected"
                              : ""
                          }
                          data-semantic={family.semantic}
                          key={family.key}
                          onClick={() => {
                            setSelectedButtonFamily(family.key);
                            selectComponent("button");
                          }}
                          title={family.semantic}
                          type="button"
                        >
                          {family.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    aria-current={
                      selectedKind === item.kind ? "page" : undefined
                    }
                    className={selectedKind === item.kind ? "is-selected" : ""}
                    data-semantic={item.semantic}
                    key={item.kind}
                    onClick={() => selectComponent(item.kind)}
                    title={item.semantic}
                    type="button"
                  >
                    {item.label}
                  </button>
                ),
              )}
            </nav>
          </div>

          <div className="controls-panel">
            <div className="controls-scroll">
              {supportsCopy && (
                <section className="controls-section">
                  <h2>Example copy</h2>
                  <div
                    aria-label="Example copy length"
                    className="copy-length-control"
                  >
                    <button
                      disabled={config.copyLength === "short"}
                      onClick={() => changeCopyLength(-1)}
                      type="button"
                    >
                      Shorter
                    </button>
                    <button
                      disabled={config.copyLength === "long"}
                      onClick={() => changeCopyLength(1)}
                      type="button"
                    >
                      Longer
                    </button>
                  </div>
                </section>
              )}

              <section className="controls-section controls-section--box-model">
                <h2
                  onMouseEnter={() => setHoverRegion("all")}
                  onMouseLeave={() => setHoverRegion(null)}
                >
                  Box model
                </h2>
                <BoxModel
                  config={config}
                  contentSize={contentSize}
                  hoverRegion={hoverRegion}
                  onChange={updateConfig}
                  onHoverRegion={setHoverRegion}
                  supportsSpacing={supportsSpacing}
                />
                {supportsGap && (
                  <ControlField label="Content gap">
                    <div className="number-input">
                      <input
                        aria-label="Content gap px"
                        max="48"
                        min="0"
                        onChange={(event) =>
                          updateConfig({
                            gap: clampSpacing(Number(event.target.value)),
                          })
                        }
                        step="4"
                        type="number"
                        value={Math.round(config.gap)}
                      />
                      <span>px</span>
                    </div>
                  </ControlField>
                )}
              </section>

              <section className="controls-section">
                <h2>Theme</h2>
                <ControlField label="Accent">
                  <div className="color-input">
                    <input
                      data-testid="accent-input"
                      onChange={(event) => updateAccent(event.target.value)}
                      type="color"
                      value={accent}
                    />
                    <code data-testid="accent-value">{accent}</code>
                  </div>
                </ControlField>
              </section>
            </div>
          </div>
        </aside>

        <div className="design-stack">
          <main className="story-workspace">
            <div className="story-stage">
              <div className="story-frame">
                <div
                  className="story-preview-area"
                  data-hover-region={hoverRegion ?? undefined}
                  style={
                    {
                      "--pad-x": `${config.paddingX}px`,
                      "--pad-y": `${config.paddingY}px`,
                      "--bd-top": `${config.borderTop ?? 0}px`,
                      "--bd-right": `${config.borderRight ?? 0}px`,
                      "--bd-bottom": `${config.borderBottom ?? 0}px`,
                      "--bd-left": `${config.borderLeft ?? 0}px`,
                      "--mg-top": `${config.marginTop ?? 0}px`,
                      "--mg-right": `${config.marginRight ?? 0}px`,
                      "--mg-bottom": `${config.marginBottom ?? 0}px`,
                      "--mg-left": `${config.marginLeft ?? 0}px`,
                    } as React.CSSProperties
                  }
                >
                  {selectedKind === "button" ? (
                    selectedButtonFamily === "icon-button" ? (
                      <div
                        className="variant-gallery button-matrix icon-button-matrix semantic-preview"
                        ref={previewRef}
                      >
                        <div className="button-matrix__group">
                          {BUTTON_MATRIX_SIZES.map((size) => (
                            <Fragment key={size.label}>
                              {ICON_BUTTON_VARIANTS.map((variant) => (
                                <div
                                  className="button-matrix__row"
                                  key={`${size.label}-${variant.label}`}
                                >
                                  {BUTTON_MATRIX_STATES.map((state) => {
                                    const semanticAttributes = {
                                      ...(size.small ? { small: "" } : {}),
                                      ...(variant.value
                                        ? { variant: variant.value }
                                        : {}),
                                    } as Record<string, string>;

                                    return (
                                      <div
                                        className="button-matrix__cell"
                                        key={state.value}
                                      >
                                        <span className="button-matrix__instance-label">
                                          Icon Button / {variant.label} /{" "}
                                          {state.label} / {size.label}
                                        </span>
                                        <button
                                          aria-label="Favorite"
                                          data-preview-component
                                          data-preview-state={
                                            state.value === "hover"
                                              ? "hover"
                                              : undefined
                                          }
                                          disabled={state.value === "disabled"}
                                          type="button"
                                          {...semanticAttributes}
                                        >
                                          {createElement("ds-icon", {
                                            "aria-hidden": "true",
                                            type: "star",
                                          })}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    ) : (
                    <div
                      className="variant-gallery button-matrix semantic-preview"
                      ref={previewRef}
                    >
                      {BUTTON_MATRIX_GROUPS.filter((group) =>
                        selectedButtonFamily === "button-danger"
                          ? group.key === "danger"
                          : group.key === "standard",
                      ).map((group) => (
                        <div
                          className="button-matrix__group"
                          key={group.key}
                        >
                          {BUTTON_MATRIX_SIZES.map((size) => (
                            <Fragment key={size.label}>
                              {group.variants.map(
                                (variant) => (
                                  <div
                                    className="button-matrix__row"
                                    key={`${size.label}-${variant.label}`}
                                  >
                                    {BUTTON_MATRIX_STATES.map((state) => {
                                      const isMeasuredInstance =
                                        !size.small &&
                                        variant.value === undefined &&
                                        state.value === "default";
                                      const semanticAttributes = {
                                        ...(size.small ? { small: "" } : {}),
                                        ...(variant.value
                                          ? { variant: variant.value }
                                          : {}),
                                      } as Record<string, string>;
                                      const button = (
                                        <button
                                          data-preview-component
                                          data-preview-measure={
                                            isMeasuredInstance || undefined
                                          }
                                          data-preview-state={
                                            state.value === "hover"
                                              ? "hover"
                                              : undefined
                                          }
                                          disabled={state.value === "disabled"}
                                          type="button"
                                          {...semanticAttributes}
                                        >
                                          Button
                                        </button>
                                      );

                                      return (
                                        <div
                                          className="button-matrix__cell"
                                          key={state.value}
                                        >
                                          <span className="button-matrix__instance-label">
                                            {group.label} / {variant.label} /{" "}
                                            {state.label} / {size.label}
                                          </span>
                                          {isMeasuredInstance ? (
                                            <div className="component-selection">
                                              {boxModelHandles}
                                              {button}
                                            </div>
                                          ) : (
                                            button
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ),
                              )}
                            </Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                    )
                  ) : selectedKind === "input" ? (
                    <div
                      className="variant-gallery button-matrix input-field-matrix semantic-preview"
                      ref={previewRef}
                    >
                      <div className="button-matrix__group">
                        {INPUT_FIELD_VALUE_TYPES.map((valueType) => (
                          <div
                            className="button-matrix__row"
                            key={valueType.label}
                          >
                            {INPUT_FIELD_STATES.map((state) => {
                              const isMeasuredInstance =
                                !valueType.placeholder &&
                                state.value === "default";
                              const input = (
                                <input
                                  aria-invalid={
                                    state.value === "error" || undefined
                                  }
                                  data-preview-component
                                  data-preview-measure={
                                    isMeasuredInstance || undefined
                                  }
                                  defaultValue={
                                    valueType.placeholder ? undefined : "Value"
                                  }
                                  disabled={state.value === "disabled"}
                                  placeholder={
                                    valueType.placeholder ? "Value" : undefined
                                  }
                                  readOnly
                                  type="text"
                                />
                              );

                              return (
                                <div
                                  className="button-matrix__cell"
                                  key={state.value}
                                >
                                  <span className="button-matrix__instance-label">
                                    Input Field / {state.label} /{" "}
                                    {valueType.label}
                                  </span>
                                  <label className="input-field-matrix__field">
                                    <span>Label</span>
                                    {isMeasuredInstance ? (
                                      <div className="component-selection">
                                        {boxModelHandles}
                                        {input}
                                      </div>
                                    ) : (
                                      input
                                    )}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="variant-gallery component-matrix" ref={previewRef}>
                      <div className="button-matrix__cell component-matrix__cell">
                        <span className="button-matrix__instance-label">
                          {selectedMeta.label}
                        </span>
                        <div className="component-selection semantic-preview">
                          {boxModelHandles}
                          <ComponentPreview config={config} kind={selectedKind} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <section aria-label="Live CSS file" className="css-file-panel">
        <div className="css-editor-shell">
          {cssHighlightStyle && (
            <span
              aria-hidden="true"
              className="css-editor-highlight"
              style={cssHighlightStyle}
            />
          )}
          {cssColorSwatches.map(({ color, key, left, top }) => (
            <span
              aria-hidden="true"
              className="css-color-swatch"
              key={key}
              style={{ "--swatch-color": color, left, top } as CSSProperties}
            />
          ))}
          <textarea
            aria-label="Editable CSS source"
            data-testid="live-css-source"
            onChange={(event) => updateCanvasFromCss(event.target.value)}
            onScroll={(event) =>
              setEditorScroll({
                left: event.currentTarget.scrollLeft,
                top: event.currentTarget.scrollTop,
              })
            }
            ref={cssEditorRef}
            spellCheck={false}
            value={cssSource}
          />
        </div>
      </section>
    </div>
  );
}
