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
  if (!/^[@\w][\w.@/-]*$/.test(name)) {
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

// =============================================================================
// SKILL.md frontmatter validation
// =============================================================================

/** Allowed top-level YAML fields in SKILL.md frontmatter */
const ALLOWED_FIELDS = new Set([
  "name", "description", "allowed-tools", "compatibility", "license", "metadata",
  // Extended fields used by skill-forge pipeline
  "version", "ingredients", "tags", "domain",
]) as ReadonlySet<string>;

/**
 * Validate SKILL.md content structure and frontmatter.
 *
 * Enforces Anthropic's official spec:
 *   - Required: name, description
 *   - Optional: allowed-tools, compatibility, license, metadata
 *   - name: kebab-case, a-z0-9- only, max 64 chars
 *   - description: max 1024 chars, non-empty
 *   - No XML angle brackets (security restriction)
 */
export function validateSkillContent(content: string): string[] {
  const errors: string[] = [];

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch || !fmMatch[1]) {
    errors.push("Missing YAML frontmatter (--- delimiters required)");
    return errors;
  }

  const fm: string = fmMatch[1];

  // Security: no XML angle brackets anywhere in frontmatter
  if (/<|>/.test(fm)) {
    errors.push("XML angle brackets found in frontmatter (security violation)");
  }

  // name field: required, kebab-case only
  const nameMatch = fm.match(/^name:\s*["']?(.+?)["']?\s*$/m);
  if (!nameMatch || !nameMatch[1]) {
    errors.push("Missing 'name' field in frontmatter");
  } else {
    const name = nameMatch[1].replace(/^["']|["']$/g, "").trim();
    if (/[^a-z0-9-]/.test(name)) {
      errors.push(`name "${name}" has invalid chars -- must be kebab-case [a-z0-9-] only`);
    }
    if (name.length > 64) {
      errors.push(`name "${name}" exceeds 64 chars (${name.length})`);
    }
    if (name.length === 0) {
      errors.push("name is empty");
    }
  }

  // description field: required, max 1024 chars
  const descQuoted  = fm.match(/^description:\s*"([\s\S]*?)"\s*$/m)?.[1] ?? "";
  const descSingle  = fm.match(/^description:\s*'([\s\S]*?)'\s*$/m)?.[1] ?? "";
  const descRaw     = fm.match(/^description:\s*([^"'][^\n]*?)\s*$/m)?.[1] ?? "";
  const descValue   = (descQuoted || descSingle || descRaw).trim();

  if (!descValue) {
    errors.push("Missing or empty 'description' field");
  } else if (descValue.length > 1024) {
    errors.push(`description exceeds 1024 chars (${descValue.length})`);
  }

  // Warn on unexpected top-level YAML fields
  for (const line of fm.split("\n")) {
    const field = line.match(/^([a-z][\w-]*):/)?.[1];
    if (field && !ALLOWED_FIELDS.has(field)) {
      errors.push(`Unexpected YAML field: "${field}" (allowed: ${[...ALLOWED_FIELDS].join(", ")})`);
    }
  }

  return errors;
}

/**
 * Validates all fields in the extended frontmatter spec.
 * Includes allowed-tools, compatibility, license, and metadata.
 */
export function validateFullFrontmatter(content: string): string[] {
  const errors = validateSkillContent(content); // base validation

  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch || !fmMatch[1]) return errors;

  const fm: string = fmMatch[1];

  // allowed-tools: space-separated tool specs (e.g. "Bash(npm:*) Bash(npx:*)")
  const allowedToolsMatch = fm.match(/^allowed-tools:\s*["']?(.+?)["']?\s*$/m);
  if (allowedToolsMatch && allowedToolsMatch[1]) {
    const val = allowedToolsMatch[1].trim();
    if (val.length === 0) {
      errors.push("allowed-tools is empty -- omit field or provide tool specs");
    }
    // Basic format check: each spec should be a word optionally followed by (...)
    const specs = val.split(/\s+/);
    for (const spec of specs) {
      if (!/^[A-Za-z][A-Za-z0-9_]*(\([^)]*\))?$/.test(spec)) {
        errors.push(`allowed-tools spec "${spec}" has invalid format (expected: ToolName or ToolName(filter))`);
      }
    }
  }

  // compatibility: 1-500 chars
  const compatMatch = fm.match(/^compatibility:\s*["']?(.+?)["']?\s*$/m);
  if (compatMatch && compatMatch[1]) {
    const val = compatMatch[1].trim();
    if (val.length > 500) {
      errors.push(`compatibility exceeds 500 chars (${val.length})`);
    }
  }

  // license: should be a known SPDX identifier
  const licenseMatch = fm.match(/^license:\s*["']?(.+?)["']?\s*$/m);
  if (licenseMatch && licenseMatch[1]) {
    const val = licenseMatch[1].trim();
    if (val.length === 0) {
      errors.push("license is empty");
    }
  }

  // metadata: must be a YAML block (we just check it starts the block)
  if (fm.includes("metadata:")) {
    const metaBlock = fm.match(/^metadata:\n((?:  [^\n]*\n?)*)/m)?.[1];
    if (!metaBlock || metaBlock.trim().length === 0) {
      errors.push("metadata block is empty -- omit field or provide key-value pairs");
    }
  }

  return errors;
}
