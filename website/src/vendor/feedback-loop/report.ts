/**
 * Report: a person testing a product says what is wrong with what is in front
 * of them, and it lands in System → Issues as its own issue. Unlike the rest of
 * the Feedback loop, a Report is words a person chose to send the owner, so its
 * note, the words of what it points at and who sent it are kept.
 *
 * The browser never posts to System: the product's own server checks who is
 * signed in, names them, and sends the report on with its token
 * (`POST https://system.0001.dev/api/feedback/report/<product>`,
 * `Authorization: Bearer <token>`). This file is the one validator the
 * product's server and System's Worker share, and how a report is filed.
 */

export const REPORT_LIMITS = { note: 4000, about: 300, by: 120, path: 500, version: 40, bytes: 16_000 } as const;
export const REPORT_ID = /^[A-Za-z0-9_-]{8,40}$/;

/** What the browser sends its product's server: the note and where it was made. */
export interface ReportDraft {
  /** The report's own id, drawn in the browser, so a retry is one report. */
  id: string;
  /** What is wrong, in the person's words. */
  note: string;
  /** The page's path, or a workspace site's host and path (`flavo.using.link/`), without query or fragment. */
  path: string;
  /** What was pointed at: the words of the element pressed or under the pointer, or its name. */
  about: string | null;
  /** The screen it was seen on. */
  screen: { width: number; height: number; touch: boolean } | null;
  /** The product's build, when it says. */
  version: string | null;
}

/** What the product's server sends System: the draft, with who sent it and when. */
export interface Report extends ReportDraft {
  /** Who sent it, as the product knows them: an editor's address, a person's name. */
  by: string;
  at: number;
}

const words = (value: unknown, name: string, max: number, required = false): string | null => {
  if (value === undefined || value === null || value === '') { if (required) throw new Error(`${name} is required`); return null; }
  if (typeof value !== 'string') throw new Error(`${name} must be text`);
  const trimmed = value.replace(/\r\n?/g, '\n').trim();
  if (required && !trimmed) throw new Error(`${name} is required`);
  if (trimmed.length > max) throw new Error(`${name} is too long`);
  return trimmed || null;
};
const size = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100_000 ? Math.round(value) : 0);

/** Checks a draft from the browser: an id, a note, a path, and what it points at. */
export function parseReportDraft(value: unknown): ReportDraft {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('A report must be an object');
  const given = value as Record<string, unknown>;
  if (typeof given.id !== 'string' || !REPORT_ID.test(given.id)) throw new Error('A report needs its id');
  const path = words(given.path, 'The page', REPORT_LIMITS.path, true)!;
  if (/[?#\s]/.test(path)) throw new Error('The page is a path only');
  const screen = given.screen && typeof given.screen === 'object' ? given.screen as Record<string, unknown> : null;
  return {
    id: given.id,
    note: words(given.note, 'The note', REPORT_LIMITS.note, true)!,
    path,
    about: words(given.about, 'What it is about', REPORT_LIMITS.about)?.replace(/\s+/g, ' ') ?? null,
    screen: screen ? { width: size(screen.width), height: size(screen.height), touch: screen.touch === true } : null,
    version: words(given.version, 'The version', REPORT_LIMITS.version),
  };
}

/** Checks a report from a product's server: a draft, who sent it and when (never later than now). */
export function parseReport(value: unknown, now = Date.now()): Report {
  const draft = parseReportDraft(value);
  const given = value as Record<string, unknown>;
  const at = typeof given.at === 'number' && Number.isFinite(given.at) && given.at > 0 ? Math.min(given.at, now) : now;
  return { ...draft, by: words(given.by, 'Who sent it', REPORT_LIMITS.by, true)!, at };
}

/** The issue's title: the note's first line, cut at a word within eighty characters. */
export function reportTitle(note: string): string {
  const line = note.split('\n').find(each => each.trim())?.trim() ?? note.trim();
  if (line.length <= 80) return line;
  const cut = line.slice(0, 80);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : 80).trimEnd()}…`;
}

/** What the issue keeps of it: the note, then what it points at and the screen, one a line. */
export function reportMessage(report: Pick<Report, 'note' | 'about' | 'screen' | 'version'>): string {
  const lines = [report.note];
  const facts: string[] = [];
  if (report.about) facts.push(`About: “${report.about}”`);
  if (report.screen && report.screen.width) facts.push(`Screen: ${report.screen.width} × ${report.screen.height}${report.screen.touch ? ', touch' : ''}`);
  if (report.version) facts.push(`Version: ${report.version}`);
  if (facts.length) lines.push('', ...facts);
  return lines.join('\n');
}

/** A report as an issue (issues.ts `IssueReport`): its own issue, keyed by its id, so two reports are never one. */
export function reportIssue(report: Report) {
  return { source: 'report', key: report.id, ref: report.id, title: reportTitle(report.note), message: reportMessage(report), at: report.at, by: report.by, path: report.path };
}
