import { validateCss, type Issue } from "@ds-one/css-validate";
import { useAction, useQuery } from "convex/react";
import { useMemo, useState } from "react";

import { api } from "../../../convex/_generated/api";
import "../../../DS1/1-root/controls.css";
import "../../../DS1/2-core/ds-badge";
import "../../../DS1/2-core/ds-button";
import "../../../DS1/2-core/ds-empty";
import "../../../DS1/2-core/ds-notice";
import "../../../DS1/3-unit/ds-list";
import "../../../DS1/3-unit/ds-row";
import "../../../DS1/4-page/ds-panel";
import { confirm, copyText } from "../../../DS1/0-face/feedback";
import { formatDateTime } from "../../../DS1/0-face/format";
import { Badge } from "../../../DS1/react/badge";
import { Button } from "../../../DS1/react/button";
import { Empty } from "../../../DS1/react/empty";
import { LoadingIndicator } from "../../../DS1/react/loading";
import { Notice } from "../../../DS1/react/notice";
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

  async function onRollback(version: number) {
    const sure = await confirm({
      title: `Roll back to v${version}?`,
      text: "The live stylesheet goes back to this version. Every version stays published at its own address.",
      confirm: "Roll back",
    });
    if (!sure) return;
    void rollback({ id: props.libraryId as Id<"libraries">, version });
  }

  return (
    <ds-panel className="publish-panel" data-testid="publish-panel">
      <ds-row slot="header" fill>
        <h2 className="ds-text ds-text--heading">Publish</h2>
        <Button secondary onClick={props.onClose} type="button">
          Close
        </Button>
      </ds-row>

      <Badge className="library-card__state" data-state={props.state} data-testid="state-pill">
        {STATE_LABEL[props.state] ?? props.state}
        {props.publishedVersion !== null ? ` · v${props.publishedVersion}` : ""}
      </Badge>

      {blocking.length > 0 ? (
        <section className="publish-issues">
          <h3 className="ds-text ds-text--danger">{blocking.length === 1 ? "1 problem" : `${blocking.length} problems`}</h3>
          <ds-list role="list">
            {blocking.map((issue, index) => (
              <ds-row auto role="listitem" data-testid="validation-issue" key={`${issue.code}-${index}`}>
                <div>
                  <p className="ds-text ds-text--small"><code>{issue.code}</code>{issue.line !== undefined ? <span className="ds-text--muted"> line {issue.line}</span> : null}</p>
                  <p className="ds-text">{issue.message}</p>
                  {issue.detail ? <p className="ds-text ds-text--small ds-text--muted">{issue.detail}</p> : null}
                </div>
              </ds-row>
            ))}
          </ds-list>
        </section>
      ) : null}

      {error && blocking.length === 0 ? (
        <Notice tone="danger" data-testid="publish-error">
          {error}
        </Notice>
      ) : null}

      <Button
        primary
        data-testid="publish-button"
        disabled={stage === "publishing" || blocking.length > 0}
        onClick={() => void onPublish()}
        type="button"
      >
        {stage === "publishing" ? "Publishing…" : "Publish"}
      </Button>

      <section>
        <h3 className="ds-text ds-text--muted">Install</h3>
        {snippet ? (
          <>
            <pre data-testid="install-snippet">{snippet}</pre>
            <Button secondary data-testid="install-link" onClick={() => void copyText(snippet)} type="button">
              Copy install link
            </Button>
          </>
        ) : (
          // A copied link to a 404 is the obvious top support ticket.
          <Empty heading="No install link yet" text="Publish once to get an install link." />
        )}
      </section>

      <section>
        <h3 className="ds-text ds-text--muted">Download</h3>
        <ds-row>
          <Button
            secondary
            onClick={() => downloadCss(props.css, `${props.slug}-draft.css`)}
            type="button"
          >
            Download draft
          </Button>
          {props.installUrl ? (
            <Button
              secondary
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
            </Button>
          ) : null}
        </ds-row>
      </section>

      <section>
        <h3 className="ds-text ds-text--muted">History</h3>
        {history === undefined ? (
          <LoadingIndicator label="Loading the history" />
        ) : history.versions.length === 0 ? (
          <Empty heading="Nothing published yet" text="Each version you publish is listed here." />
        ) : (
          <ds-list role="list" className="version-list" data-testid="version-list">
            {history.versions.map((version) => (
              <ds-row fill role="listitem" key={version.version}>
                <ds-row>
                  <strong className="ds-text ds-text--strong">v{version.version}</strong>
                  {version.isLive ? <Badge className="version-live">Live</Badge> : null}
                  <span className="ds-text ds-text--small ds-text--muted">{version.byteSize} bytes</span>
                </ds-row>
                {!version.isLive && version.status === "published" ? (
                  <Button
                    secondary
                    data-testid={`rollback-${version.version}`}
                    onClick={() => void onRollback(version.version)}
                    type="button"
                  >
                    Roll back
                  </Button>
                ) : null}
              </ds-row>
            ))}
          </ds-list>
        )}

        {history?.events.some((event) => event.status === "failed") ? (
          <ds-list role="list" className="event-list" data-testid="failed-events">
            {history.events
              .filter((event) => event.status === "failed")
              .slice(0, 5)
              .map((event) => (
                <ds-row role="listitem" key={event._id}>
                  <span className="ds-text ds-text--small ds-text--danger">
                    Failed at {event.failureStage ?? "unknown"} · {formatDateTime(event.startedAt)}
                  </span>
                </ds-row>
              ))}
          </ds-list>
        ) : null}
      </section>
    </ds-panel>
  );
}
