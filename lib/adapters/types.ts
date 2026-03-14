/**
 * Source adapter interface for the unified pipeline.
 *
 * All input sources (registries, CLI-Anything, mcp2cli) produce
 * SkillCandidate objects that feed into the existing forgeSkill() pipeline.
 */

import type { Tool, ToolMeta } from "../types.js";

// ── Types ──────────────────────────────────────────────────────────────

/**
 * Intermediate format produced by all source adapters.
 * Contains enough information to feed into the forge pipeline.
 */
export interface SkillCandidate {
  /** Source identifier (e.g., "pypi:ruff", "mcp:filesystem") */
  source: string;
  /** Adapter that produced this candidate */
  adapter: AdapterType;
  /** Resolved tool (if installation/analysis succeeded) */
  tool?: Tool;
  /** Partial metadata (when full analysis isn't available yet) */
  meta?: Partial<ToolMeta>;
  /** MCP server config (for mcp2cli adapter) */
  mcpConfig?: MCPServerConfig;
  /** Whether the candidate should be pruned after skill generation */
  pruneAfter?: boolean;
}

export type AdapterType = "registry" | "cli-anything" | "mcp2cli" | "mcp-registry";

/**
 * Interface that all source adapters must implement.
 */
export interface SourceAdapter {
  /** Adapter type identifier */
  readonly type: AdapterType;

  /** Check if this adapter can handle the given source */
  supports(source: string): boolean;

  /**
   * Analyze a source and produce a SkillCandidate.
   * This may involve installation, analysis, or metadata fetching.
   */
  analyze(source: string, opts?: AdapterOptions): Promise<SkillCandidate>;
}

export interface AdapterOptions {
  /** Data directory for tool storage */
  dataDir?: string;
  /** Skills output directory */
  skillsDir?: string;
  /** Force re-analysis even if cached */
  force?: boolean;
  /** Deep-probe subcommands */
  deep?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * MCP server configuration for mcp2cli adapter.
 */
export interface MCPServerConfig {
  /** Server name */
  name: string;
  /** Command to start the server */
  command: string;
  /** Command arguments */
  args: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** npm package name (if npm-based) */
  npmPackage?: string;
  /** GitHub repo (owner/repo) */
  repo?: string;
}
