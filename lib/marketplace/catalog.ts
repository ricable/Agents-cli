/**
 * marketplace/catalog.ts — Unified marketplace catalog generation.
 *
 * Scans skill and plugin directories, builds a marketplace.json with
 * pricing, quality scores, and metadata for each entry.
 */

import fs from "node:fs";
import path from "node:path";
import type { PricingTier } from "./pricing.js";
import { DEFAULT_PRICING } from "./pricing.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface CatalogOpts {
  skillsDir: string;
  pluginsDir: string;
  outputPath: string;
  dryRun: boolean;
}

export interface CatalogEntry {
  id: string;
  name: string;
  productType: string;
  version: string;
  description: string;
  app: string;
  category: string;
  commands: number;
  quality: number;
  pricing: PricingTier;
  path: string;
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Scan skill and plugin directories, build unified marketplace catalog.
 *
 * Skills are detected by presence of SKILL.md in subdirectories.
 * Plugins are detected by presence of .claude-plugin/plugin.json.
 */
export async function generateCatalog(opts: CatalogOpts): Promise<CatalogEntry[]> {
  const entries: CatalogEntry[] = [];

  // Scan skills directory
  if (fs.existsSync(opts.skillsDir)) {
    const skillDirs = fs.readdirSync(opts.skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const dir of skillDirs) {
      const skillPath = path.join(opts.skillsDir, dir.name, "SKILL.md");
      if (!fs.existsSync(skillPath)) continue;

      const entry = parseSkillEntry(dir.name, skillPath);
      if (entry) entries.push(entry);
    }
  }

  // Scan plugins directory
  if (fs.existsSync(opts.pluginsDir)) {
    const pluginDirs = fs.readdirSync(opts.pluginsDir, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const dir of pluginDirs) {
      const manifestPath = path.join(opts.pluginsDir, dir.name, ".claude-plugin", "plugin.json");
      if (!fs.existsSync(manifestPath)) continue;

      const entry = parsePluginEntry(dir.name, manifestPath, opts.pluginsDir);
      if (entry) entries.push(entry);
    }
  }

  // Sort by quality descending
  entries.sort((a, b) => b.quality - a.quality);

  // Write catalog unless dry-run
  if (!opts.dryRun && opts.outputPath) {
    const outputDir = path.dirname(opts.outputPath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(opts.outputPath, formatCatalogJson(entries), "utf-8");
  }

  return entries;
}

/**
 * Format catalog entries as marketplace.json content.
 */
export function formatCatalogJson(entries: CatalogEntry[]): string {
  const catalog = {
    version: "2.0.0",
    generatedAt: new Date().toISOString(),
    totalProducts: entries.length,
    byType: countByType(entries),
    products: entries,
  };
  return JSON.stringify(catalog, null, 2) + "\n";
}

// ── Helpers ────────────────────────────────────────────────────────────

function parseSkillEntry(name: string, skillPath: string): CatalogEntry | null {
  try {
    const content = fs.readFileSync(skillPath, "utf-8");
    const fm = extractFrontmatter(content);

    return {
      id: `skill-${name}`,
      name: fm.name || name,
      productType: "skill",
      version: fm.version || "0.1.0",
      description: fm.description || `Skill for ${name}`,
      app: name,
      category: fm.domain || "uncategorized",
      commands: countCommandBlocks(content),
      quality: estimateQuality(content),
      pricing: DEFAULT_PRICING["skill"]!,
      path: path.dirname(skillPath),
    };
  } catch {
    return null;
  }
}

function parsePluginEntry(
  name: string,
  manifestPath: string,
  pluginsDir: string,
): CatalogEntry | null {
  try {
    const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Record<string, unknown>;
    const pluginDir = path.join(pluginsDir, name);

    // Count skills in plugin
    const skillsDir = path.join(pluginDir, "skills");
    let cmdCount = 0;
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
        .filter(d => d.isDirectory());
      cmdCount = skills.length;
    }

    return {
      id: `plugin-${name}`,
      name: String(raw.name ?? name),
      productType: "plugin",
      version: String(raw.version ?? "1.0.0"),
      description: String(raw.description ?? `Plugin for ${name}`),
      app: name,
      category: extractCategoryFromKeywords(raw.keywords),
      commands: cmdCount,
      quality: 7, // Plugins that built successfully get baseline quality
      pricing: DEFAULT_PRICING["plugin"]!,
      path: pluginDir,
    };
  } catch {
    return null;
  }
}

/**
 * Extract frontmatter fields from SKILL.md content.
 * Uses simple regex — does not depend on parseFrontmatter() to avoid circular deps.
 */
function extractFrontmatter(content: string): {
  name?: string;
  version?: string;
  description?: string;
  domain?: string;
} {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return {};

  const fm = fmMatch[1]!;
  const name = fm.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const version = fm.match(/^version:\s*(.+)$/m)?.[1]?.trim();
  const domain = fm.match(/^domain:\s*(.+)$/m)?.[1]?.trim();

  // Description may be quoted
  const descMatch = fm.match(/^description:\s*"(.+)"$/m) ?? fm.match(/^description:\s*(.+)$/m);
  const description = descMatch?.[1]?.trim();

  return { name, version, description, domain };
}

/**
 * Count code blocks in SKILL.md as a proxy for command richness.
 */
function countCommandBlocks(content: string): number {
  const matches = content.match(/```(?:bash|shell|sh)/g);
  return matches ? matches.length : 0;
}

/**
 * Estimate quality score (0-10) from SKILL.md content heuristics.
 */
function estimateQuality(content: string): number {
  let score = 5;

  // Has frontmatter with description
  if (content.match(/^---[\s\S]*?description:/m)) score += 1;

  // Has "Use when" trigger pattern
  if (content.includes("Use when")) score += 1;

  // Has "Do NOT use" negative trigger
  if (content.includes("Do NOT use")) score += 1;

  // Has code examples
  if (content.includes("```bash") || content.includes("```shell")) score += 1;

  // Has Quick Start section
  if (content.includes("## Quick Start") || content.includes("## Usage")) score += 1;

  return Math.min(score, 10);
}

function extractCategoryFromKeywords(keywords: unknown): string {
  if (!Array.isArray(keywords)) return "uncategorized";
  const first = keywords[0];
  return typeof first === "string" ? first : "uncategorized";
}

function countByType(entries: CatalogEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.productType] = (counts[e.productType] ?? 0) + 1;
  }
  return counts;
}
