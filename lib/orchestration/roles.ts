/**
 * orchestration/roles.ts — Agent role definitions for the 7-phase pipeline.
 *
 * Each role maps to a pipeline phase and defines its responsibilities,
 * allowed tools, timeout, and retry policy.
 */

import type { AgentRole, AgentRoleName } from "./types.js";

export const AGENT_ROLES: AgentRole[] = [
  {
    name: "analyzer",
    phase: 1,
    description: "Analyzes the target application to build an AppProfile",
    systemPrompt:
      "You are an application analyzer. Detect the app's scripting capabilities, " +
      "API surface, backend type, and installed bindings. Produce a complete AppProfile " +
      "with all discoverable endpoints and their argument signatures.",
    allowedTools: [
      "Read", "Glob", "Grep", "Bash",
    ],
    timeoutMs: 60_000,
    retryable: true,
  },
  {
    name: "designer",
    phase: 2,
    description: "Designs the CLI harness command structure and output schema",
    systemPrompt:
      "You are a CLI harness designer. Given an AppProfile, design a comprehensive " +
      "command set grouped by functionality, with typed arguments and a consistent " +
      "JSON output schema. Ensure every API endpoint is covered by at least one command.",
    allowedTools: [
      "Read", "Glob", "Grep",
    ],
    timeoutMs: 60_000,
    retryable: true,
  },
  {
    name: "implementer",
    phase: 3,
    description: "Generates the harness source code from the design",
    systemPrompt:
      "You are a harness implementer. Generate production-quality TypeScript or Python " +
      "source files that implement each designed command. Use structured output envelopes, " +
      "proper error handling, and follow the project's ESM and security conventions.",
    allowedTools: [
      "Read", "Glob", "Grep", "Bash", "Edit", "Write",
    ],
    timeoutMs: 120_000,
    retryable: true,
  },
  {
    name: "test-planner",
    phase: 4,
    description: "Creates a test plan covering unit, integration, e2e, and Docker tests",
    systemPrompt:
      "You are a test planner. Produce a comprehensive test plan that covers every " +
      "command in the harness design. Categorize tests as unit, integration, e2e, or " +
      "docker. Ensure edge cases and error paths are included.",
    allowedTools: [
      "Read", "Glob", "Grep",
    ],
    timeoutMs: 60_000,
    retryable: true,
  },
  {
    name: "test-writer",
    phase: 5,
    description: "Writes test files from the test plan",
    systemPrompt:
      "You are a test writer. Implement all test cases from the test plan as runnable " +
      "test files using vitest or pytest. Each test must assert on structured output " +
      "fields and handle both success and error scenarios.",
    allowedTools: [
      "Read", "Glob", "Grep", "Edit", "Write",
    ],
    timeoutMs: 120_000,
    retryable: true,
  },
  {
    name: "documenter",
    phase: 6,
    description: "Generates README, changelog, and reference documentation",
    systemPrompt:
      "You are a documentation writer. Produce a clear README with quick-start, " +
      "command reference, examples, and troubleshooting sections. Generate a changelog " +
      "and per-group reference files for the harness.",
    allowedTools: [
      "Read", "Glob", "Grep", "Write",
    ],
    timeoutMs: 60_000,
    retryable: true,
  },
  {
    name: "publisher",
    phase: 7,
    description: "Publishes the harness as a skill, plugin, and MCP registration",
    systemPrompt:
      "You are a skill publisher. Package the harness into a SKILL.md with frontmatter, " +
      "generate plugin manifests, register MCP tools, and write the final output to the " +
      "skills directory. Ensure trigger score meets quality thresholds.",
    allowedTools: [
      "Read", "Glob", "Grep", "Bash", "Write",
    ],
    timeoutMs: 60_000,
    retryable: false,
  },
];

/**
 * Look up an agent role by name.
 */
export function getRole(name: AgentRoleName): AgentRole {
  const role = AGENT_ROLES.find((r) => r.name === name);
  if (!role) {
    throw new Error(`Unknown agent role: "${name}"`);
  }
  return role;
}

/**
 * Look up the agent role assigned to a given phase number.
 */
export function getRoleForPhase(phase: number): AgentRole {
  const role = AGENT_ROLES.find((r) => r.phase === phase);
  if (!role) {
    throw new Error(`No agent role assigned to phase ${phase}`);
  }
  return role;
}
