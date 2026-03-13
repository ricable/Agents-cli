/**
 * plugin/runtime-adapters.ts — Multi-runtime adapter generation.
 *
 * Generates configuration files for:
 * - Claude Code (native — already supported)
 * - pi-mono (.pi/settings.json)
 * - opencode (opencode.json)
 */

import type { ManifestEntry } from "../types.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface RuntimeAdapter {
  /** Runtime identifier */
  runtime: "claude-code" | "pi-mono" | "opencode";
  /** Files to generate (relative path → content) */
  files: Record<string, string>;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Generate all runtime adapter files for a plugin.
 */
export function generateRuntimeAdapters(
  domain: string,
  entries: ManifestEntry[],
  pluginName: string,
): RuntimeAdapter[] {
  return [
    generatePiMonoAdapter(domain, entries, pluginName),
    generateOpencodeAdapter(domain, entries, pluginName),
  ];
}

/**
 * Generate pi-mono configuration.
 */
export function generatePiMonoAdapter(
  domain: string,
  entries: ManifestEntry[],
  pluginName: string,
): RuntimeAdapter {
  const tools = entries.map(e => ({
    name: e.name,
    description: e.description || `${e.name} tool`,
    source: `skills/${e.name}/SKILL.md`,
  }));

  const settings = {
    name: pluginName,
    version: "1.0.0",
    description: `${domain} domain tools`,
    tools,
    agent: {
      name: `${domain.replace(/\//g, "-")}-expert`,
      source: `agents/${domain.replace(/\//g, "-")}-expert.md`,
    },
  };

  return {
    runtime: "pi-mono",
    files: {
      ".pi/settings.json": JSON.stringify(settings, null, 2) + "\n",
    },
  };
}

/**
 * Generate opencode configuration.
 */
export function generateOpencodeAdapter(
  domain: string,
  entries: ManifestEntry[],
  pluginName: string,
): RuntimeAdapter {
  const skills = entries.map(e => ({
    id: e.name,
    path: `skills/${e.name}/SKILL.md`,
  }));

  const config = {
    $schema: "https://opencode.ai/schema/v1",
    name: pluginName,
    version: "1.0.0",
    skills,
    hooks: {
      source: "hooks/hooks.json",
    },
    agents: [{
      id: `${domain.replace(/\//g, "-")}-expert`,
      source: `agents/${domain.replace(/\//g, "-")}-expert.md`,
    }],
  };

  return {
    runtime: "opencode",
    files: {
      "opencode.json": JSON.stringify(config, null, 2) + "\n",
    },
  };
}
