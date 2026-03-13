/**
 * hooks/types.ts — Hook system type definitions for Claude Code plugins.
 *
 * Defines the 7 hook event types and associated configuration interfaces
 * conforming to the Claude Code hooks specification.
 */

// ── Hook event types ───────────────────────────────────────────────────

/** The 7 supported hook event types */
export type HookEvent =
  | "PreToolUse"
  | "PostToolUse"
  | "Stop"
  | "SessionStart"
  | "SubagentStart"
  | "SubagentStop"
  | "Notification";

/** A single hook matcher (tool pattern to match against) */
export interface HookMatcher {
  /** Tool name or glob pattern (e.g. "Bash", "Edit", "Bash(npm:*)") */
  tool_name?: string;
  /** Optional: only match when these tools are involved */
  tool_names?: string[];
}

/** A single hook definition within hooks.json */
export interface HookDefinition {
  /** Hook event type */
  type: HookEvent;
  /** Matchers — when to trigger this hook */
  matchers: HookMatcher[];
  /** Shell command or script to execute */
  command: string;
  /** Human-readable description */
  description?: string;
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
}

/** The hooks.json structure at plugin root */
export interface HooksJson {
  hooks: HookDefinition[];
}

// ── Domain hook configuration ──────────────────────────────────────────

/** Configuration for generating domain-specific hooks */
export interface DomainHookConfig {
  /** Domain identifier (e.g. "database", "python") */
  domain: string;
  /** PreToolUse: patterns to block */
  blockPatterns?: BlockPattern[];
  /** PostToolUse: validation commands */
  postValidations?: PostValidation[];
  /** Stop: quality gate checks */
  qualityGates?: QualityGate[];
  /** SessionStart: context injection commands */
  contextInjections?: ContextInjection[];
  /** Notification: alert triggers */
  alertTriggers?: AlertTrigger[];
}

/** A pattern that PreToolUse should block */
export interface BlockPattern {
  /** Regex pattern to match in tool input */
  pattern: string;
  /** Human-readable reason for blocking */
  reason: string;
  /** Tool names this applies to */
  tools: string[];
}

/** A post-tool validation command */
export interface PostValidation {
  /** Shell command to run after tool use */
  command: string;
  /** Description of what this validates */
  description: string;
  /** Tool names this applies to */
  tools: string[];
}

/** A quality gate check for the Stop hook */
export interface QualityGate {
  /** Shell command that must exit 0 */
  command: string;
  /** Description of what this checks */
  description: string;
}

/** Context to inject at session start */
export interface ContextInjection {
  /** Shell command whose output is injected */
  command: string;
  /** Label for the injected context */
  label: string;
}

/** An alert trigger for notifications */
export interface AlertTrigger {
  /** Condition description */
  condition: string;
  /** Alert message */
  message: string;
}

// ── Hook script metadata ───────────────────────────────────────────────

/** Metadata for a generated hook script */
export interface HookScript {
  /** Relative path within the plugin (e.g. "hooks/pre-tool-use.sh") */
  path: string;
  /** Script content */
  content: string;
  /** Whether the script should be executable */
  executable: boolean;
}

/** Result of hook generation for a domain */
export interface GeneratedHooks {
  /** The hooks.json content */
  hooksJson: HooksJson;
  /** Any supporting scripts */
  scripts: HookScript[];
}
