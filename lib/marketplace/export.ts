/**
 * Static export: SQLite → registry-data.json for Vercel deployment.
 *
 * Bridges the new SQLite system with the existing static deployment model.
 * Generates a registry-data.json that the SaaS UI can load directly.
 *
 * The output format must match what examples/saas-ui/js/registries.js and
 * examples/saas-ui/js/marketplace.js expect:
 *
 *   {
 *     github:           [...products],
 *     npm:              [...products],
 *     pypi:             [...products],
 *     crates:           [...products],
 *     agent_defs:       [...products],
 *     harnesses:        [...products],
 *     cli_anything:     [...products],
 *     generated_skills: [...products],
 *     workflows:        [...products],
 *   }
 *
 * Each product must have: id, name, productType, version, description, app,
 * category, source, uri, commands, quality, tags[], pricing{}, stats{}.
 */

import { writeFileSync } from "node:fs";
import type { UnifiedStore } from "../db/unified-store.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Maximum items per category (default: 200) */
  limit?: number;
  /** Include quality scores in export (default: true) */
  includeScores?: boolean;
}

export interface ExportResult {
  totalItems: number;
  categories: Record<string, number>;
  outputPath: string;
  durationMs: number;
}

interface MarketplaceProduct {
  id: string;
  name: string;
  productType: string;
  version: string;
  description: string;
  app: string;
  category: string;
  source: string;
  uri: string;
  commands: number;
  quality: number;
  tags: string[];
  pricing: { model: string; basePrice: number; currency: string };
  stats: { rating: number; downloads: number };
  domain?: string;
  workflowSteps?: Array<{ name: string; tool?: string }>;
  estimatedDuration?: string;
}

// ── Export ──────────────────────────────────────────────────────────────

/**
 * Export SQLite store to registry-data.json format compatible with the SaaS UI.
 */
export function exportRegistryData(
  store: UnifiedStore,
  outputPath: string,
  opts?: ExportOptions,
): ExportResult {
  const start = Date.now();
  const limit = opts?.limit ?? 200;

  const data: Record<string, MarketplaceProduct[]> = {
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

  const db = store.getDb();

  // ── Export tools by source format into registry buckets ──────────

  const SOURCE_TO_CATEGORY: Record<string, string> = {
    github: "github",
    npm: "npm",
    pypi: "pypi",
    crates: "crates",
  };

  for (const [format, category] of Object.entries(SOURCE_TO_CATEGORY)) {
    const tools = db.prepare(`
      SELECT id, name, description, source_uri, version, tags,
             caps_json, extras_json
      FROM tools WHERE source_format = ?
      ORDER BY name LIMIT ?
    `).all(format, limit) as Array<Record<string, unknown>>;

    data[category] = tools.map((row) => formatToolProduct(row, category, format));
  }

  // ── Skills → generated_skills ───────────────────────────────────

  const skills = store.listSkills({ limit });
  data.generated_skills = skills.map((s) => skillToProduct(s, "skill"));

  // ── Workflows ───────────────────────────────────────────────────

  const workflows = store.listWorkflows({ limit });
  data.workflows = workflows.map((w) => {
    const steps = safeParseJson(w.steps_json, []) as Array<Record<string, unknown>>;
    const qualityAxes = safeParseJson(w.quality_json, {}) as Record<string, number>;
    const avgQuality = computeAvgQuality(qualityAxes);

    return {
      id: w.id,
      name: w.name,
      productType: "workflow",
      version: "1.0.0",
      description: w.description || "",
      app: w.name,
      category: w.domain || "general",
      source: "composed",
      uri: w.id,
      commands: steps.length,
      quality: roundTo(avgQuality * 10, 1),
      tags: [],
      domain: w.domain,
      pricing: { model: "free", basePrice: 0, currency: "USD" },
      stats: { rating: qualityToRating(avgQuality), downloads: 0 },
      workflowSteps: steps.map((step) => ({
        name: String(step.name || step.tool || "step"),
        tool: step.tool ? String(step.tool) : undefined,
      })),
      estimatedDuration: w.estimated_duration ?? undefined,
    };
  });

  // ── Agent defs (skills with agent-related domains) ──────────────

  const agentSkills = store.listSkills({ domain: "agent", limit });
  data.agent_defs = agentSkills.map((s) => skillToProduct(s, "agent-def"));

  // ── Write to file ───────────────────────────────────────────────

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

function formatToolProduct(
  row: Record<string, unknown>,
  category: string,
  source: string,
): MarketplaceProduct {
  const tags = row.tags ? String(row.tags).split(",").filter(Boolean) : [];
  const caps = safeParseJson(row.caps_json as string | null, {}) as Record<string, unknown>;
  const commands = Array.isArray(caps.commands) ? caps.commands.length : 0;
  const extras = safeParseJson(row.extras_json as string | null, {}) as Record<string, unknown>;
  const curatedMeta = extras.curatedMeta as Record<string, unknown> | undefined;

  // Derive quality from curated metadata or default based on command count
  const quality = curatedMeta?.quality
    ? Number(curatedMeta.quality)
    : commands > 5 ? 8.5 : commands > 0 ? 7.5 : 6.0;

  return {
    id: `skill-${row.name}`,
    name: String(row.name || ""),
    productType: "skill",
    version: String(row.version || "0.0.0"),
    description: String(row.description || ""),
    app: String(row.name || ""),
    category,
    source,
    uri: String(row.source_uri || ""),
    commands,
    quality: roundTo(quality, 1),
    tags,
    pricing: { model: "free", basePrice: 0, currency: "USD" },
    stats: {
      rating: qualityToRating(quality / 10),
      downloads: curatedMeta?.downloads ? Number(curatedMeta.downloads) : 0,
    },
  };
}

/** Convert a SkillRecord into a MarketplaceProduct. */
function skillToProduct(
  s: { id: string; name: string; domain: string; description: string; version?: string; tags?: string; trigger_score?: number; quality_score?: number; tool_id?: string },
  productType: string,
): MarketplaceProduct {
  const tags = s.tags ? s.tags.split(",").filter(Boolean) : [];
  const quality = s.trigger_score ?? s.quality_score ?? 0;
  return {
    id: productType === "agent-def" ? `agent-${s.id}` : s.id,
    name: s.name,
    productType,
    version: s.version || "0.0.0",
    description: s.description || "",
    app: s.name,
    category: productType === "agent-def" ? "agent" : (s.domain || "general"),
    source: "generated",
    uri: s.tool_id || s.id,
    commands: 0,
    quality: roundTo(quality * 10, 1),
    tags,
    domain: s.domain,
    pricing: { model: "free", basePrice: 0, currency: "USD" },
    stats: { rating: qualityToRating(quality), downloads: 0 },
  };
}

/** Convert a 0-1 quality score to a 0-5 star rating */
function qualityToRating(score01: number): number {
  if (score01 <= 0) return 0;
  // Map: 0.6→3.0, 0.8→4.0, 1.0→5.0
  return roundTo(Math.min(score01 * 5, 5), 1);
}

/** Compute average from workflow quality axes (each 0-1) */
function computeAvgQuality(axes: Record<string, number>): number {
  const values = Object.values(axes).filter((v) => typeof v === "number" && !isNaN(v));
  if (values.length === 0) return 0.7; // default
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function roundTo(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

function safeParseJson(json: string | null, fallback: unknown): unknown {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
