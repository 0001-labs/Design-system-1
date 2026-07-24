import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from "react";

type ComponentKind = "text" | "button" | "input" | "card";
type ComponentVariant =
  | "default"
  | "heading"
  | "small"
  | "primary"
  | "secondary";

type ComponentConfig = {
  text: string;
  detail: string;
  placeholder: string;
  variant: ComponentVariant;
  paddingX: number;
  paddingY: number;
  gap: number;
};

type ConfigByKind = Record<ComponentKind, ComponentConfig>;

const componentLibrary: Array<{
  kind: ComponentKind;
  label: string;
  description: string;
  stories: string[];
}> = [
  {
    kind: "text",
    label: "Text",
    description: "Typography and hierarchy",
    stories: ["Default", "Heading", "Small"],
  },
  {
    kind: "button",
    label: "Button",
    description: "Actions and links",
    stories: ["Primary", "Secondary"],
  },
  {
    kind: "input",
    label: "Input",
    description: "Native form control",
    stories: ["Default"],
  },
  {
    kind: "card",
    label: "Card",
    description: "Content surface",
    stories: ["Default"],
  },
];

const initialConfigs: ConfigByKind = {
  text: {
    text: "Build with DS one",
    detail: "",
    placeholder: "",
    variant: "heading",
    paddingX: 0,
    paddingY: 0,
    gap: 0,
  },
  button: {
    text: "Get started",
    detail: "",
    placeholder: "",
    variant: "primary",
    paddingX: 20,
    paddingY: 12,
    gap: 0,
  },
  input: {
    text: "Email address",
    detail: "",
    placeholder: "you@example.com",
    variant: "default",
    paddingX: 12,
    paddingY: 10,
    gap: 8,
  },
  card: {
    text: "A focused component",
    detail: "Refine one primitive at a time, then compose it later.",
    placeholder: "",
    variant: "default",
    paddingX: 24,
    paddingY: 24,
    gap: 12,
  },
};

const SNAP_GRID = 4;
const DRAG_THRESHOLD = 3;

function clampSpacing(value: number) {
  return Math.min(96, Math.max(0, value));
}

function snapSpacing(value: number) {
  return clampSpacing(Math.round(value / SNAP_GRID) * SNAP_GRID);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function componentClasses(kind: ComponentKind, variant: ComponentVariant) {
  if (kind === "text") {
    return `ds-text${
      variant === "heading"
        ? " ds-text--heading"
        : variant === "small"
          ? " ds-text--small"
          : ""
    }`;
  }

  if (kind === "button") {
    return `ds-button ds-button--${
      variant === "secondary" ? "secondary" : "primary"
    }`;
  }

  return `ds-${kind}`;
}

function componentSelector(kind: ComponentKind, variant: ComponentVariant) {
  if (kind === "text") {
    return variant === "heading"
      ? ".ds-text--heading"
      : variant === "small"
        ? ".ds-text--small"
        : ".ds-text";
  }

  if (kind === "button") {
    return variant === "secondary"
      ? ".ds-button--secondary"
      : ".ds-button--primary";
  }

  return `.ds-${kind}`;
}

function componentCss(
  kind: ComponentKind,
  config: ComponentConfig,
  accent: string,
) {
  const selector = componentSelector(kind, config.variant);
  const declarations = [
    `  padding-block: ${Math.round(config.paddingY)}px;`,
    `  padding-inline: ${Math.round(config.paddingX)}px;`,
  ];

  if (kind === "card") {
    declarations.push(`  gap: ${Math.round(config.gap)}px;`);
  }

  const rules = [
    `:root {`,
    `  --accent-color: ${accent};`,
    `}`,
    ``,
    `${selector} {`,
    ...declarations,
    `}`,
  ];

  if (kind === "input") {
    rules.push(
      ``,
      `.ds-text + .ds-input {`,
      `  margin-block-start: ${Math.round(config.gap)}px;`,
      `}`,
    );
  }

  return rules.join("\n");
}

function componentMarkup(kind: ComponentKind, config: ComponentConfig) {
  const text = escapeHtml(config.text);

  if (kind === "text") {
    const tag = config.variant === "heading" ? "h2" : "p";
    return `<${tag} class="${componentClasses(kind, config.variant)}">${text}</${tag}>`;
  }

  if (kind === "button") {
    return `<button class="${componentClasses(kind, config.variant)}" type="button">${text}</button>`;
  }

  if (kind === "input") {
    return [
      `<label class="ds-text" for="example-input">${text}</label>`,
      `<input class="ds-input" id="example-input" type="text" placeholder="${escapeHtml(config.placeholder)}" />`,
    ].join("\n");
  }

  return [
    `<article class="ds-card">`,
    `  <h2 class="ds-text ds-text--heading">${text}</h2>`,
    `  <p class="ds-text">${escapeHtml(config.detail)}</p>`,
    `</article>`,
  ].join("\n");
}

function buildExport(
  kind: ComponentKind,
  config: ComponentConfig,
  accent: string,
) {
  const css = componentCss(kind, config, accent)
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");
  const markup = componentMarkup(kind, config)
    .split("\n")
    .map((line) => `      ${line}`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/ds-one@alpha/DS1/1-root/one.css"
    />
    <style>
${css}
    </style>
    <title>DS one ${kind}</title>
  </head>
  <body>
    <main>
${markup}
    </main>
  </body>
</html>`;
}

function SpacingHandle({
  axis,
  label,
  side,
  value,
  onPreview,
  onCommit,
}: {
  axis: "x" | "y";
  label: string;
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
        const committed = snapSpacing(latestValue);
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

      latestValue = clampSpacing(startValue + delta);
      setLiveValue(latestValue);
      onPreview(latestValue);
    };

    const onPointerUp = (upEvent: PointerEvent) =>
      finish(upEvent, "pointerup");
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
      className={`spacing-handle spacing-handle--${side}${
        isDragging ? " is-dragging" : ""
      }`}
      data-axis={axis}
      onPointerDown={handlePointerDown}
      role="slider"
      tabIndex={0}
    >
      <span className="spacing-handle__line" />
      <span className="spacing-handle__label">
        {label} {Math.round(isDragging ? liveValue : value)}
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
  const style = {
    padding: `${config.paddingY}px ${config.paddingX}px`,
  };

  if (kind === "text") {
    const className = componentClasses(kind, config.variant);
    return config.variant === "heading" ? (
      <h2 className={className} data-preview-component style={style}>
        {config.text}
      </h2>
    ) : (
      <p className={className} data-preview-component style={style}>
        {config.text}
      </p>
    );
  }

  if (kind === "button") {
    return (
      <button
        className={componentClasses(kind, config.variant)}
        data-preview-component
        style={style}
        type="button"
      >
        {config.text}
      </button>
    );
  }

  if (kind === "input") {
    return (
      <div
        className="story-field"
        data-preview-component
        style={{ gap: `${config.gap}px` }}
      >
        <label className="ds-text" htmlFor="story-input">
          {config.text}
        </label>
        <input
          className="ds-input"
          id="story-input"
          placeholder={config.placeholder}
          readOnly
          style={style}
        />
      </div>
    );
  }

  return (
    <article
      className="ds-card story-card"
      data-preview-component
      style={{
        ...style,
        gap: `${config.gap}px`,
      }}
    >
      <h2 className="ds-text ds-text--heading">{config.text}</h2>
      <p className="ds-text">{config.detail}</p>
    </article>
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

export function App() {
  const [selectedKind, setSelectedKind] = useState<ComponentKind>("button");
  const [configs, setConfigs] = useState<ConfigByKind>(initialConfigs);
  const [accent, setAccent] = useState("#99ff73");
  const [background, setBackground] = useState<"light" | "dark">("light");
  const [exportOpen, setExportOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy HTML");

  const selectedMeta = componentLibrary.find(
    (item) => item.kind === selectedKind,
  )!;
  const config = configs[selectedKind];
  const exportedHtml = useMemo(
    () => buildExport(selectedKind, config, accent),
    [accent, config, selectedKind],
  );
  const cssSource = useMemo(
    () => componentCss(selectedKind, config, accent),
    [accent, config, selectedKind],
  );

  const updateConfig = (patch: Partial<ComponentConfig>) => {
    setConfigs((current) => ({
      ...current,
      [selectedKind]: { ...current[selectedKind], ...patch },
    }));
  };

  const chooseStory = (story: string) => {
    if (selectedKind === "button") {
      updateConfig({
        variant: story === "Secondary" ? "secondary" : "primary",
      });
    }
    if (selectedKind === "text") {
      updateConfig({
        variant:
          story === "Heading"
            ? "heading"
            : story === "Small"
              ? "small"
              : "default",
      });
    }
  };

  const currentStory =
    selectedKind === "button"
      ? config.variant === "secondary"
        ? "Secondary"
        : "Primary"
      : selectedKind === "text"
        ? config.variant === "heading"
          ? "Heading"
          : config.variant === "small"
            ? "Small"
            : "Default"
        : "Default";

  const copyExport = async () => {
    await navigator.clipboard.writeText(exportedHtml);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy HTML"), 1400);
  };

  const downloadExport = () => {
    const blob = new Blob([exportedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ds-one-${selectedKind}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="workbench"
      style={{ "--workbench-accent": accent } as CSSProperties}
    >
      <header className="workbench-header">
        <div className="workbench-brand">
          <span className="workbench-logo">DS</span>
          <strong>DS one</strong>
          <span>Components</span>
        </div>
        <div className="workbench-header-actions">
          <span className="runtime-status">
            <i /> CSS-only output
          </span>
          <button
            className="action-button action-button--primary"
            onClick={() => setExportOpen(true)}
            type="button"
          >
            Export component
          </button>
        </div>
      </header>

      <aside className="library-panel">
        <div className="panel-title">
          <span>Library</span>
          <small>{componentLibrary.length} components</small>
        </div>
        <div className="library-search">
          <input aria-label="Search components" placeholder="Search components" />
          <kbd>⌘ K</kbd>
        </div>
        <nav aria-label="Component library" className="component-tree">
          <div className="tree-section">
            <span>Core</span>
            {componentLibrary.map((item) => (
              <div className="tree-entry" key={item.kind}>
                <button
                  aria-current={selectedKind === item.kind ? "page" : undefined}
                  className={selectedKind === item.kind ? "is-selected" : ""}
                  onClick={() => setSelectedKind(item.kind)}
                  type="button"
                >
                  <span className={`component-icon icon-${item.kind}`} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </button>
                {selectedKind === item.kind && (
                  <div className="story-list">
                    {item.stories.map((story) => (
                      <button
                        aria-current={
                          currentStory === story ? "true" : undefined
                        }
                        className={currentStory === story ? "is-active" : ""}
                        key={story}
                        onClick={() => chooseStory(story)}
                        type="button"
                      >
                        {story}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="tree-section tree-section--muted">
            <span>Compositions</span>
            <p>Coming later</p>
          </div>
        </nav>
      </aside>

      <main className="story-workspace">
        <div className="story-toolbar">
          <div className="story-breadcrumb">
            Core <span>/</span> {selectedMeta.label} <span>/</span>{" "}
            <strong>{currentStory}</strong>
          </div>
          <div className="story-tabs">
            <button aria-pressed="true" type="button">
              Canvas
            </button>
            <button disabled type="button">
              Docs
            </button>
          </div>
          <div className="background-toggle" aria-label="Canvas background">
            <button
              aria-pressed={background === "light"}
              aria-label="Light canvas"
              onClick={() => setBackground("light")}
              type="button"
            >
              ○
            </button>
            <button
              aria-pressed={background === "dark"}
              aria-label="Dark canvas"
              onClick={() => setBackground("dark")}
              type="button"
            >
              ●
            </button>
          </div>
        </div>

        <div className={`story-stage is-${background}`}>
          <div className="story-frame">
            <div className="story-heading">
              <div>
                <span>Core / {selectedMeta.label}</span>
                <h1>{currentStory}</h1>
              </div>
              <p>Drag the orange handles to refine component spacing.</p>
            </div>
            <div className="story-preview-area">
              <div className="component-measure">
                <div className="component-selection">
                  <SpacingHandle
                    axis="y"
                    label="Y"
                    onCommit={(paddingY) => updateConfig({ paddingY })}
                    onPreview={(paddingY) => updateConfig({ paddingY })}
                    side="top"
                    value={config.paddingY}
                  />
                  <SpacingHandle
                    axis="x"
                    label="X"
                    onCommit={(paddingX) => updateConfig({ paddingX })}
                    onPreview={(paddingX) => updateConfig({ paddingX })}
                    side="right"
                    value={config.paddingX}
                  />
                  <SpacingHandle
                    axis="y"
                    label="Y"
                    onCommit={(paddingY) => updateConfig({ paddingY })}
                    onPreview={(paddingY) => updateConfig({ paddingY })}
                    side="bottom"
                    value={config.paddingY}
                  />
                  <SpacingHandle
                    axis="x"
                    label="X"
                    onCommit={(paddingX) => updateConfig({ paddingX })}
                    onPreview={(paddingX) => updateConfig({ paddingX })}
                    side="left"
                    value={config.paddingX}
                  />
                  <ComponentPreview config={config} kind={selectedKind} />
                </div>
                {(selectedKind === "card" || selectedKind === "input") && (
                  <div className="gap-control">
                    <span>Content gap</span>
                    <input
                      max="48"
                      min="0"
                      onChange={(event) =>
                        updateConfig({ gap: Number(event.target.value) })
                      }
                      step="4"
                      type="range"
                      value={config.gap}
                    />
                    <code>{config.gap}px</code>
                  </div>
                )}
              </div>
            </div>
            <footer className="story-frame-footer">
              <span>
                Padding {Math.round(config.paddingY)} ×{" "}
                {Math.round(config.paddingX)}
              </span>
              <code>{componentClasses(selectedKind, config.variant)}</code>
            </footer>
          </div>
        </div>
      </main>

      <aside className="controls-panel">
        <div className="panel-title">
          <span>Controls</span>
          <small>{selectedMeta.label}</small>
        </div>
        <div className="controls-scroll">
          <section className="controls-section">
            <h2>Props</h2>
            <ControlField label={selectedKind === "input" ? "Label" : "Text"}>
              <input
                onChange={(event) => updateConfig({ text: event.target.value })}
                value={config.text}
              />
            </ControlField>
            {selectedKind === "card" && (
              <ControlField label="Description">
                <textarea
                  onChange={(event) =>
                    updateConfig({ detail: event.target.value })
                  }
                  rows={3}
                  value={config.detail}
                />
              </ControlField>
            )}
            {selectedKind === "input" && (
              <ControlField label="Placeholder">
                <input
                  onChange={(event) =>
                    updateConfig({ placeholder: event.target.value })
                  }
                  value={config.placeholder}
                />
              </ControlField>
            )}
            {(selectedKind === "text" || selectedKind === "button") && (
              <ControlField
                label={selectedKind === "text" ? "Style" : "Variant"}
              >
                <select
                  onChange={(event) =>
                    updateConfig({
                      variant: event.target.value as ComponentVariant,
                    })
                  }
                  value={config.variant}
                >
                  {selectedKind === "text" ? (
                    <>
                      <option value="default">Default</option>
                      <option value="heading">Heading</option>
                      <option value="small">Small</option>
                    </>
                  ) : (
                    <>
                      <option value="primary">Primary</option>
                      <option value="secondary">Secondary</option>
                    </>
                  )}
                </select>
              </ControlField>
            )}
          </section>

          <section className="controls-section">
            <h2>Spacing</h2>
            <div className="spacing-inputs">
              <ControlField label="Horizontal">
                <div className="number-input">
                  <input
                    max="96"
                    min="0"
                    onChange={(event) =>
                      updateConfig({
                        paddingX: clampSpacing(Number(event.target.value)),
                      })
                    }
                    step="4"
                    type="number"
                    value={Math.round(config.paddingX)}
                  />
                  <span>px</span>
                </div>
              </ControlField>
              <ControlField label="Vertical">
                <div className="number-input">
                  <input
                    max="96"
                    min="0"
                    onChange={(event) =>
                      updateConfig({
                        paddingY: clampSpacing(Number(event.target.value)),
                      })
                    }
                    step="4"
                    type="number"
                    value={Math.round(config.paddingY)}
                  />
                  <span>px</span>
                </div>
              </ControlField>
            </div>
            {(selectedKind === "card" || selectedKind === "input") && (
              <ControlField label="Content gap">
                <div className="number-input">
                  <input
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
            <p className="controls-note">
              Handles preview freely and commit to the {SNAP_GRID}px spacing
              grid.
            </p>
          </section>

          <section className="controls-section">
            <h2>Theme</h2>
            <ControlField label="Accent">
              <div className="color-input">
                <input
                  onChange={(event) => setAccent(event.target.value)}
                  type="color"
                  value={accent}
                />
                <code>{accent}</code>
              </div>
            </ControlField>
          </section>

          <section className="controls-section controls-section--output">
            <h2>Output</h2>
            <code>{componentClasses(selectedKind, config.variant)}</code>
            <span>No component runtime</span>
          </section>
        </div>

        <section aria-label="Live CSS file" className="css-file-panel">
          <header>
            <div>
              <span>CSS file</span>
              <strong>DS1/1-root/one.css</strong>
            </div>
            <span className="file-status">
              <i /> Live change
            </span>
          </header>
          <pre data-testid="live-css-source">
            <code>
              {cssSource.split("\n").map((line, index) => (
                <span className="css-source-line" key={`${index}-${line}`}>
                  <b>{index + 1}</b>
                  <span>{line || " "}</span>
                </span>
              ))}
            </code>
          </pre>
          <footer>
            <span>Previewing</span>
            <code>{componentSelector(selectedKind, config.variant)}</code>
          </footer>
        </section>
      </aside>

      {exportOpen && (
        <div
          className="export-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setExportOpen(false);
          }}
        >
          <section
            aria-labelledby="export-title"
            aria-modal="true"
            className="export-dialog"
            role="dialog"
          >
            <header>
              <div>
                <span>Generated component</span>
                <h2 id="export-title">
                  {selectedMeta.label} / {currentStory}
                </h2>
              </div>
              <button
                aria-label="Close export"
                onClick={() => setExportOpen(false)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="export-summary">
              <span>
                <i /> Native HTML
              </span>
              <span>
                <i /> one.css
              </span>
              <span>
                <i /> No runtime JavaScript
              </span>
            </div>
            <pre>
              <code>{exportedHtml}</code>
            </pre>
            <footer>
              <button
                className="action-button"
                onClick={downloadExport}
                type="button"
              >
                Download .html
              </button>
              <button
                className="action-button action-button--primary"
                onClick={copyExport}
                type="button"
              >
                {copyLabel}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
