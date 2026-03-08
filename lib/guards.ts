/**
 * Input hardening — defense-in-depth against agent hallucinations.
 *
 * Agents hallucinate in specific, predictable ways: path traversals,
 * embedded query parameters, double-encoded strings, and control characters.
 * Each requires a distinct validation strategy.
 *
 * "The agent is not a trusted operator." — validate at the CLI boundary.
 */

/** Reject strings containing ASCII control characters (below 0x20 except \t \n \r) */
export function rejectControlChars(input: string, label: string): void {
  // Allow tab (0x09), newline (0x0A), carriage return (0x0D)
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
    throw new InputValidationError(
      `${label} contains control characters — this is likely a hallucination`,
      "CONTROL_CHARS",
    );
  }
}

/** Reject path traversal attempts (../../ etc) */
export function rejectPathTraversal(input: string, label: string): void {
  if (input.includes("..") || input.includes("~/.") || /^[/\\]/.test(input)) {
    // Allow absolute paths when they're expected (e.g., local source)
    if (/^[/\\]/.test(input) && !input.includes("..")) return;
    throw new InputValidationError(
      `${label} contains path traversal ("..") — blocked for safety`,
      "PATH_TRAVERSAL",
    );
  }
}

/** Reject resource IDs with embedded query params (? or #) */
export function rejectEmbeddedParams(input: string, label: string): void {
  if (/[?#]/.test(input)) {
    throw new InputValidationError(
      `${label} contains "?" or "#" — this looks like an embedded URL, not a resource ID`,
      "EMBEDDED_PARAMS",
    );
  }
}

/** Reject percent-encoded strings (prevent double-encoding attacks) */
export function rejectPercentEncoding(input: string, label: string): void {
  if (/%[0-9a-fA-F]{2}/.test(input)) {
    throw new InputValidationError(
      `${label} contains percent-encoding — provide raw values, encoding is handled internally`,
      "PERCENT_ENCODING",
    );
  }
}

/** Validate a tool source identifier (GitHub owner/repo, npm package, or local path) */
export function validateSource(source: string): void {
  rejectControlChars(source, "Source");
  // Don't reject % or ? for URLs, but do for owner/repo and npm formats
  if (!source.startsWith("http://") && !source.startsWith("https://")) {
    rejectEmbeddedParams(source, "Source");
    rejectPercentEncoding(source, "Source");
  }
}

/** Validate a tool name/ID */
export function validateToolName(name: string): void {
  rejectControlChars(name, "Tool name");
  rejectPathTraversal(name, "Tool name");
  rejectEmbeddedParams(name, "Tool name");
  if (!/^[\w][\w.@/-]*$/.test(name)) {
    throw new InputValidationError(
      `Tool name "${name}" contains invalid characters`,
      "INVALID_NAME",
    );
  }
}

/** Validate arguments passed to a tool (best-effort — we can't predict all valid args) */
export function validateRunArgs(args: readonly string[]): void {
  for (const arg of args) {
    rejectControlChars(arg, "Argument");
  }
}

/** Structured validation error with a machine-readable code */
export class InputValidationError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "InputValidationError";
    this.code = code;
  }
}
