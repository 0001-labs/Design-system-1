import { type DragEvent, type ReactNode, useMemo, useState } from "react";

type ElementKind = "text" | "button" | "input" | "card";
type ElementVariant = "default" | "heading" | "small" | "primary" | "secondary";

type DesignElement = {
  id: string;
  kind: ElementKind;
  text: string;
  variant: ElementVariant;
  placeholder?: string;
  children?: DesignElement[];
};

const palette: Array<{
  kind: ElementKind;
  label: string;
  description: string;
}> = [
  { kind: "text", label: "Text", description: "Heading or paragraph" },
  { kind: "button", label: "Button", description: "Primary or secondary" },
  { kind: "input", label: "Input", description: "Native form control" },
  { kind: "card", label: "Card", description: "Container with children" },
];

const initialElements: DesignElement[] = [
  {
    id: "welcome-card",
    kind: "card",
    text: "Card",
    variant: "default",
    children: [
      {
        id: "welcome-heading",
        kind: "text",
        text: "Build with DS one",
        variant: "heading",
      },
      {
        id: "welcome-copy",
        kind: "text",
        text: "Compose native HTML and export a CSS-only interface.",
        variant: "default",
      },
      {
        id: "welcome-input",
        kind: "input",
        text: "Email",
        placeholder: "you@example.com",
        variant: "default",
      },
      {
        id: "welcome-button",
        kind: "button",
        text: "Get started",
        variant: "primary",
      },
    ],
  },
];

const createId = () =>
  globalThis.crypto?.randomUUID?.() ??
  `element-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function createElement(kind: ElementKind): DesignElement {
  const base = {
    id: createId(),
    kind,
    variant: "default" as ElementVariant,
    text: "",
  };

  if (kind === "text") {
    return { ...base, text: "New text" };
  }

  if (kind === "button") {
    return { ...base, text: "Button", variant: "primary" };
  }

  if (kind === "input") {
    return { ...base, text: "Label", placeholder: "Type here" };
  }

  return {
    ...base,
    text: "Card",
    children: [
      {
        id: createId(),
        kind: "text",
        text: "New card",
        variant: "heading",
      },
      {
        id: createId(),
        kind: "text",
        text: "Add content from the palette.",
        variant: "default",
      },
    ],
  };
}

function findElement(
  elements: DesignElement[],
  id: string | null,
): DesignElement | null {
  if (!id) return null;

  for (const element of elements) {
    if (element.id === id) return element;
    const child = findElement(element.children ?? [], id);
    if (child) return child;
  }

  return null;
}

function updateElement(
  elements: DesignElement[],
  id: string,
  patch: Partial<DesignElement>,
): DesignElement[] {
  return elements.map((element) => {
    if (element.id === id) return { ...element, ...patch };
    if (!element.children) return element;
    return {
      ...element,
      children: updateElement(element.children, id, patch),
    };
  });
}

function removeElement(elements: DesignElement[], id: string): DesignElement[] {
  return elements
    .filter((element) => element.id !== id)
    .map((element) => ({
      ...element,
      children: element.children
        ? removeElement(element.children, id)
        : undefined,
    }));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function elementToHtml(element: DesignElement, depth = 2): string {
  const indent = "  ".repeat(depth);
  const text = escapeHtml(element.text);

  if (element.kind === "text") {
    const variant =
      element.variant === "heading"
        ? " ds-text--heading"
        : element.variant === "small"
          ? " ds-text--small"
          : "";
    const tag = element.variant === "heading" ? "h2" : "p";
    return `${indent}<${tag} class="ds-text${variant}">${text}</${tag}>`;
  }

  if (element.kind === "button") {
    const variant =
      element.variant === "secondary"
        ? "ds-button--secondary"
        : "ds-button--primary";
    return `${indent}<button class="ds-button ${variant}" type="button">${text}</button>`;
  }

  if (element.kind === "input") {
    return [
      `${indent}<label class="ds-text" for="${element.id}">${text}</label>`,
      `${indent}<input class="ds-input" id="${element.id}" type="text" placeholder="${escapeHtml(element.placeholder ?? "")}" />`,
    ].join("\n");
  }

  const children = (element.children ?? [])
    .map((child) => elementToHtml(child, depth + 1))
    .join("\n");
  return [
    `${indent}<section class="ds-card">`,
    children,
    `${indent}</section>`,
  ].join("\n");
}

function buildExport(elements: DesignElement[], accent: string) {
  const content = elements.map((element) => elementToHtml(element)).join("\n");

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
      :root { --accent-color: ${accent}; }
      body { padding: 40px; background: var(--background); color: var(--text-color); }
      .ds-page { width: min(100%, 640px); margin: 0 auto; display: grid; gap: 20px; }
      .ds-card { display: grid; gap: 12px; }
    </style>
    <title>DS one page</title>
  </head>
  <body>
    <main class="ds-page">
${content}
    </main>
  </body>
</html>`;
}

function ElementPreview({
  element,
  selectedId,
  onSelect,
  onDropIntoCard,
}: {
  element: DesignElement;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropIntoCard: (cardId: string, kind: ElementKind) => void;
}) {
  const selected = selectedId === element.id;
  const shared = {
    onClick: (event: React.MouseEvent) => {
      event.stopPropagation();
      onSelect(element.id);
    },
  };

  let content: ReactNode;

  if (element.kind === "text") {
    const className = `ds-text${
      element.variant === "heading"
        ? " ds-text--heading"
        : element.variant === "small"
          ? " ds-text--small"
          : ""
    }`;
    content =
      element.variant === "heading" ? (
        <h2 className={className}>{element.text}</h2>
      ) : (
        <p className={className}>{element.text}</p>
      );
  } else if (element.kind === "button") {
    content = (
      <button
        className={`ds-button ${
          element.variant === "secondary"
            ? "ds-button--secondary"
            : "ds-button--primary"
        }`}
        type="button"
      >
        {element.text}
      </button>
    );
  } else if (element.kind === "input") {
    content = (
      <div className="studio-field">
        <label className="ds-text" htmlFor={`preview-${element.id}`}>
          {element.text}
        </label>
        <input
          className="ds-input"
          id={`preview-${element.id}`}
          placeholder={element.placeholder}
          readOnly
        />
      </div>
    );
  } else {
    content = (
      <section
        className="ds-card studio-card"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.stopPropagation();
          const kind = event.dataTransfer.getData(
            "application/x-ds-one-kind",
          ) as ElementKind;
          if (kind) onDropIntoCard(element.id, kind);
        }}
      >
        {(element.children ?? []).map((child) => (
          <ElementPreview
            element={child}
            key={child.id}
            onDropIntoCard={onDropIntoCard}
            onSelect={onSelect}
            selectedId={selectedId}
          />
        ))}
        <div className="studio-card-drop">Drop components into this card</div>
      </section>
    );
  }

  return (
    <div
      className={`studio-element${selected ? " is-selected" : ""}`}
      data-kind={element.kind}
      draggable
      onDragStart={(event) => {
        event.stopPropagation();
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-ds-one-id", element.id);
      }}
      {...shared}
    >
      <span className="studio-element-label">{element.kind}</span>
      {content}
    </div>
  );
}

export function App() {
  const [elements, setElements] = useState(initialElements);
  const [selectedId, setSelectedId] = useState<string | null>(
    "welcome-heading",
  );
  const [accent, setAccent] = useState("#99ff73");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [exportOpen, setExportOpen] = useState(false);
  const [copyLabel, setCopyLabel] = useState("Copy HTML");

  const selected = useMemo(
    () => findElement(elements, selectedId),
    [elements, selectedId],
  );
  const exportedHtml = useMemo(
    () => buildExport(elements, accent),
    [elements, accent],
  );

  const addAtRoot = (kind: ElementKind) => {
    const next = createElement(kind);
    setElements((current) => [...current, next]);
    setSelectedId(next.id);
  };

  const addToCard = (cardId: string, kind: ElementKind) => {
    const card = findElement(elements, cardId);
    if (!card || card.kind !== "card") return;
    const next = createElement(kind);
    setElements((current) =>
      updateElement(current, cardId, {
        children: [...(card.children ?? []), next],
      }),
    );
    setSelectedId(next.id);
  };

  const reorderRoot = (draggedId: string, targetId?: string) => {
    const sourceIndex = elements.findIndex(
      (element) => element.id === draggedId,
    );
    if (sourceIndex < 0) return;

    const next = [...elements];
    const [dragged] = next.splice(sourceIndex, 1);
    const targetIndex = targetId
      ? next.findIndex((element) => element.id === targetId)
      : next.length;
    next.splice(targetIndex < 0 ? next.length : targetIndex, 0, dragged);
    setElements(next);
  };

  const updateSelected = (patch: Partial<DesignElement>) => {
    if (!selectedId) return;
    setElements((current) => updateElement(current, selectedId, patch));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements((current) => removeElement(current, selectedId));
    setSelectedId(null);
  };

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
    link.download = "ds-one-page.html";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="studio-shell"
      style={{ "--studio-accent": accent } as React.CSSProperties}
    >
      <header className="studio-header">
        <div>
          <span className="studio-kicker">Visual CSS composer</span>
          <strong>DS one app</strong>
        </div>
        <div className="studio-header-actions">
          <span className="studio-runtime-status">
            <i /> CSS-only output
          </span>
          <button
            className="studio-action studio-action--primary"
            onClick={() => setExportOpen(true)}
            type="button"
          >
            Export HTML
          </button>
        </div>
      </header>

      <aside className="studio-panel studio-palette">
        <div className="studio-panel-heading">
          <span>Components</span>
          <small>Drag to canvas</small>
        </div>
        <div className="studio-palette-list">
          {palette.map((item) => (
            <button
              className="studio-palette-item"
              draggable
              key={item.kind}
              onClick={() => addAtRoot(item.kind)}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "copy";
                event.dataTransfer.setData(
                  "application/x-ds-one-kind",
                  item.kind,
                );
              }}
              type="button"
            >
              <span className={`studio-component-mark mark-${item.kind}`} />
              <span>
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              <b>+</b>
            </button>
          ))}
        </div>
        <div className="studio-palette-note">
          Components use the same classes shown in the exported HTML.
        </div>
      </aside>

      <main className="studio-workspace">
        <div className="studio-workspace-toolbar">
          <div className="studio-breadcrumb">
            Page <span>/</span> Canvas
          </div>
          <div className="studio-viewport-toggle" aria-label="Preview width">
            <button
              aria-pressed={viewport === "desktop"}
              onClick={() => setViewport("desktop")}
              type="button"
            >
              Desktop
            </button>
            <button
              aria-pressed={viewport === "mobile"}
              onClick={() => setViewport("mobile")}
              type="button"
            >
              Mobile
            </button>
          </div>
        </div>

        <div className="studio-canvas-stage">
          <div
            className={`studio-canvas is-${viewport}`}
            onClick={() => setSelectedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const kind = event.dataTransfer.getData(
                "application/x-ds-one-kind",
              ) as ElementKind;
              const id = event.dataTransfer.getData("application/x-ds-one-id");
              if (kind) addAtRoot(kind);
              else if (id) reorderRoot(id);
            }}
          >
            {elements.map((element) => (
              <div
                key={element.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  const id = event.dataTransfer.getData(
                    "application/x-ds-one-id",
                  );
                  if (id && id !== element.id) {
                    event.preventDefault();
                    event.stopPropagation();
                    reorderRoot(id, element.id);
                  }
                }}
              >
                <ElementPreview
                  element={element}
                  onDropIntoCard={addToCard}
                  onSelect={setSelectedId}
                  selectedId={selectedId}
                />
              </div>
            ))}
            {elements.length === 0 && (
              <div className="studio-empty">
                <strong>Empty canvas</strong>
                <span>Drag a component here to begin.</span>
              </div>
            )}
          </div>
        </div>
      </main>

      <aside className="studio-panel studio-inspector">
        <div className="studio-panel-heading">
          <span>Inspector</span>
          <small>{selected ? selected.kind : "Nothing selected"}</small>
        </div>

        {selected ? (
          <div className="studio-inspector-form">
            {selected.kind !== "card" && (
              <label>
                <span>{selected.kind === "input" ? "Label" : "Text"}</span>
                <input
                  onChange={(event) =>
                    updateSelected({ text: event.target.value })
                  }
                  value={selected.text}
                />
              </label>
            )}

            {selected.kind === "input" && (
              <label>
                <span>Placeholder</span>
                <input
                  onChange={(event) =>
                    updateSelected({ placeholder: event.target.value })
                  }
                  value={selected.placeholder ?? ""}
                />
              </label>
            )}

            {selected.kind === "text" && (
              <label>
                <span>Style</span>
                <select
                  onChange={(event) =>
                    updateSelected({
                      variant: event.target.value as ElementVariant,
                    })
                  }
                  value={selected.variant}
                >
                  <option value="default">Default</option>
                  <option value="heading">Heading</option>
                  <option value="small">Small</option>
                </select>
              </label>
            )}

            {selected.kind === "button" && (
              <label>
                <span>Variant</span>
                <select
                  onChange={(event) =>
                    updateSelected({
                      variant: event.target.value as ElementVariant,
                    })
                  }
                  value={selected.variant}
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                </select>
              </label>
            )}

            <div className="studio-code-chip">
              <span>Output class</span>
              <code>
                {selected.kind === "button"
                  ? `ds-button ds-button--${selected.variant}`
                  : `ds-${selected.kind}`}
              </code>
            </div>

            <button
              className="studio-delete"
              onClick={deleteSelected}
              type="button"
            >
              Delete element
            </button>
          </div>
        ) : (
          <div className="studio-inspector-empty">
            Select an element on the canvas to edit its content and variant.
          </div>
        )}

        <div className="studio-theme-editor">
          <div className="studio-panel-heading">
            <span>Theme</span>
            <small>CSS variable</small>
          </div>
          <label>
            <span>Accent</span>
            <input
              onChange={(event) => setAccent(event.target.value)}
              type="color"
              value={accent}
            />
            <code>{accent}</code>
          </label>
        </div>
      </aside>

      {exportOpen && (
        <div
          className="studio-export-backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setExportOpen(false);
          }}
        >
          <section
            aria-labelledby="export-title"
            aria-modal="true"
            className="studio-export"
            role="dialog"
          >
            <header>
              <div>
                <span className="studio-kicker">Generated artifact</span>
                <h2 id="export-title">CSS-only HTML</h2>
              </div>
              <button
                aria-label="Close export"
                onClick={() => setExportOpen(false)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="studio-export-summary">
              <span>
                <i /> No React
              </span>
              <span>
                <i /> No runtime JavaScript
              </span>
              <span>
                <i /> Native HTML
              </span>
            </div>
            <pre>
              <code>{exportedHtml}</code>
            </pre>
            <footer>
              <button
                className="studio-action"
                onClick={downloadExport}
                type="button"
              >
                Download .html
              </button>
              <button
                className="studio-action studio-action--primary"
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
