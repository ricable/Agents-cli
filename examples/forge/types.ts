/**
 * forge/types.ts — Shared types and constants for the skill-forge pipeline.
 */

import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Tool } from "../../lib/types.js";

// ── Constants ──────────────────────────────────────────────────────────

export const DATA_DIR    = join(homedir(), ".agents-cli");
export const OUTPUT_DIR  = resolve("examples/generated-skills");

// ── Types ──────────────────────────────────────────────────────────────

export interface CliArgs {
  prompt: string;
  tool: string;
  deep: boolean;
  audit: boolean;
  dryRun: boolean;
  limit: number;
  json: boolean;
  strict: boolean;
  force: boolean;
  // Trending mode
  trending: boolean;
  language: string;
  since: string;
  // Curated mode
  curated: boolean;
  category: string;
  listCategories: boolean;
  skipInstalled: boolean;
  // Workflow mode
  workflow: boolean;
  out: string;
  list: boolean;
  // Enhanced audit
  ai: boolean;
  domain: string;
  // Cache
  noCache: boolean;
  // Factory
  factory: boolean;
  skillOutput: boolean;
  // Monorepo
  monorepo: boolean;
  // Search
  search: string;
  searchMode: "fts" | "hybrid" | "vector";
  pkg: string;
  // Index
  index: boolean;
  // Plugin
  plugin: boolean;
  agentDefs: boolean;
  marketplace: boolean;
  // Lockfile
  freeze: boolean;
  verify: boolean;
  // MCP
  mcp: boolean;
  // System PATH discovery
  system: boolean;
  // Batch processing
  timeout: number;
  concurrency: number;
  resume: string;
}

export interface ChunkStats {
  files: number;
  chunks: number;
  byType: Record<string, number>;
}

export interface ForgedSkill {
  dir: string;
  skillMd: string;
  files: Record<string, string>;
  chunkStats: ChunkStats;
  skipped?: boolean;
}

export interface QualityResult {
  triggerScore: number;
  qualityScore: number;
  passed: boolean;
  issues: string[];
  triggerQueries: string[];
  nonTriggerQueries: string[];
  validationErrors?: string[];
}

/** Curated metadata from ai-ml-tools.json or curated-tools.ts */
export interface CuratedMeta {
  description: string;
  agentValue: string;
  category: string;
}

export interface BatchItem {
  label: string;
  source: string;
  curatedMeta?: CuratedMeta;
}

export interface BatchResult {
  label: string;
  tool: Tool;
  forged: ForgedSkill;
  quality: QualityResult;
}

export interface BatchOutcome {
  results: BatchResult[];
  failures: Array<{ label: string; error: string }>;
}

export interface DiscoveredPackage {
  name: string;
  source: string;
  description: string;
  relevance: number;
}

export interface DiscoveryResult {
  intent: string;
  confidence: number;
  capabilities: string[];
  entities: Array<{ name: string; domain: string }>;
  packages: DiscoveredPackage[];
}
