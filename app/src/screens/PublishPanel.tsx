import { validateCss, type Issue } from "@ds-one/css-validate";
import { useAction, useQuery } from "convex/react";
import { useMemo, useState } from "react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { downloadCss } from "../lib/download";

type Stage = "idle" | "publishing";

interface Props {
  libraryId: string;
  publicId: string;
  name: string;
  slug: string;
  css: string;
  draftRev: number;
  state: string;
  publishedVersion: number | null;
  installUrl: string | null;
  /** Sticky issues from the last failed publish, as stored JSON. */
  lastPublishError: string | null;
  onClose: () => void;
}

const STATE_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  "unpublished-changes": "Unpublished changes",
  "failed-validation": "Last publish failed",
  publishing: "Publishing",
  archived: "Archived",
};

function parseIssues(raw: string | null): Issue[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Issue[]) : [];
  } catch {
    return [];
  }
}

export function PublishPanel(props: Props) {
  const publish = useAction(api.publish.publish);
  const rollback = useAction(api.versions.rollback);
  const history = useQuery(api.versions.history, { id: props.libraryId as Id<"libraries"> });

  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  /**
   * Client-side validation is advisory — the deployment re-runs it and is
   * authoritative. A user on a cached bundle can legitimately disagree with the
   * server, which is exactly why server-returned issues render through this
   * same list rather than a separate error path.
   */
  const localIssues = useMemo(() => validateCss(props.css).issues, [props.css]);
  const [serverIssues, setServerIssues] = useState<Issue[] | null>(null);

  const issues = serverIssues ?? (localIssues.length > 0 ? localIssues : parseIssues(props.lastPublishError));
  const blocking = issues.filter((issue) => issue.severity === "error");

  const snippet = props.installUrl
    ? `<link rel="stylesheet" href="${props.installUrl}">`
    : null;

  async function onPublish() {
    setStage("publishing");
    setError(null);
    setServerIssues(null);

    try {
      await publish({ id: props.libraryId as Id<"libraries">, baseRev: props.draftRev });
    } catch (caught) {
      const data = (caught as { data?: { code?: string; message?: string; details?: { issues?: string } } }).data;

      if (data?.code === "validation_failed" && data.details?.issues) {
        setServerIssues(parseIssues(data.details.issues));
      }
      setError(data?.message ?? "Publishing failed.");
    } finally {
      setStage("idle");
    }
  }

  async function onCopy() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <aside className="publish-panel" data-testid="publish-panel">
      <header>
        <h2>Publish</h2>
        <button className="action-button" onClick={props.onClose} type="button">
          Close
        </button>
      </header>

      <p className="library-card__state" data-state={props.state} data-testid="state-pill">
        {STATE_LABEL[props.state] ?? props.state}
        {props.publishedVersion !== null ? ` · v${props.publishedVersion}` : ""}
      </p>

      {blocking.length > 0 ? (
        <section className="publish-issues">
          <h3>{blocking.length === 1 ? "1 problem" : `${blocking.length} problems`}</h3>
          <ul>
            {blocking.map((issue, index) => (
              <li data-testid="validation-issue" key={`${issue.code}-${index}`}>
                <code>{issue.code}</code>
                {issue.line !== undefined ? <span> line {issue.line}</span> : null}
                <p>{issue.message}</p>
                {issue.detail ? <small>{issue.detail}</small> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error && blocking.length === 0 ? (
        <p role="alert" data-testid="publish-error">
          {error}
        </p>
      ) : null}

      <button
        className="action-button action-button--primary"
        data-testid="publish-button"
        disabled={stage === "publishing" || blocking.length > 0}
        onClick={() => void onPublish()}
        type="button"
      >
        {stage === "publishing" ? "Publishing…" : "Publish"}
      </button>

      <section>
        <h3>Install</h3>
        {snippet ? (
          <>
            <pre data-testid="install-snippet">{snippet}</pre>
            <button className="action-button" data-testid="install-link" onClick={() => void onCopy()} type="button">
              {copied ? "Copied" : "Copy install link"}
            </button>
          </>
        ) : (
          // A copied link to a 404 is the obvious top support ticket.
          <p>Publish once to get an install link.</p>
        )}
      </section>

      <section>
        <h3>Download</h3>
        <button
          className="action-button"
          onClick={() => downloadCss(props.css, `${props.slug}-draft.css`)}
          type="button"
        >
          Download draft
        </button>
        {props.installUrl ? (
          <button
            className="action-button"
            onClick={() => {
              // Fetched from the public URL, so it is byte-identical to what
              // customers receive rather than to what the editor happens to hold.
              void fetch(props.installUrl!)
                .then((response) => response.text())
                .then((text) => downloadCss(text, `${props.slug}-v${props.publishedVersion}.css`));
            }}
            type="button"
          >
            Download published
          </button>
        ) : null}
      </section>

      <section>
        <h3>History</h3>
        {history === undefined ? (
          <p>Loading…</p>
        ) : history.versions.length === 0 ? (
          <p>Nothing published yet.</p>
        ) : (
          <ol className="version-list" data-testid="version-list">
            {history.versions.map((version) => (
              <li key={version.version}>
                <div>
                  <strong>v{version.version}</strong>
                  {version.isLive ? <span className="version-live">Live</span> : null}
                  <small>{version.byteSize} bytes</small>
                </div>
                {!version.isLive && version.status === "published" ? (
                  <button
                    className="action-button"
                    data-testid={`rollback-${version.version}`}
                    onClick={() => {
                      if (!confirm(`Roll the live stylesheet back to v${version.version}?`)) return;
                      void rollback({
                        id: props.libraryId as Id<"libraries">,
                        version: version.version,
                      });
                    }}
                    type="button"
                  >
                    Roll back
                  </button>
                ) : null}
              </li>
            ))}
          </ol>
        )}

        {history?.events.some((event) => event.status === "failed") ? (
          <ul className="event-list" data-testid="failed-events">
            {history.events
              .filter((event) => event.status === "failed")
              .slice(0, 5)
              .map((event) => (
                <li key={event._id}>
                  Failed at {event.failureStage ?? "unknown"} ·{" "}
                  {new Date(event.startedAt).toLocaleString()}
                </li>
              ))}
          </ul>
        ) : null}
      </section>
    </aside>
  );
}
