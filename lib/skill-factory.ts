/**
 * skill-factory: 3-layer SKILL.md generator for .claude/skills/
 *
 * Layer 1: opensrc fetch (handled externally)
 * Layer 2: structural analysis -> template SKILL.md (fast, free, offline)
 * Layer 3: AI-enhanced via Claude Batch API (--ai flag)
 *
 * This is the library version — accepts options objects instead of process.argv.
 * @anthropic-ai/sdk is lazily imported (only needed for --ai mode).
 */

import fs from "node:fs";
import path from "node:path";

import type { ManifestEntry, PackageAnalysis } from "./types.js";
import { skillDirName } from "./types.js";
import { analyzeRepo } from "./extractor.js";
import { generateStructuralSkill, generateSearchScript } from "./skill-content.js";
import { groupByDomain } from "./indexes.js";

// ── Public types ───────────────────────────────────────────────────────

export interface SkillFactoryOptions {
  manifestPath: string;
  skillsDir: string;
  opensrcDir: string;
  domain?: string;
  repo?: string;
  ai?: boolean;
  force?: boolean;
  dryRun?: boolean;
  strict?: boolean;
  test?: boolean;
  batchSize?: number;
}

export interface SkillFactoryResult {
  generated: number;
  skipped: number;
  total: number;
  domains: string[];
  errors: string[];
}

// ── Lazy Anthropic import ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getAnthropicClient(apiKey: string): Promise<any> {
  try {
    // @ts-expect-error -- optional peer dependency, lazily loaded
    const mod = await import("@anthropic-ai/sdk");
    const Anthropic = mod.default ?? mod;
    return new Anthropic({ apiKey });
  } catch {
    throw new Error(
      "Install @anthropic-ai/sdk for AI-enhanced skill generation: npm i @anthropic-ai/sdk"
    );
  }
}

// ── Manifest types ─────────────────────────────────────────────────────

interface Manifest {
  repos: ManifestEntry[];
}

// ── Internal helpers ───────────────────────────────────────────────────

function repoPath(opensrcDir: string, repoSlug: string): string {
  return path.join(opensrcDir, "repos", "github.com", repoSlug);
}

function skillExists(skillsDir: string, entry: ManifestEntry): boolean {
  const dir = path.join(skillsDir, skillDirName(entry));
  try {
    return (
      fs.existsSync(path.join(dir, "SKILL.md")) ||
      fs.existsSync(path.join(dir, "skill.md"))
    );
  } catch {
    return false;
  }
}

// ── Write helpers ──────────────────────────────────────────────────────

function writeSkill(
  skillsDir: string,
  entry: ManifestEntry,
  content: string,
  dryRun: boolean,
  strict: boolean,
  errors: string[]
): boolean {
  const dir = path.join(skillsDir, skillDirName(entry));
  const skillFile = path.join(dir, "SKILL.md");
  const scriptDir = path.join(dir, "scripts");
  const scriptFile = path.join(scriptDir, "search.sh");

  if (dryRun) {
    return true;
  }

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(skillFile, content, "utf-8");

    // Create search script
    fs.mkdirSync(scriptDir, { recursive: true });
    fs.writeFileSync(scriptFile, generateSearchScript(entry), "utf-8");
    fs.chmodSync(scriptFile, 0o755);

    return true;
  } catch (e) {
    const msg = `Failed to write skill ${entry.name}: ${(e as Error).message}`;
    errors.push(msg);
    if (strict) throw new Error(msg);
    return false;
  }
}

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Run the skill factory pipeline.
 *
 * @param opts  Configuration options
 * @returns     Summary of generated / skipped / errored skills
 */
export async function runSkillFactory(
  opts: SkillFactoryOptions
): Promise<SkillFactoryResult> {
  const {
    manifestPath,
    skillsDir,
    opensrcDir,
    domain: domainFilter,
    repo: repoFilter,
    ai = false,
    force = false,
    dryRun = false,
    strict = false,
    batchSize = 50,
  } = opts;

  const errors: string[] = [];

  // Load manifest
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found: ${manifestPath}`);
  }
  const manifest: Manifest = JSON.parse(
    fs.readFileSync(manifestPath, "utf-8")
  );

  // Filter entries
  let entries = manifest.repos;
  if (repoFilter) {
    entries = entries.filter(
      (e) => e.name === repoFilter || e.repo.includes(repoFilter)
    );
  }
  if (domainFilter) {
    entries = entries.filter((e) => e.domain === domainFilter);
  }

  // Determine what needs generation
  const toGenerate = entries.filter((e) => {
    if (force) return true;
    if (!skillExists(skillsDir, e)) return true;
    return false;
  });

  let generated = 0;

  // Cache analysis results to avoid re-reading files in AI layer
  const analysisCache = new Map<string, PackageAnalysis>();

  // Layer 2: structural generation
  for (const entry of toGenerate) {
    const rDir = repoPath(opensrcDir, entry.repo);
    if (!fs.existsSync(rDir)) {
      errors.push(`Repo not found: ${entry.repo}`);
      continue;
    }

    const analysis = analyzeRepo(entry, rDir);
    analysisCache.set(entry.name, analysis);
    const content = generateStructuralSkill(entry, analysis);
    const ok = writeSkill(skillsDir, entry, content, dryRun, strict, errors);
    if (ok) generated++;
  }

  // Layer 3: AI-enhanced (if requested)
  if (ai && toGenerate.length > 0) {
    const apiKey = process.env.ANTHROPIC_API_KEY ?? "";
    if (!apiKey) {
      errors.push("ANTHROPIC_API_KEY not set — structural versions kept");
    } else {
      try {
        const client = await getAnthropicClient(apiKey);
        // Process in batches
        for (let i = 0; i < toGenerate.length; i += batchSize) {
          const batch = toGenerate.slice(i, i + batchSize);
          for (const entry of batch) {
            try {
              const rDir = repoPath(opensrcDir, entry.repo);

              // Use cached analysis from Layer 2, or compute if missing
              const analysis = analysisCache.get(entry.name) ?? (
                fs.existsSync(rDir) ? analyzeRepo(entry, rDir) : null
              );
              if (!analysis) continue;

              const response = await client.messages.create({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 2000,
                messages: [
                  {
                    role: "user",
                    content: `Generate a rich SKILL.md for the ${entry.name} package (${entry.domain} domain). Repo: ${entry.repo}. Description: ${analysis.description}. Include: triggers, examples, common patterns, integration tips. Output only the SKILL.md content.`,
                  },
                ],
              });

              const block = response.content[0];
              if (block.type === "text" && block.text.length > 100) {
                writeSkill(skillsDir, entry, block.text, dryRun, strict, errors);
              }
            } catch (e) {
              errors.push(
                `AI generation failed for ${entry.name}: ${(e as Error).message}`
              );
            }
          }
        }
      } catch (e) {
        errors.push(`AI client init failed: ${(e as Error).message}`);
      }
    }
  }

  const byDomain = groupByDomain(entries);

  return {
    generated,
    skipped: entries.length - toGenerate.length,
    total: entries.length,
    domains: [...byDomain.keys()],
    errors,
  };
}
