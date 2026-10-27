export type IssueCode =
  | "foundation_constraint"
  | "empty"
  | "too_large"
  | "control_characters"
  | "parse_error"
  | "unknown_at_rule"
  | "charset_position"
  | "too_many_imports"
  | "disallowed_import_host"
  | "disallowed_url_host"
  | "unresolvable_url"
  | "data_url_too_large"
  | "data_url_type"
  | "disallowed_construct";

export type Severity = "error" | "warning";

export interface Issue {
  code: IssueCode;
  message: string;
  severity: Severity;
  /** 1-based, when the issue is anchored to a position in the source. */
  line?: number;
  /** 1-based. */
  column?: number;
  /** 0-based byte offset into the BOM-stripped source. */
  offset?: number;
  /** The offending fragment, truncated for display. */
  detail?: string;
}

export interface ValidateOptions {
  /** UTF-8 byte ceiling. Default 512 KiB. */
  maxBytes?: number;
  /** Hosts an absolute https URL may point at. Default {@link DEFAULT_ALLOWED_HOSTS}. */
  allowedHosts?: readonly string[];
  /** Default true. */
  allowDataUrls?: boolean;
  /** Byte ceiling for a single data: URL. Default 64 KiB. */
  maxDataUrlBytes?: number;
  /** Default 5. */
  maxImports?: number;
  /** Emit a `too_large` warning above this. Default 128 KiB. */
  warnBytes?: number;
}

export interface ValidateResult {
  /** True when no issue has severity "error". */
  ok: boolean;
  issues: Issue[];
  /** UTF-8 byte length of the source. */
  byteSize: number;
  /** True when the issue list was capped. */
  truncated: boolean;
}

/** Beyond this the list is capped and `truncated` is set. */
export const MAX_ISSUES = 50;
