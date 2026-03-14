/**
 * Migration: tools.json + .skill-cache.json + generated-skills → unified SQLite.
 *
 * Reads existing flat-file data and bulk-inserts into the unified store.
 * Safe to run multiple times (INSERT OR REPLACE).
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { ensureSqlite } from "./sqlite.js";
import { createUnifiedStore, type SkillRecord, type UnifiedStore } from "./unified-store.js";
import type { Tool } from "../types.js";
import { DOMAIN_TRIGGERS } from "../domains.js";
import { parseFrontmatter } from "../skills/frontmatter.js";

// ── Types ──────────────────────────────────────────────────────────────

export interface MigrationResult {
  toolsMigrated: number;
  skillsMigrated: number;
  domainsSeeded: number;
  cacheEntriesMigrated: number;
  errors: string[];
  durationMs: number;
}

// ── Migration ──────────────────────────────────────────────────────────

/**
 * Migrate all existing data to unified SQLite store.
 *
 * Sources:
 * - {dataDir}/tools.json -> tools table
 * - {skillsDir}/.skill-cache.json -> skills table (cache fields)
 * - {skillsDir}/src-* /SKILL.md -> skills table (metadata)
 * - DOMAIN_TRIGGERS -> domains table
 */
export async function migrateToSqlite(opts: {
  dataDir: string;
  skillsDir?: string;
  dryRun?: boolean;
}): Promise<MigrationResult> {
  const start = Date.now();
  const errors: string[] = [];
  let toolsMigrated = 0;
  let skillsMigrated = 0;
  let cacheEntriesMigrated = 0;

  // Default skillsDir to {dataDir}/skills if not specified
  const skillsDir = opts.skillsDir ?? join(opts.dataDir, "skills");

  await ensureSqlite();

  if (opts.dryRun) {
    // Count what would be migrated without touching the DB
    const tools = loadToolsJson(opts.dataDir);
    const skills = discoverSkills(skillsDir);
    const cache = loadSkillCache(skillsDir);
    return {
      toolsMigrated: tools.length,
      skillsMigrated: skills.length,
      domainsSeeded: Object.keys(DOMAIN_TRIGGERS).length,
      cacheEntriesMigrated: Object.keys(cache).length,
      errors: [],
      durationMs: Date.now() - start,
    };
  }

  const store = createUnifiedStore(opts.dataDir);

  // 1. Migrate tools.json
  const tools = loadToolsJson(opts.dataDir);
  if (tools.length > 0) {
    try {
      toolsMigrated = store.bulkInsert(tools);
    } catch (err) {
      errors.push(`tools.json migration: ${String(err)}`);
    }
  }

  // 2. Seed domain taxonomy
  const domainsSeeded = seedDomains(store);

  // 3. Migrate skills + cache
  const skillRecords = buildSkillRecords(skillsDir);
  if (skillRecords.length > 0) {
    try {
      skillsMigrated = store.bulkUpsertSkills(skillRecords);
      cacheEntriesMigrated = skillRecords.filter((s) => s.manifest_hash).length;
    } catch (err) {
      errors.push(`skills migration: ${String(err)}`);
    }
  }

  return {
    toolsMigrated,
    skillsMigrated,
    domainsSeeded,
    cacheEntriesMigrated,
    errors,
    durationMs: Date.now() - start,
  };
}

// ── Data loaders ───────────────────────────────────────────────────────

/** Load tools from the existing JSON store (TOCTOU-safe) */
function loadToolsJson(dataDir: string): Tool[] {
  try {
    const data = JSON.parse(readFileSync(join(dataDir, "tools.json"), "utf-8"));
    return Array.isArray(data) ? data as Tool[] : [];
  } catch {
    return [];
  }
}

/** Load .skill-cache.json (TOCTOU-safe) */
function loadSkillCache(skillsDir: string): Record<string, { manifestHash: string; repoSha: string; generatedAt: number }> {
  try {
    return JSON.parse(readFileSync(join(skillsDir, ".skill-cache.json"), "utf-8"));
  } catch {
    return {};
  }
}

/** Discover skill directories (TOCTOU-safe) */
function discoverSkills(skillsDir: string): string[] {
  try {
    return readdirSync(skillsDir)
      .filter((d) => d.startsWith("src-"))
      .filter((d) => {
        try {
          readFileSync(join(skillsDir, d, "SKILL.md"), "utf-8");
          return true;
        } catch { return false; }
      });
  } catch {
    return [];
  }
}

/** Build SkillRecord objects from skill directories + cache */
function buildSkillRecords(skillsDir: string): SkillRecord[] {
  const cache = loadSkillCache(skillsDir);
  const dirs = discoverSkills(skillsDir);
  const records: SkillRecord[] = [];

  for (const dir of dirs) {
    const skillMdPath = join(skillsDir, dir, "SKILL.md");
    try {
      const content = readFileSync(skillMdPath, "utf-8");
      const fm = parseFrontmatter(content);
      const cacheEntry = cache[dir];

      records.push({
        id: dir,
        tool_id: null,  // will be linked later if tool exists
        domain: fm?.domain ?? "general",
        subdomain: null,
        name: fm?.name ?? dir.replace(/^src-/, ""),
        description: fm?.description ?? "",
        version: fm?.version ?? "0.0.0",
        tags: fm?.tags ? [...fm.tags].join(",") : "",
        manifest_hash: cacheEntry?.manifestHash ?? null,
        repo_sha: cacheEntry?.repoSha ?? null,
        generated_at: cacheEntry?.generatedAt ?? null,
        trigger_score: null,  // will be computed on next quality check
        quality_score: null,
        content_score: null,
        skill_dir: resolve(skillsDir, dir),
      });
    } catch {
      // Skip unreadable skills
    }
  }

  return records;
}

// ── Domain seeding ─────────────────────────────────────────────────────

/** Seed the domain taxonomy from DOMAIN_TRIGGERS + hierarchical expansion */
function seedDomains(store: UnifiedStore): number {
  let count = 0;

  // Seed flat domains from DOMAIN_TRIGGERS
  for (const [domain, trigger] of Object.entries(DOMAIN_TRIGGERS)) {
    store.upsertDomain(domain, formatLabel(domain), trigger, undefined, 0);
    count++;
  }

  // Add hierarchical sub-domains
  const subdomains: Array<[string, string, string, string]> = [
    // [id, label, triggerPhrase, parentId]
    ["ai-ml/llm-inference", "LLM Inference", "running LLM models locally, serving AI inference, model deployment", "ai-framework"],
    ["ai-ml/rag", "RAG Pipelines", "building retrieval augmented generation, document indexing, context retrieval", "ai-framework"],
    ["ai-ml/fine-tuning", "Fine-Tuning", "fine-tuning models, LoRA training, model adaptation", "ml"],
    ["ai-ml/embeddings", "Embeddings", "generating embeddings, text vectorization, semantic encoding", "vector"],
    ["devops/ci-cd", "CI/CD", "continuous integration, continuous deployment, build pipelines, GitHub Actions", "automation"],
    ["devops/containers", "Containers", "Docker management, container orchestration, image building", "infra"],
    ["devops/monitoring", "Monitoring", "system monitoring, alerting, uptime checks, health monitoring", "observability"],
    ["security/sast", "SAST", "static application security testing, code scanning, vulnerability detection", "security"],
    ["security/secrets", "Secrets Management", "secret scanning, credential management, vault operations", "security"],
    ["data/etl", "ETL", "data extraction, transformation, loading, data pipeline orchestration", "database"],
    ["data/visualization", "Data Visualization", "charts, graphs, dashboards, data plotting", "ui"],
    ["web/api", "APIs", "REST API design, GraphQL, API gateway, API documentation", "web"],
    ["web/frontend", "Frontend", "React, Vue, Svelte, frontend frameworks, SPA development", "ui"],
    ["testing/e2e", "E2E Testing", "end-to-end testing, integration testing, browser testing", "testing"],
    ["testing/load", "Load Testing", "performance testing, load generation, stress testing", "testing"],
    ["cloud/aws", "AWS", "Amazon Web Services, S3, Lambda, EC2, CloudFormation", "cloud"],
    ["cloud/gcp", "GCP", "Google Cloud Platform, BigQuery, Cloud Run, GKE", "cloud"],
    ["cloud/azure", "Azure", "Microsoft Azure, AKS, Azure Functions, Blob Storage", "cloud"],
    ["network/dns", "DNS", "DNS management, domain configuration, record updates", "network"],
    ["network/vpn", "VPN", "VPN setup, tunnel management, WireGuard, OpenVPN", "network"],
  ];

  for (const [id, label, trigger, parentId] of subdomains) {
    store.upsertDomain(id, label, trigger, parentId, 1);
    count++;
  }

  return count;
}

function formatLabel(domain: string): string {
  return domain
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
