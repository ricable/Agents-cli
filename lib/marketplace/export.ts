/**
 * Static export: SQLite → registry-data.json for Vercel deployment.
 *
 * Bridges the new SQLite system with the existing static deployment model.
 * Generates a paginated registry-data.json that the SaaS UI can load.
 */

import { writeFileSync } from "node:fs";
import type { UnifiedStore } from "../db/unified-store.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Maximum items per category (default: 100) */
  limit?: number;
  /** Include quality scores in export */
  includeScores?: boolean;
}

export interface ExportResult {
  totalItems: number;
  categories: Record<string, number>;
  outputPath: string;
  durationMs: number;
}

// ── Export ──────────────────────────────────────────────────────────────

/**
 * Export SQLite store to registry-data.json format.
 */
export function exportRegistryData(
  store: UnifiedStore,
  outputPath: string,
  opts?: ExportOptions,
): ExportResult {
  const start = Date.now();
  const limit = opts?.limit ?? 100;
  const includeScores = opts?.includeScores ?? false;

  const data: Record<string, unknown[]> = {
    github: [],
    npm: [],
    pypi: [],
    crates: [],
    agent_defs: [],
    harnesses: [],
    cli_anything: [],
    generated_skills: [],
    workflows: [],
  };

  // Export tools by source format
  const db = store.getDb();

  const sourceFormats = ["github", "npm", "pypi", "crates"] as const;
  for (const format of sourceFormats) {
    const tools = db.prepare(`
      SELECT id, name, description, source_uri, version, tags
      FROM tools WHERE source_format = ?
      ORDER BY name LIMIT ?
    `).all(format, limit);
    data[format] = tools.map(formatToolEntry);
  }

  // Skills → generated_skills
  const skills = store.listSkills({ limit });
  data.generated_skills = skills.map((s) => ({
    name: s.name,
    domain: s.domain,
    description: s.description,
    version: s.version,
    type: "generated-skill",
    ...(includeScores ? { triggerScore: s.trigger_score, qualityScore: s.quality_score } : {}),
  }));

  // Workflows
  const workflows = store.listWorkflows({ limit });
  data.workflows = workflows.map((w) => {
    const steps = safeParseJson(w.steps_json, []) as unknown[];
    return {
      name: w.name,
      domain: w.domain,
      description: w.description,
      type: "workflow",
      stepCount: steps.length,
      estimatedDuration: w.estimated_duration,
    };
  });

  // Write to file
  writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf-8");

  // Count totals
  const categories: Record<string, number> = {};
  let totalItems = 0;
  for (const [key, items] of Object.entries(data)) {
    categories[key] = items.length;
    totalItems += items.length;
  }

  return {
    totalItems,
    categories,
    outputPath,
    durationMs: Date.now() - start,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatToolEntry(row: any): Record<string, unknown> {
  return {
    name: row.name,
    repo: row.source_uri,
    description: row.description,
    version: row.version,
    type: "tool",
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
  };
}

function safeParseJson(json: string | null, fallback: unknown): unknown {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
