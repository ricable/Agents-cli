/**
 * hooks/validator.ts — Validate hooks.json structure and hook scripts.
 *
 * Ensures hooks.json conforms to the Claude Code hooks specification
 * and that hook scripts are well-formed shell scripts.
 */

import type { HooksJson, HookEvent } from "./types.js";

// ── Valid hook events ──────────────────────────────────────────────────

const VALID_EVENTS = new Set<HookEvent>([
  "PreToolUse",
  "PostToolUse",
  "Stop",
  "SessionStart",
  "SubagentStart",
  "SubagentStop",
  "Notification",
]);

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Validate a hooks.json string. Returns an array of error messages.
 * Empty array means valid.
 */
export function validateHooksJson(content: string): string[] {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    errors.push(`Invalid JSON: ${e instanceof Error ? e.message : String(e)}`);
    return errors;
  }

  if (typeof parsed !== "object" || parsed === null) {
    errors.push("hooks.json must be a JSON object");
    return errors;
  }

  const obj = parsed as Record<string, unknown>;

  if (!Array.isArray(obj.hooks)) {
    errors.push('hooks.json must have a "hooks" array');
    return errors;
  }

  for (let i = 0; i < obj.hooks.length; i++) {
    const hook = obj.hooks[i] as Record<string, unknown>;
    const prefix = `hooks[${i}]`;

    // type field
    if (typeof hook.type !== "string") {
      errors.push(`${prefix}: missing or invalid "type" field`);
    } else if (!VALID_EVENTS.has(hook.type as HookEvent)) {
      errors.push(`${prefix}: unknown event type "${hook.type}" (valid: ${[...VALID_EVENTS].join(", ")})`);
    }

    // matchers field
    if (!Array.isArray(hook.matchers)) {
      errors.push(`${prefix}: missing or invalid "matchers" array`);
    } else {
      for (let j = 0; j < hook.matchers.length; j++) {
        const matcher = hook.matchers[j] as Record<string, unknown>;
        if (typeof matcher !== "object" || matcher === null) {
          errors.push(`${prefix}.matchers[${j}]: must be an object`);
        }
      }
    }

    // command field
    if (typeof hook.command !== "string" || hook.command.trim() === "") {
      errors.push(`${prefix}: missing or empty "command" field`);
    }

    // timeout (optional, must be positive number)
    if (hook.timeout !== undefined) {
      if (typeof hook.timeout !== "number" || hook.timeout <= 0) {
        errors.push(`${prefix}: timeout must be a positive number`);
      }
    }
  }

  return errors;
}

/**
 * Validate a hook script content. Returns an array of warnings/errors.
 */
export function validateHookScript(content: string): string[] {
  const errors: string[] = [];

  if (!content.startsWith("#!/bin/bash") && !content.startsWith("#!/usr/bin/env bash")) {
    errors.push("Hook script should start with #!/bin/bash or #!/usr/bin/env bash");
  }

  if (!content.includes("set -") || (!content.includes("set -e") && !content.includes("set -u"))) {
    errors.push("Hook script should use 'set -euo pipefail' for safety");
  }

  // Check that the script reads stdin (hooks receive JSON on stdin)
  const readsStdin = content.includes("$(cat)") || content.includes("read ") || content.includes("/dev/stdin");
  if (!readsStdin && (content.includes("TOOL_NAME") || content.includes("INPUT"))) {
    errors.push("Hook script references input variables but may not read from stdin");
  }

  // Check for common issues
  if (content.includes("rm -rf /")) {
    errors.push("Hook script contains dangerous 'rm -rf /' — blocked");
  }

  if (content.includes("eval ")) {
    errors.push("Hook script uses eval — potential code injection risk");
  }

  return errors;
}

/**
 * Validate a complete GeneratedHooks result.
 */
export function validateGeneratedHooks(hooksJson: HooksJson, scripts: Array<{ content: string }>): string[] {
  const errors: string[] = [];

  // Validate hooks.json structure
  const jsonErrors = validateHooksJson(JSON.stringify(hooksJson));
  errors.push(...jsonErrors);

  // Validate each script
  for (let i = 0; i < scripts.length; i++) {
    const scriptErrors = validateHookScript(scripts[i]!.content);
    for (const err of scriptErrors) {
      errors.push(`script[${i}]: ${err}`);
    }
  }

  return errors;
}
