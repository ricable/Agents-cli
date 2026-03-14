/**
 * Source adapter interface for the unified pipeline.
 *
 * All input sources (registries, CLI-Anything, mcp2cli) produce
 * SkillCandidate objects that feed into the existing forgeSkill() pipeline.
 */

import type { Tool, ToolMeta } from "../types.js";
import { toErrorMessage } from "../output.js";

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

// ── Shared helpers ─────────────────────────────────────────────────────

/** Extract name from a prefixed source (e.g., "mcp:filesystem" → "filesystem"). Returns null if empty. */
export function extractAdapterName(source: string, prefix: string): string | null {
  const name = source.replace(new RegExp(`^${prefix}`), "").trim();
  return name || null;
}

/** Build a SkillCandidate for an adapter error. */
export function errorCandidate(source: string, adapter: AdapterType, name: string, err: unknown): SkillCandidate {
  return { source, adapter, meta: { name, description: toErrorMessage(err) } };
}

/** Build a Tool-like object for adapters that construct tools from non-registry sources. */
export function buildCandidateTool(opts: {
  id: string;
  name: string;
  version?: string;
  description: string;
  tags: string[];
  format: string;
  uri: string;
  commands?: Array<{ name: string; description: string; flags: unknown[] }>;
  installPath: string;
}): Tool {
  const now = new Date().toISOString();
  return {
    id: opts.id,
    meta: { name: opts.name, version: opts.version ?? "1.0.0", description: opts.description, tags: opts.tags },
    source: { format: opts.format, uri: opts.uri },
    capabilities: { commands: opts.commands ?? [], globalFlags: [], subcommandAliases: {} },
    installPath: opts.installPath,
    status: "installed",
    installedAt: now,
    updatedAt: now,
  } as Tool;
}
