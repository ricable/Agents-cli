/**
 * hooks/generator.ts — Generate hooks.json and hook scripts for Claude Code plugins.
 *
 * Takes a DomainHookConfig and produces a complete GeneratedHooks result
 * containing hooks.json and any supporting shell scripts.
 */

import type {
  HookDefinition,
  HookScript,
  GeneratedHooks,
  BlockPattern,
} from "./types.js";
import { getHookConfig } from "./templates/index.js";

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Generate hooks.json and supporting scripts for a domain.
 *
 * @param domain  Domain identifier (e.g. "database", "python", "ai-ml/llm-inference")
 * @param entries Package names in the domain (for context injection)
 * @returns       GeneratedHooks with hooksJson and scripts
 */
export function generateHooksJson(domain: string, entries: string[]): GeneratedHooks {
  const config = getHookConfig(domain);
  const hooks: HookDefinition[] = [];
  const scripts: HookScript[] = [];

  // 1. PreToolUse hooks (block patterns)
  if (config.blockPatterns && config.blockPatterns.length > 0) {
    const scriptContent = generatePreToolUseScript(config.blockPatterns, domain);
    const scriptPath = `hooks/pre-tool-use-${sanitizeDomain(domain)}.sh`;

    scripts.push({
      path: scriptPath,
      content: scriptContent,
      executable: true,
    });

    // Collect unique tool names from block patterns
    const toolNames = [...new Set(config.blockPatterns.flatMap(p => p.tools))];

    hooks.push({
      type: "PreToolUse",
      matchers: toolNames.map(t => ({ tool_name: t })),
      command: `"$CLAUDE_PLUGIN_ROOT/${scriptPath}"`,
      description: `${domain} domain safety checks — blocks destructive operations`,
      timeout: 5000,
    });
  }

  // 2. PostToolUse hooks (validations)
  if (config.postValidations && config.postValidations.length > 0) {
    const scriptContent = generatePostToolUseScript(config.postValidations, domain);
    const scriptPath = `hooks/post-tool-use-${sanitizeDomain(domain)}.sh`;

    scripts.push({
      path: scriptPath,
      content: scriptContent,
      executable: true,
    });

    const toolNames = [...new Set(config.postValidations.flatMap(p => p.tools))];

    hooks.push({
      type: "PostToolUse",
      matchers: toolNames.map(t => ({ tool_name: t })),
      command: `"$CLAUDE_PLUGIN_ROOT/${scriptPath}"`,
      description: `${domain} domain post-edit validations`,
      timeout: 15000,
    });
  }

  // 3. Stop hook (quality gates)
  if (config.qualityGates && config.qualityGates.length > 0) {
    const scriptContent = generateStopScript(config.qualityGates, domain);
    const scriptPath = `hooks/stop-${sanitizeDomain(domain)}.sh`;

    scripts.push({
      path: scriptPath,
      content: scriptContent,
      executable: true,
    });

    hooks.push({
      type: "Stop",
      matchers: [],
      command: `"$CLAUDE_PLUGIN_ROOT/${scriptPath}"`,
      description: `${domain} domain quality gate — validates before completion`,
      timeout: 30000,
    });
  }

  // 4. SessionStart hook (context injection)
  if (config.contextInjections && config.contextInjections.length > 0) {
    const scriptContent = generateSessionStartScript(config.contextInjections, entries, domain);
    const scriptPath = `hooks/session-start-${sanitizeDomain(domain)}.sh`;

    scripts.push({
      path: scriptPath,
      content: scriptContent,
      executable: true,
    });

    hooks.push({
      type: "SessionStart",
      matchers: [],
      command: `"$CLAUDE_PLUGIN_ROOT/${scriptPath}"`,
      description: `${domain} domain context injection — tool versions and project state`,
      timeout: 10000,
    });
  }

  // 5. SubagentStart hook
  hooks.push({
    type: "SubagentStart",
    matchers: [],
    command: `echo "Subagent spawned for ${domain} domain at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$CLAUDE_PLUGIN_ROOT/hooks/.agent-audit.log"`,
    description: `Log ${domain} subagent spawns`,
    timeout: 3000,
  });

  // 6. SubagentStop hook
  hooks.push({
    type: "SubagentStop",
    matchers: [],
    command: `echo "Subagent completed for ${domain} domain at $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$CLAUDE_PLUGIN_ROOT/hooks/.agent-audit.log"`,
    description: `Log ${domain} subagent completions`,
    timeout: 3000,
  });

  // 7. Notification hook
  if (config.alertTriggers && config.alertTriggers.length > 0) {
    hooks.push({
      type: "Notification",
      matchers: [],
      command: `echo "[${domain}] $(cat)" | tee -a "$CLAUDE_PLUGIN_ROOT/hooks/.notifications.log"`,
      description: `${domain} domain notifications`,
      timeout: 5000,
    });
  }

  return {
    hooksJson: { hooks },
    scripts,
  };
}

/**
 * Generate hooks for a domain using only the domain name.
 * Convenience wrapper around generateHooksJson.
 */
export function generateDomainHooks(domain: string): GeneratedHooks {
  return generateHooksJson(domain, []);
}

// ── Script generators ──────────────────────────────────────────────────

function sanitizeDomain(domain: string): string {
  return domain.replace(/\//g, "-").replace(/[^a-z0-9-]/g, "");
}

function generatePreToolUseScript(patterns: BlockPattern[], domain: string): string {
  const checks = patterns.map(p => {
    const escapedPattern = p.pattern.replace(/'/g, "'\\''");
    return [
      `  # Check: ${p.reason}`,
      `  if echo "$INPUT" | grep -qEi '${escapedPattern}'; then`,
      `    echo "${p.reason}" >&2`,
      `    exit 2`,
      `  fi`,
    ].join("\n");
  }).join("\n\n");

  return [
    "#!/bin/bash",
    "set -euo pipefail",
    `# PreToolUse hook for ${domain} domain`,
    `# Auto-generated by agents-cli plugin builder`,
    "",
    "INPUT=$(cat)",
    'TOOL_NAME=$(echo "$INPUT" | jq -r \'.tool_name // empty\' 2>/dev/null || echo "")',
    'TOOL_INPUT=$(echo "$INPUT" | jq -r \'.tool_input // empty\' 2>/dev/null || echo "")',
    "",
    checks,
    "",
    "# All checks passed — allow the tool call",
    "exit 0",
    "",
  ].join("\n");
}

function generatePostToolUseScript(
  validations: Array<{ command: string; description: string; tools: string[] }>,
  domain: string,
): string {
  const cmds = validations.map(v => {
    return [
      `  # ${v.description}`,
      `  ${v.command}`,
    ].join("\n");
  }).join("\n\n");

  return [
    "#!/bin/bash",
    "set -euo pipefail",
    `# PostToolUse hook for ${domain} domain`,
    `# Auto-generated by agents-cli plugin builder`,
    "",
    "INPUT=$(cat)",
    'TOOL_NAME=$(echo "$INPUT" | jq -r \'.tool_name // empty\' 2>/dev/null || echo "")',
    'TOOL_INPUT_PATH=$(echo "$INPUT" | jq -r \'.tool_input.file_path // empty\' 2>/dev/null || echo "")',
    "",
    'if [ -n "$TOOL_INPUT_PATH" ]; then',
    cmds,
    "fi",
    "",
    "exit 0",
    "",
  ].join("\n");
}

function generateStopScript(
  gates: Array<{ command: string; description: string }>,
  domain: string,
): string {
  const checks = gates.map((g, i) => {
    return [
      `  # Gate ${i + 1}: ${g.description}`,
      `  if ! (${g.command}); then`,
      `    echo "Quality gate failed: ${g.description}" >&2`,
      `    FAILURES=$((FAILURES + 1))`,
      `  fi`,
    ].join("\n");
  }).join("\n\n");

  return [
    "#!/bin/bash",
    "set -uo pipefail",
    `# Stop hook (quality gate) for ${domain} domain`,
    `# Auto-generated by agents-cli plugin builder`,
    "",
    "FAILURES=0",
    "",
    checks,
    "",
    'if [ "$FAILURES" -gt 0 ]; then',
    '  echo "Quality gate: $FAILURES check(s) failed for ' + domain + ' domain" >&2',
    "  exit 2",
    "fi",
    "",
    "exit 0",
    "",
  ].join("\n");
}

function generateSessionStartScript(
  injections: Array<{ command: string; label: string }>,
  entries: string[],
  domain: string,
): string {
  const cmds = injections.map(inj => {
    return [
      `# ${inj.label}`,
      `echo "  ${inj.label}: $(${inj.command})"`,
    ].join("\n");
  }).join("\n\n");

  const toolList = entries.slice(0, 10).join(", ");

  return [
    "#!/bin/bash",
    "set -uo pipefail",
    `# SessionStart hook for ${domain} domain`,
    `# Auto-generated by agents-cli plugin builder`,
    "",
    `echo "=== ${domain} Domain Context ==="`,
    "",
    cmds,
    "",
    toolList ? `echo "  available-tools: ${toolList}"` : "",
    "",
    `echo "=== End ${domain} Context ==="`,
    "",
  ].join("\n");
}
