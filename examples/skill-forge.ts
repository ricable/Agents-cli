#!/usr/bin/env npx tsx
/**
 * skill-forge.ts — Unified skill generation pipeline
 *
 * Combines key capabilities from agents-cli/lib into a single pipeline that
 * produces Claude-compliant skills with full directory structure:
 *
 *   skill-name/
 *   ├── SKILL.md               (frontmatter + progressive disclosure body)
 *   ├── references/
 *   │   ├── commands.md        (full command tree)
 *   │   ├── flags.md           (per-command flag tables)
 *   │   ├── help-output.md     (raw --help capture)
 *   │   ├── guide.md           (installation + detailed examples)
 *   │   ├── patterns.md        (code examples from README)
 *   │   └── api.md             (exported symbol index)
 *   └── scripts/
 *       ├── search.sh          (FTS keyword search)
 *       ├── grep.sh            (source grep)
 *       ├── validate.py        (single-file uv script — skill validation)
 *       └── install.sh         (npm/npx or uv install helper)
 *
 * Pipeline stages:
 *   1. Discovery   — NL prompt → intent → entities → multi-registry search
 *   2. Resolution  — detect format (github/npm/pypi/crates/local)
 *   3. Installation— download, extract, build
 *   4. Analysis    — deep recursive --help probing (commands, flags, examples)
 *   5. Chunking    — AST-aware semantic chunking of source
 *   6. Generation  — rich SKILL.md + references/ + scripts/
 *   7. Quality     — trigger scoring + structural quality + validation
 *   8. Indexing    — domain grouping + master/domain index skills
 *
 * Compliance:
 *   - Anthropic "Complete Guide to Building Skills for Claude" (PDF)
 *   - platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
 *
 * Usage:
 *   npx tsx examples/skill-forge.ts "build a RAG pipeline with vector search"
 *   npx tsx examples/skill-forge.ts --tool ruff
 *   npx tsx examples/skill-forge.ts --tool astral-sh/uv --deep
 *   npx tsx examples/skill-forge.ts --tool pypi:httpie --deep
 *   npx tsx examples/skill-forge.ts --tool crates:ripgrep
 *   npx tsx examples/skill-forge.ts --audit    # audit all existing skills
 *   npx tsx examples/skill-forge.ts --dry-run "vector search for AI agents"
 */

// ── Imports: every lib module ──────────────────────────────────────────

// Core pipeline
import { detectFormat } from "../lib/resolver.js";
import { findMainBinary, deepProbe } from "../lib/analyzer.js";
import { createStore, generateContextMd, getToolInstallDir } from "../lib/store.js";

// Skills
import {
  parseFrontmatter,
  generateRichSkillMd,
  generateSkillDirectory,
  installTool,
  writeLockfile,
  generateInstallScript,
  generateValidateScript,
} from "../lib/skills.js";

// Skill content (structural generation)
import {
  generatePatternsFile,
  generateApiFile,
  generateSearchScript,
  generateGrepScript,
} from "../lib/skill-content.js";

// Quality testing
import {
  testSkillSync,
  testAllSkillsSync,
  generateTriggerQueries,
  generateNonTriggerQueries,
  printQualityReport,
} from "../lib/skill-tester.js";

// Pipeline intelligence
import { classifyIntent } from "../lib/pipeline/intent.js";
import { extractEntities } from "../lib/pipeline/entity-extractor.js";
import { parsePrompt } from "../lib/pipeline/prompt-parser.js";

// Classifiers (multi-registry discovery)
import { discoverNpmPackages } from "../lib/classifier/npm.js";
import { discoverGitHubRepos } from "../lib/classifier/github.js";
import { discoverCratesPackages } from "../lib/classifier/crates.js";
import { discoverPyPIPackages } from "../lib/classifier/pypi.js";

// Chunking + extraction
import { chunkFileAST, shouldSkipFile } from "../lib/chunker.js";
import { analyzeRepo } from "../lib/extractor.js";

// Indexing
import { groupByDomain, generateDomainIndex, generateMasterIndex } from "../lib/indexes.js";

// Domains
import { DOMAIN_TRIGGERS } from "../lib/domains.js";

// Trending (HTML scraping)
import {
  scrapeTrendingHtml,
  isLikelyCli,
  getWellKnownCliRepos,
  type TrendingRepo,
} from "../lib/classifier/github.js";

// Curated tools registry
import { loadAllTools, getCategories, type CliTool } from "../lib/curated-tools.js";

// Workflow templates
import { generateFromTemplate } from "../lib/pipeline/templates/template-engine.js";
import { getAllTemplates } from "../lib/pipeline/templates/index.js";
import type { WorkflowIntent } from "../lib/types.js";

// Output
import { success, failure, emit } from "../lib/output.js";

// Guards
import { validateSource, validateToolName } from "../lib/guards.js";

// Types
import type {
  Tool,
  SkillDirectory,
  Manifest,
  ManifestEntry,
} from "../lib/types.js";

// Node
import { homedir } from "node:os";
import { join, resolve, basename, dirname } from "node:path";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, chmodSync, statSync, renameSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

// ── Config ─────────────────────────────────────────────────────────────

const DATA_DIR    = join(homedir(), ".agents-cli");
const OUTPUT_DIR  = resolve("examples/generated-skills");

// ── CLI Argument Parsing ───────────────────────────────────────────────

interface CliArgs {
  prompt: string;      // NL prompt for discovery mode
  tool: string;        // direct tool spec (owner/repo, npm:x, pypi:x, crates:x)
  deep: boolean;       // deep recursive --help probing
  audit: boolean;      // audit all existing skills
  dryRun: boolean;     // preview without writing
  limit: number;       // max packages in discovery mode
  json: boolean;       // structured JSON output
  strict: boolean;     // fail on quality gate
  // Trending mode
  trending: boolean;
  language: string;    // --language for trending
  since: string;       // --since daily|weekly|monthly
  // Curated mode
  curated: boolean;
  category: string;    // --category filter
  listCategories: boolean;
  skipInstalled: boolean;
  // Workflow mode
  workflow: boolean;
  out: string;         // --out dir for workflow output
  list: boolean;       // --list templates
  // Enhanced audit
  ai: boolean;         // --ai scoring (Haiku)
  domain: string;      // --domain filter
}

export function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const opts: CliArgs = {
    prompt: "", tool: "", deep: false, audit: false,
    dryRun: false, limit: 10, json: false, strict: false,
    trending: false, language: "", since: "monthly",
    curated: false, category: "", listCategories: false, skipInstalled: false,
    workflow: false, out: "", list: false,
    ai: false, domain: "",
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--tool" && argv[i + 1])        { opts.tool = argv[++i]!; }
    else if (a === "--deep")                  { opts.deep = true; }
    else if (a === "--audit")                 { opts.audit = true; }
    else if (a === "--dry-run")               { opts.dryRun = true; }
    else if (a === "--limit" && argv[i+1])    {
      const parsed = parseInt(argv[++i]!, 10);
      if (Number.isNaN(parsed) || parsed < 1) {
        throw new Error(`Invalid --limit value: "${argv[i]}" (must be a positive integer)`);
      }
      opts.limit = parsed;
    }
    else if (a === "--json")                  { opts.json = true; }
    else if (a === "--strict")                { opts.strict = true; }
    // Trending mode
    else if (a === "--trending")              { opts.trending = true; }
    else if (a === "--language" && argv[i+1]) { opts.language = argv[++i]!; }
    else if (a === "--since" && argv[i+1])    { opts.since = argv[++i]!; }
    // Curated mode
    else if (a === "--curated")               { opts.curated = true; }
    else if (a === "--category" && argv[i+1]) { opts.category = argv[++i]!.toLowerCase(); }
    else if (a === "--list-categories")        { opts.listCategories = true; }
    else if (a === "--skip-installed")         { opts.skipInstalled = true; }
    // Workflow mode
    else if (a === "--workflow")               { opts.workflow = true; }
    else if (a === "--out" && argv[i+1])      { opts.out = argv[++i]!; }
    else if (a === "--list")                  { opts.list = true; }
    // Enhanced audit
    else if (a === "--ai")                    { opts.ai = true; }
    else if (a === "--domain" && argv[i+1])   { opts.domain = argv[++i]!; }
    // Positional → prompt
    else if (!a.startsWith("--"))             { opts.prompt += (opts.prompt ? " " : "") + a; }
  }

  return opts;
}

// ── Stage 1: Discovery (NL prompt → multi-registry search) ────────────

interface DiscoveredPackage {
  name: string;
  source: string;
  description: string;
  relevance: number;
}

interface DiscoveryResult {
  intent: string;
  confidence: number;
  capabilities: string[];
  entities: Array<{ name: string; domain: string }>;
  packages: DiscoveredPackage[];
}

async function discover(prompt: string, limit: number): Promise<DiscoveryResult> {
  // Parse NL prompt
  const parsed   = parsePrompt(prompt);
  const intent   = classifyIntent(prompt);
  const entities = extractEntities(prompt);

  log(`  Intent:       ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%)`);
  log(`  Capabilities: ${parsed.capabilities.join(", ") || "none"}`);
  log(`  Entities:     ${entities.length > 0 ? entities.map(e => e.name).join(", ") : "none"}`);

  // Build search terms from capabilities + entities + direct terms
  const searchTerms = [
    ...parsed.capabilities,
    ...parsed.directTerms,
    ...entities.map(e => e.packageName).filter(Boolean) as string[],
  ].filter(Boolean);

  const query = searchTerms.slice(0, 5).join(" ") || prompt.slice(0, 60);

  log(`\n  Searching registries for: "${query}"...`);

  // Parallel multi-registry search
  const [npmResults, githubResults, cratesResults, pypiResults] = await Promise.allSettled([
    discoverNpmPackages(query, limit),
    discoverGitHubRepos(query, limit),
    discoverCratesPackages(query, limit),
    discoverPyPIPackages(query, limit),
  ]);

  // Flatten + deduplicate + rank by relevance
  const allPackages: DiscoveredPackage[] = [];
  const seen = new Set<string>();

  const addResults = (results: PromiseSettledResult<ManifestEntry[]>, source: string) => {
    if (results.status !== "fulfilled") return;
    for (const pkg of results.value) {
      const key = pkg.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      // Score relevance: how many search terms appear in name + description
      const text = `${pkg.name} ${pkg.description}`.toLowerCase();
      const hits = searchTerms.filter(t => text.includes(t.toLowerCase())).length;
      const relevance = searchTerms.length > 0 ? hits / searchTerms.length : 0.5;

      allPackages.push({ name: pkg.name, source, description: pkg.description, relevance });
    }
  };

  addResults(npmResults, "npm");
  addResults(githubResults, "github");
  addResults(cratesResults, "crates");
  addResults(pypiResults, "pypi");

  // Sort by relevance descending, take top N
  allPackages.sort((a, b) => b.relevance - a.relevance);
  const top = allPackages.slice(0, limit);

  log(`  Found ${allPackages.length} packages (showing top ${top.length})`);

  return {
    intent: intent.intent,
    confidence: intent.confidence,
    capabilities: parsed.capabilities,
    entities: entities.map(e => ({ name: e.name, domain: e.domain })),
    packages: top,
  };
}

// ── Stage 2-4: Resolve → Install → Analyze ────────────────────────────

async function resolveInstallAnalyze(
  source: string,
  deep: boolean,
): Promise<Tool> {
  // Validate input
  validateSource(source);

  // Auto-detect: bare names without / or prefix → try pypi: then npm scope
  const format = detectFormat(source);
  if (!format) {
    // Try as pypi: prefix (common for CLI tools like ruff, uv, httpie)
    const pypiSource = `pypi:${source}`;
    if (detectFormat(pypiSource)) {
      log(`  (bare name → trying pypi:${source})`);
      return resolveInstallAnalyze(pypiSource, deep);
    }
    throw new Error(`Unsupported source format: ${source}. Use owner/repo, @scope/pkg, pypi:name, or crates:name`);
  }

  log(`  [1/3] Resolving ${source}...`);
  log(`  [2/3] Installing...`);
  const store = createStore(DATA_DIR);
  const tool = await installTool(source, DATA_DIR, { store, verbose: false });
  log(`  → ${tool.meta.name}@${tool.meta.version} (${tool.source.format})`);

  // Deep probing if requested
  if (deep && tool.capabilities.commands.length > 0) {
    log(`  [3/3] Deep probing subcommands...`);
    const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);
    const bin = findMainBinary(installDir);
    if (bin) {
      const probed = deepProbe(bin, { maxDepth: 3 });
      (tool as { capabilities: typeof tool.capabilities }).capabilities = {
        ...tool.capabilities,
        commands: probed.tree,
      };
      log(`  → Deep probe: ${probed.totalCommands} commands discovered`);
    }
  } else {
    log(`  [3/3] Analysis: ${tool.capabilities.commands.length} commands, ${tool.capabilities.globalFlags.length} flags`);
  }

  return tool;
}

// ── Stage 5: Chunking (AST-aware) ─────────────────────────────────────

interface ChunkStats {
  files: number;
  chunks: number;
  byType: Record<string, number>;
}

function chunkToolSource(tool: Tool): ChunkStats {
  const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);
  if (!existsSync(installDir)) return { files: 0, chunks: 0, byType: {} };

  const stats: ChunkStats = { files: 0, chunks: 0, byType: {} };

  // Walk source files
  function walk(dir: string, depth = 0): void {
    if (depth > 4) return;
    let dirEntries: string[];
    try { dirEntries = readdirSync(dir); } catch { return; }

    for (const entry of dirEntries) {
      const full = join(dir, entry);
      if (shouldSkipFile(full)) continue;

      try {
        const st = statSync(full);
        if (st.isDirectory()) {
          walk(full, depth + 1);
        } else if (st.isFile() && st.size < 200_000) {
          const chunks = chunkFileAST(full, tool.meta.name, installDir);
          if (chunks.length > 0) {
            stats.files++;
            stats.chunks += chunks.length;
            for (const c of chunks) {
              stats.byType[c.chunk_type] = (stats.byType[c.chunk_type] ?? 0) + 1;
            }
          }
        }
      } catch { /* skip unreadable */ }
    }
  }

  walk(installDir);
  return stats;
}

// ── Stage 6: Generate Compliant Skill Directory ────────────────────────

interface ForgedSkill {
  dir: string;
  skillMd: string;
  files: Record<string, string>;
  chunkStats: ChunkStats;
}

function forgeSkill(tool: Tool, dryRun: boolean): ForgedSkill {
  // Validate tool name before using it in paths or scripts
  validateToolName(tool.meta.name);
  const skillDir = resolve(OUTPUT_DIR, tool.meta.name);

  // Use generateSkillDirectory for SKILL.md + references/
  let directory: SkillDirectory;
  try {
    directory = generateSkillDirectory(tool);
  } catch (err) {
    log(`  WARN: generateSkillDirectory failed: ${(err as Error).message}`);
    // Fallback to just generateRichSkillMd
    directory = { skillMd: generateRichSkillMd(tool), files: {} };
  }

  // Chunk source for stats (informational — not written to disk)
  // Skip in dry-run mode to avoid wasted CPU/memory on large tool trees
  let chunkStats: ChunkStats;
  if (dryRun) {
    chunkStats = { files: 0, chunks: 0, byType: {} };
  } else {
    try {
      chunkStats = chunkToolSource(tool);
    } catch (err) {
      log(`  WARN: chunking failed: ${(err as Error).message}`);
      chunkStats = { files: 0, chunks: 0, byType: {} };
    }
  }

  // Build the full file set (generateSkillDirectory already provides
  // references/*, scripts/install.sh, scripts/validate.py)
  const files: Record<string, string> = { ...directory.files };

  // Always add CONTEXT.md
  files["CONTEXT.md"] = generateContextMd(tool);

  // Generate forge-specific scripts: search.sh + grep.sh
  const manifestEntry = toolToManifestEntry(tool);
  if (manifestEntry) {
    files["scripts/search.sh"] = generateSearchScript(manifestEntry);
    files["scripts/grep.sh"]   = generateGrepScript(manifestEntry);

    // Generate references/patterns.md + references/api.md from repo analysis
    const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);
    if (existsSync(installDir)) {
      try {
        const analysis = analyzeRepo(manifestEntry, installDir);

        const patterns = generatePatternsFile(manifestEntry, analysis);
        if (patterns) files["references/patterns.md"] = patterns;

        const api = generateApiFile(manifestEntry, analysis);
        if (api) files["references/api.md"] = api;
      } catch {
        // analyzeRepo may fail if repo structure doesn't match expected layout
      }
    }
  }

  // Write files unless dry-run
  if (!dryRun) {
    const resolvedSkillDir = resolve(skillDir);
    mkdirSync(resolvedSkillDir, { recursive: true });
    atomicWrite(join(resolvedSkillDir, "SKILL.md"), directory.skillMd);

    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = resolve(resolvedSkillDir, relPath);
      // Path containment check: prevent directory traversal
      if (!fullPath.startsWith(resolvedSkillDir + "/")) {
        throw new Error(`Path traversal detected: "${relPath}" escapes skill directory`);
      }
      mkdirSync(dirname(fullPath), { recursive: true });
      atomicWrite(fullPath, content);

      // Make scripts executable
      if (relPath.endsWith(".sh") || relPath.endsWith(".py")) {
        chmodSync(fullPath, 0o755);
      }
    }
  }

  return { dir: skillDir, skillMd: directory.skillMd, files, chunkStats };
}

// ── Stage 7: Quality Gate ──────────────────────────────────────────────

interface QualityResult {
  triggerScore: number;
  qualityScore: number;
  passed: boolean;
  issues: string[];
  triggerQueries: string[];
  nonTriggerQueries: string[];
}

function assessQuality(skillMd: string, name: string): QualityResult {
  const result = testSkillSync("inline", skillMd);

  // Generate test queries
  const fm = parseFrontmatter(skillMd);
  const description = fm?.description ?? "";
  const triggerQueries = generateTriggerQueries(description, name);
  const nonTriggerQueries = generateNonTriggerQueries(description);

  return {
    triggerScore: result.triggerScore,
    qualityScore: result.qualityScore,
    passed: result.passed,
    issues: result.issues,
    triggerQueries,
    nonTriggerQueries,
  };
}

// ── Stage 8: Indexing ──────────────────────────────────────────────────

function buildIndexes(tools: Tool[], dryRun: boolean): void {
  const entries: ManifestEntry[] = tools.map(toolToManifestEntry).filter(Boolean) as ManifestEntry[];
  if (entries.length === 0) return;

  const byDomain = groupByDomain(entries);

  if (!dryRun) {
    // Write domain index for each domain
    for (const [domain, domainEntries] of byDomain) {
      const indexContent = generateDomainIndex(domain, domainEntries, DOMAIN_TRIGGERS);
      const indexDir = join(OUTPUT_DIR, `_index-${domain}`);
      mkdirSync(indexDir, { recursive: true });
      atomicWrite(join(indexDir, "SKILL.md"), indexContent);
    }

    // Write master index
    const manifest: Manifest = { repos: entries };
    const masterContent = generateMasterIndex(manifest, DOMAIN_TRIGGERS);
    const masterDir = join(OUTPUT_DIR, "_index-master");
    mkdirSync(masterDir, { recursive: true });
    atomicWrite(join(masterDir, "SKILL.md"), masterContent);
  }

  log(`  Indexes: master + ${byDomain.size} domain indexes${dryRun ? " (dry-run, not written)" : ""}`);
}

// Script generators are now imported from lib/skills.ts:
// generateInstallScript, generateValidateScript

// ── Helpers ────────────────────────────────────────────────────────────

export function inferDomainFromTool(tool: Tool): string {
  const text = `${tool.meta.name} ${tool.meta.description} ${(tool.meta.tags as string[]).join(" ")}`.toLowerCase();
  let bestDomain = "build";
  let bestScore = 0;
  for (const [domain, triggers] of Object.entries(DOMAIN_TRIGGERS)) {
    const keywords = triggers.toLowerCase().split(/[,\s]+/).filter(k => k.length > 3);
    const hits = keywords.filter(k => text.includes(k)).length;
    if (hits > bestScore) { bestScore = hits; bestDomain = domain; }
  }
  return bestDomain;
}

export function toolToManifestEntry(tool: Tool): ManifestEntry | null {
  // lookupDomain requires a manifest entries list; we don't have one in direct mode,
  // so infer domain from DOMAIN_TRIGGERS keywords matching the tool description
  const domain = inferDomainFromTool(tool);
  // Only use URI as repo if it's a GitHub slug; otherwise use the tool name
  const repo = tool.source.format === "github" ? tool.source.uri : tool.meta.name;
  return {
    name: tool.meta.name,
    repo,
    domain,
    description: tool.meta.description || `CLI tool: ${tool.meta.name}`,
  };
}

let quiet = false;
function log(msg: string): void {
  if (!quiet) console.log(msg);
}

/** Atomic write: write to temp file then rename for crash safety */
function atomicWrite(filePath: string, content: string): void {
  const tmp = filePath + ".tmp." + randomBytes(4).toString("hex");
  writeFileSync(tmp, content, "utf-8");
  renameSync(tmp, filePath);
}

export function fmtTable(rows: string[][], headers: string[]): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? "").length))
  );
  const sep = widths.map(w => "─".repeat(w + 2)).join("┼");
  const fmt = (row: string[]) =>
    row.map((c, i) => ` ${(c ?? "").padEnd(widths[i]!)} `).join("│");

  return [
    `┌${sep.replace(/┼/g, "┬")}┐`,
    `│${fmt(headers)}│`,
    `├${sep}┤`,
    ...rows.map(r => `│${fmt(r)}│`),
    `└${sep.replace(/┼/g, "┴")}┘`,
  ].join("\n");
}

// ── Mode: Trending (GitHub trending → skills) ─────────────────────────

async function trendingMode(args: CliArgs, startTime: number): Promise<void> {
  log(`  Mode:     trending`);
  log(`  Language: ${args.language || "all"}`);
  log(`  Period:   ${args.since}`);
  log(`  Limit:    ${args.limit}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  // Scrape trending repos
  log(`  Scraping GitHub trending page...`);
  let allRepos = await scrapeTrendingHtml(args.language, args.since);
  log(`  Found ${allRepos.length} trending repos`);

  if (allRepos.length === 0) {
    log("  Scraping returned 0 repos — falling back to well-known CLI repos...");
    allRepos = getWellKnownCliRepos();
  }

  // Filter for CLI tools
  const cliCandidates: { repo: TrendingRepo; reason: string }[] = [];
  const nonCli: TrendingRepo[] = [];

  for (const repo of allRepos) {
    const { likely, reason } = isLikelyCli(repo);
    if (likely) {
      cliCandidates.push({ repo, reason });
    } else {
      nonCli.push(repo);
    }
  }

  // Supplement with well-known repos if few CLI matches
  const supplementRepos = cliCandidates.length < 10 ? getWellKnownCliRepos() : [];
  const seen = new Set(allRepos.map(r => r.fullName));
  const extra = supplementRepos.filter(r => !seen.has(r.fullName));

  const toProcess = [
    ...cliCandidates.map(c => c.repo),
    ...nonCli,
    ...extra,
  ].slice(0, args.limit);

  log(`  CLI candidates: ${cliCandidates.length} (strong match)`);
  for (const { repo, reason } of cliCandidates.slice(0, args.limit)) {
    log(`    ${repo.fullName} — ${reason}`);
  }

  if (args.dryRun) {
    log(`\n  Dry run complete. ${toProcess.length} repos would be processed.`);
    if (args.json) {
      emit(success("skill-forge:trending", {
        repos: toProcess.map(r => ({ fullName: r.fullName, language: r.language, description: r.description })),
        cliCandidates: cliCandidates.length,
        total: toProcess.length,
      }, startTime), true);
    }
    return;
  }

  // Process each repo through the forge pipeline
  const results: Array<{ repo: TrendingRepo; tool: Tool; quality: QualityResult }> = [];
  const failures: Array<{ repo: TrendingRepo; error: string }> = [];

  for (const repo of toProcess) {
    log(`\n  ── Forging: ${repo.fullName} ──`);
    try {
      const tool = await resolveInstallAnalyze(repo.fullName, args.deep);
      const forged = forgeSkill(tool, false);
      const quality = assessQuality(forged.skillMd, tool.meta.name);
      results.push({ repo, tool, quality });
      log(`  → ${quality.passed ? "PASS" : "FAIL"} (trigger: ${quality.triggerScore.toFixed(2)}, quality: ${quality.qualityScore}/10)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ repo, error: msg });
      log(`  → SKIP: ${msg}`);
    }
  }

  // Build indexes
  if (results.length > 0) {
    log("\n  Building indexes...");
    buildIndexes(results.map(r => r.tool), false);
  }

  // Summary
  log("\n  ═══════════════════════════════════════════════════════");
  log("  Trending Pipeline Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Processed: ${results.length} | Failed: ${failures.length}`);

  if (results.length > 0) {
    const rows = results.map(r => [
      r.tool.meta.name.slice(0, 25),
      r.repo.language,
      `${r.tool.capabilities.commands.length}`,
      r.quality.triggerScore.toFixed(2),
      r.quality.passed ? "PASS" : "FAIL",
    ]);
    log(fmtTable(rows, ["Skill", "Lang", "Cmds", "Trigger", "Status"]));
  }

  if (args.json) {
    emit(success("skill-forge:trending", {
      processed: results.length,
      failed: failures.length,
      results: results.map(r => ({
        name: r.tool.meta.name,
        repo: r.repo.fullName,
        commands: r.tool.capabilities.commands.length,
        quality: r.quality,
      })),
    }, startTime), true);
  }
}

// ── Mode: Curated (registry of known tools → skills) ──────────────────

async function curatedMode(args: CliArgs, startTime: number): Promise<void> {
  const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const allTools = loadAllTools(projectRoot);

  // --list-categories
  if (args.listCategories) {
    const cats = new Map<string, number>();
    for (const t of allTools) {
      cats.set(t.category, (cats.get(t.category) ?? 0) + 1);
    }
    log(`\n  ${allTools.length} tools across ${cats.size} categories:\n`);
    const sorted = [...cats.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [cat, count] of sorted) {
      log(`    ${cat.padEnd(35)} ${count} tools`);
    }
    log(`\n  Filter with: --category <name>  (partial match, e.g. "ai-ml" or "security")\n`);
    if (args.json) {
      emit(success("skill-forge:curated", {
        total: allTools.length,
        categories: Object.fromEntries(sorted),
      }, startTime), true);
    }
    return;
  }

  // Filter by category
  let tools = allTools;
  if (args.category) {
    tools = tools.filter(t => t.category.toLowerCase().includes(args.category));
  }

  // Apply limit
  if (args.limit > 0) {
    tools = tools.slice(0, args.limit);
  }

  log(`  Mode:     curated`);
  log(`  Tools:    ${tools.length} / ${allTools.length}`);
  if (args.category) log(`  Category: ${args.category}`);
  log(`  Dry run:  ${args.dryRun}`);
  log("");

  // Group by category for display
  const categories = new Map<string, CliTool[]>();
  for (const t of tools) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category)!.push(t);
  }

  for (const [cat, catTools] of categories) {
    log(`  ${cat} (${catTools.length})`);
    for (const t of catTools) {
      const srcLabel = t.sourceType === "npm" ? `npm:${t.source}` : t.source;
      log(`    ${t.name.padEnd(16)} ${srcLabel.padEnd(35)} ${t.description.slice(0, 50)}`);
    }
    log("");
  }

  if (args.dryRun) {
    log(`  Dry run complete. ${tools.length} tools would be processed.`);
    if (args.json) {
      emit(success("skill-forge:curated", {
        tools: tools.map(t => ({ name: t.name, source: t.source, category: t.category })),
        total: tools.length,
      }, startTime), true);
    }
    return;
  }

  // Process each tool
  const store = createStore(DATA_DIR);
  const results: Array<{ meta: CliTool; tool: Tool; quality: QualityResult }> = [];
  const failures: Array<{ meta: CliTool; error: string }> = [];
  const skipped: CliTool[] = [];

  for (const meta of tools) {
    // Skip installed if requested
    if (args.skipInstalled) {
      const skillPath = join(OUTPUT_DIR, meta.name, "SKILL.md");
      if (existsSync(skillPath)) {
        log(`  Skipping ${meta.name} (already has SKILL.md)`);
        skipped.push(meta);
        continue;
      }
    }

    log(`\n  ── Forging: ${meta.name} ──`);
    try {
      // Convert CliTool source to forge-compatible source
      const source = meta.sourceType === "npm"
        ? (meta.source.startsWith("@") ? meta.source : `npm:${meta.source}`)
        : meta.source;

      const tool = await resolveInstallAnalyze(source, args.deep);
      const forged = forgeSkill(tool, false);
      const quality = assessQuality(forged.skillMd, tool.meta.name);
      results.push({ meta, tool, quality });
      log(`  → ${quality.passed ? "PASS" : "FAIL"} (trigger: ${quality.triggerScore.toFixed(2)}, quality: ${quality.qualityScore}/10)`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failures.push({ meta, error: msg });
      log(`  → SKIP: ${msg}`);
    }
  }

  // Build indexes
  if (results.length > 0) {
    log("\n  Building indexes...");
    buildIndexes(results.map(r => r.tool), false);
  }

  // Summary
  log("\n  ═══════════════════════════════════════════════════════");
  log("  Curated Pipeline Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Processed: ${results.length} | Failed: ${failures.length} | Skipped: ${skipped.length}`);

  if (results.length > 0) {
    const rows = results.map(r => [
      r.tool.meta.name.slice(0, 25),
      r.meta.category,
      `${r.tool.capabilities.commands.length}`,
      r.quality.triggerScore.toFixed(2),
      r.quality.passed ? "PASS" : "FAIL",
    ]);
    log(fmtTable(rows, ["Skill", "Category", "Cmds", "Trigger", "Status"]));
  }

  if (args.json) {
    emit(success("skill-forge:curated", {
      processed: results.length,
      failed: failures.length,
      skipped: skipped.length,
      results: results.map(r => ({
        name: r.tool.meta.name,
        category: r.meta.category,
        commands: r.tool.capabilities.commands.length,
        quality: r.quality,
      })),
    }, startTime), true);
  }
}

// ── Mode: Workflow (NL prompt → agent code from templates) ─────────────

function workflowMode(args: CliArgs, startTime: number): void {
  const outDir = resolve(args.out || "examples/generated-workflows");

  // --list: show available templates
  if (args.list) {
    const templates = getAllTemplates();
    log("\n  Available workflow templates:\n");
    for (const t of templates) {
      log(`  ${t.name}`);
      log(`    Strategy: ${t.strategy}`);
      log(`    ${t.description}\n`);
    }
    if (args.json) {
      emit(success("skill-forge:workflow", {
        templates: templates.map(t => ({ name: t.name, strategy: t.strategy, description: t.description })),
      }, startTime), true);
    }
    return;
  }

  if (!args.prompt) {
    log('  Usage: npx tsx examples/skill-forge.ts --workflow "build a code review council"');
    log("         npx tsx examples/skill-forge.ts --workflow --list");
    return;
  }

  // Analyze prompt
  const intent = classifyIntent(args.prompt);
  const parsed = parsePrompt(args.prompt);
  const entities = extractEntities(args.prompt);

  // Build synthetic discovered packages from entities
  const packages = entities
    .filter(e => e.packageName)
    .map(e => ({
      name: e.packageName!,
      repo: e.repoSlug ?? "",
      source: e.source,
      domain: e.domain,
      description: `${e.name} package`,
      quality_score: 0.8,
    }));

  log(`  Mode:         workflow`);
  log(`  Prompt:       ${args.prompt}`);
  log(`  Intent:       ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%)`);
  log(`  Capabilities: ${parsed.capabilities.join(", ") || "none"}`);
  log(`  Entities:     ${entities.map(e => e.name).join(", ") || "none"}`);

  if (args.dryRun) {
    log(`\n  (dry-run — no files written)\n`);
    if (args.json) {
      emit(success("skill-forge:workflow", {
        prompt: args.prompt,
        intent: { type: intent.intent, confidence: intent.confidence },
        capabilities: parsed.capabilities,
        entities: entities.map(e => ({ name: e.name, type: e.type })),
      }, startTime), true);
    }
    return;
  }

  // Generate agent code from template
  const result = generateFromTemplate(
    intent.intent as WorkflowIntent,
    packages,
    entities,
    { name: args.prompt.slice(0, 30) },
  );

  if (!result) {
    log(`\n  No matching workflow template for intent "${intent.intent}".`);
    log(`  Available: ${getAllTemplates().map(t => t.name).join(", ")}`);
    log(`  Try: "code review council", "content publishing", "e-commerce", "personal assistant"\n`);
    return;
  }

  log(`  Template:     ${result.template.name}`);
  log(`  Strategy:     ${result.template.strategy}`);

  // Write to output directory
  const slugName = args.prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const outPath = join(outDir, slugName);
  mkdirSync(outPath, { recursive: true });

  atomicWrite(join(outPath, "agent.ts"), result.code);

  if (result.envVars.length > 0) {
    atomicWrite(join(outPath, ".env.example"), result.envVars.map((v: string) => `${v}=`).join("\n") + "\n");
  }

  log(`\n  Generated workflow:`);
  log(`  Output:   ${outPath}/`);
  log(`  Agent:    ${result.code.split("\n").length} lines`);
  if (result.envVars.length > 0) {
    log(`  Env vars: ${result.envVars.join(", ")}`);
  }

  const preview = result.code.split("\n").slice(0, 8).map((l: string) => `    ${l}`).join("\n");
  log(`\n  Preview:\n${preview}\n    ...\n`);

  if (args.json) {
    emit(success("skill-forge:workflow", {
      template: { name: result.template.name, strategy: result.template.strategy },
      output: outPath,
      lines: result.code.split("\n").length,
      envVars: result.envVars,
    }, startTime), true);
  }
}

// ── Mode: Audit existing skills ────────────────────────────────────────

async function runAudit(strict: boolean, jsonMode: boolean, startTime: number, domain?: string, ai?: boolean): Promise<void> {
  log("\n  Skill Quality Audit");
  log(`  Directory: ${OUTPUT_DIR}`);
  if (domain) log(`  Domain:    ${domain}`);
  if (ai) log(`  AI:        enabled (Haiku scoring)`);
  log("");

  // testAllSkillsSync supports domain filtering
  const results = testAllSkillsSync(OUTPUT_DIR, domain);

  if (results.length === 0) {
    log("  No skills found to audit.");
    if (jsonMode) {
      emit(success("skill-forge:audit", { total: 0, passed: 0, failed: 0, results: [] }, startTime), true);
    }
    return;
  }

  // Group by domain using the indexes module
  const entries: ManifestEntry[] = [];
  for (const r of results) {
    try {
      const content = readFileSync(r.skillPath, "utf-8");
      const fm = parseFrontmatter(content);
      if (fm) {
        entries.push({
          name: fm.name,
          repo: "",
          domain: (fm as unknown as Record<string, unknown>).domain as string ?? "uncategorized",
          description: fm.description ?? "",
        });
      }
    } catch { /* skip */ }
  }
  const grouped = groupByDomain(entries);

  printQualityReport(results);

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  // Domain summary
  log("  Domain Distribution:");
  for (const [d, items] of [...grouped].sort((a, b) => b[1].length - a[1].length)) {
    const count = String(items.length).padStart(4);
    const triggers = DOMAIN_TRIGGERS[d];
    const hint = triggers ? ` (${triggers.split(",").slice(0, 3).map(s => s.trim()).join(", ")})` : "";
    log(`    ${d.padEnd(20)} ${count} skills${hint}`);
  }
  log("");

  // Optional AI scoring
  let aiScores: Array<{ name: string; score: number | null }> | null = null;
  if (ai) {
    log("  Running AI quality scoring...");
    try {
      const { testAllSkills } = await import("../lib/skill-tester.js");
      const fullResults = await testAllSkills(OUTPUT_DIR, true, domain);
      aiScores = fullResults.map(r => ({
        name: r.skillName,
        score: r.qualityScore,
      }));
      const scored = aiScores.filter(a => a.score !== null);
      if (scored.length > 0) {
        const avg = scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length;
        log(`  AI Quality Scores (${scored.length} scored):`);
        log(`    Average: ${avg.toFixed(1)}/10`);
        const low = scored.filter(a => (a.score ?? 10) < 6);
        if (low.length > 0) {
          log(`    Below threshold: ${low.length}`);
          for (const a of low) log(`      - ${a.name}: ${a.score}/10`);
        }
        log("");
      }
    } catch (err) {
      log(`  AI scoring failed: ${(err as Error).message}`);
    }
  }

  // Summary stats
  const avgTrigger = results.reduce((s, r) => s + r.triggerScore, 0) / results.length;
  const avgQuality = results.reduce((s, r) => s + r.qualityScore, 0) / results.length;
  log(`  Summary:`);
  log(`    Total:       ${results.length}`);
  log(`    Passed:      ${passed} (${((passed / results.length) * 100).toFixed(0)}%)`);
  log(`    Avg trigger: ${avgTrigger.toFixed(2)}`);
  log(`    Avg quality: ${avgQuality.toFixed(1)}/10`);
  log(`    Domains:     ${grouped.size}`);
  log("");

  if (jsonMode) {
    const domains: Record<string, { total: number; passed: number }> = {};
    for (const [d, items] of grouped) {
      domains[d] = { total: items.length, passed: 0 };
    }
    emit(success("skill-forge:audit", {
      total: results.length,
      passed,
      failed,
      avgTriggerScore: avgTrigger,
      avgQualityScore: avgQuality,
      domains,
      results: results.map(r => ({
        name: r.name,
        passed: r.passed,
        triggerScore: r.triggerScore,
        qualityScore: r.qualityScore,
        issues: r.issues,
        aiScore: aiScores?.find(a => a.name === r.name)?.score ?? null,
      })),
    }, startTime), true);
  }

  if (strict && failed > 0) {
    process.exitCode = 1;
    log(`  STRICT MODE: ${failed} skills failed quality gate.`);
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const startTime = Date.now();
  const args = parseArgs();
  quiet = args.json;

  log("");
  log("  ╔═══════════════════════════════════════════════════════╗");
  log("  ║           skill-forge — Unified Skill Pipeline        ║");
  log("  ╚═══════════════════════════════════════════════════════╝");
  log("");

  // ── Mode: Trending ──
  if (args.trending) {
    await trendingMode(args, startTime);
    return;
  }

  // ── Mode: Curated ──
  if (args.curated || args.listCategories) {
    await curatedMode(args, startTime);
    return;
  }

  // ── Mode: Workflow ──
  if (args.workflow) {
    workflowMode(args, startTime);
    return;
  }

  // ── Mode: Audit ──
  if (args.audit) {
    await runAudit(args.strict, args.json, startTime, args.domain || undefined, args.ai || undefined);
    return;
  }

  // ── Mode: Direct tool ──
  if (args.tool) {
    log(`  Mode:   direct tool`);
    log(`  Source:  ${args.tool}`);
    log(`  Deep:    ${args.deep}`);
    log(`  Dry run: ${args.dryRun}`);
    log("");

    const tool = await resolveInstallAnalyze(args.tool, args.deep);
    const forged = forgeSkill(tool, args.dryRun);
    const quality = assessQuality(forged.skillMd, tool.meta.name);

    printResult(tool, forged, quality, args);

    if (args.json) {
      emit(success("skill-forge", {
        tool: tool.meta.name,
        version: tool.meta.version,
        commands: tool.capabilities.commands.length,
        flags: tool.capabilities.globalFlags.length,
        chunks: forged.chunkStats,
        quality,
        files: Object.keys(forged.files),
        dir: forged.dir,
      }, startTime), true);
    }

    if (args.strict && !quality.passed) {
      process.exitCode = 1;
    }

    return;
  }

  // ── Mode: Discovery from NL prompt ──
  if (!args.prompt) {
    log("  Usage:");
    log('    npx tsx examples/skill-forge.ts "build a RAG pipeline"');
    log("    npx tsx examples/skill-forge.ts --tool ruff --deep");
    log("    npx tsx examples/skill-forge.ts --audit [--domain X] [--ai]");
    log("    npx tsx examples/skill-forge.ts --trending [--language rust] [--since weekly]");
    log("    npx tsx examples/skill-forge.ts --curated [--category ai-ml] [--skip-installed]");
    log('    npx tsx examples/skill-forge.ts --workflow "build a code review council"');
    log("    npx tsx examples/skill-forge.ts --workflow --list");
    log("");
    return;
  }

  log(`  Mode:    discovery`);
  log(`  Prompt:  "${args.prompt}"`);
  log(`  Limit:   ${args.limit}`);
  log(`  Dry run: ${args.dryRun}`);
  log("");

  // Stage 1: Discovery
  const discovery = await discover(args.prompt, args.limit);

  if (discovery.packages.length === 0) {
    log("  No packages found. Try a more specific prompt.");
    return;
  }

  log("");
  const rows = discovery.packages.slice(0, 15).map(p => [
    p.name.slice(0, 35),
    p.source,
    (p.relevance * 100).toFixed(0) + "%",
    p.description.slice(0, 50),
  ]);
  log(fmtTable(rows, ["Package", "Source", "Relevance", "Description"]));

  if (args.dryRun) {
    log("\n  Dry run complete. Remove --dry-run to install and forge skills.");
    return;
  }

  // Stage 2-7: Process top packages
  log("");
  const tools: Tool[] = [];
  const forged: Array<{ tool: Tool; result: ForgedSkill; quality: QualityResult }> = [];

  for (const pkg of discovery.packages.slice(0, args.limit)) {
    log(`\n  ── Forging: ${pkg.name} ──`);
    try {
      // Prefix with registry source so resolveInstallAnalyze picks the right installer
      const source = pkg.source === "github" ? pkg.name
                   : pkg.source === "crates" ? `crates:${pkg.name}`
                   : pkg.source === "pypi" ? `pypi:${pkg.name}`
                   : pkg.source === "npm" ? (pkg.name.startsWith("@") ? pkg.name : `npm:${pkg.name}`)
                   : pkg.name;
      const tool = await resolveInstallAnalyze(source, args.deep);
      const result = forgeSkill(tool, args.dryRun);
      const quality = assessQuality(result.skillMd, tool.meta.name);
      tools.push(tool);
      forged.push({ tool, result, quality });
      log(`  → ${quality.passed ? "PASS" : "FAIL"} (trigger: ${quality.triggerScore.toFixed(2)}, quality: ${quality.qualityScore}/10)`);
    } catch (err) {
      log(`  → SKIP: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Stage 8: Build indexes
  if (tools.length > 0) {
    log("\n  Building indexes...");
    buildIndexes(tools, args.dryRun);
  }

  // Generate lockfile
  if (tools.length > 0 && !args.dryRun) {
    try {
      const lockPath = join(OUTPUT_DIR, "agentcli.lock");
      writeLockfile(lockPath, tools);
      log(`  Lockfile: ${lockPath}`);
    } catch (err) {
      log(`  WARN: lockfile generation failed: ${(err as Error).message}`);
    }
  }

  // Summary
  log("\n  ═══════════════════════════════════════════════════════");
  log("  Summary");
  log("  ═══════════════════════════════════════════════════════");
  log(`  Prompt:     "${args.prompt}"`);
  log(`  Intent:     ${discovery.intent} (${(discovery.confidence * 100).toFixed(0)}%)`);
  log(`  Discovered: ${discovery.packages.length} packages`);
  log(`  Forged:     ${forged.length} skills`);
  log(`  Passed QA:  ${forged.filter(f => f.quality.passed).length}/${forged.length}`);
  log(`  Output:     ${OUTPUT_DIR}`);
  log("");

  if (forged.length > 0) {
    const summaryRows = forged.map(f => [
      f.tool.meta.name.slice(0, 25),
      `${f.tool.capabilities.commands.length}`,
      `${Object.keys(f.result.files).length}`,
      f.quality.triggerScore.toFixed(2),
      `${f.quality.qualityScore}`,
      f.quality.passed ? "PASS" : "FAIL",
    ]);
    log(fmtTable(summaryRows, ["Skill", "Cmds", "Files", "Trigger", "Quality", "Status"]));
  }

  if (args.json) {
    emit(success("skill-forge", {
      prompt: args.prompt,
      intent: discovery.intent,
      discovered: discovery.packages.length,
      forged: forged.map(f => ({
        name: f.tool.meta.name,
        commands: f.tool.capabilities.commands.length,
        files: Object.keys(f.result.files),
        quality: f.quality,
      })),
    }, startTime), true);
  }
}

function printResult(tool: Tool, forged: ForgedSkill, quality: QualityResult, args: CliArgs): void {
  log("");
  log("  Result");
  log("  ─────────────────────────────────────────────────");
  log(`  Tool:       ${tool.meta.name}@${tool.meta.version}`);
  log(`  Source:     ${tool.source.uri}`);
  log(`  Commands:   ${tool.capabilities.commands.length}`);
  log(`  Flags:      ${tool.capabilities.globalFlags.length}`);
  log(`  Chunks:     ${forged.chunkStats.chunks} (${forged.chunkStats.files} files)`);
  log("");

  log("  Generated Files:");
  log(`    SKILL.md`);
  for (const relPath of Object.keys(forged.files).sort()) {
    log(`    ${relPath}`);
  }
  log("");

  log("  Quality Gate:");
  log(`    Trigger score:  ${quality.triggerScore.toFixed(2)} ${quality.triggerScore >= 0.8 ? "(PASS)" : "(FAIL, need >= 0.80)"}`);
  log(`    Quality score:  ${quality.qualityScore}/10 ${quality.qualityScore >= 6 ? "(PASS)" : "(FAIL, need >= 6)"}`);
  if (quality.issues.length > 0) {
    for (const issue of quality.issues) {
      log(`    ! ${issue}`);
    }
  }
  log("");

  log("  Trigger Test Queries (should activate):");
  for (const q of quality.triggerQueries.slice(0, 5)) {
    log(`    - "${q}"`);
  }
  log("");

  log("  Non-Trigger Queries (should NOT activate):");
  for (const q of quality.nonTriggerQueries.slice(0, 3)) {
    log(`    - "${q}"`);
  }

  if (!args.dryRun) {
    log("");
    log(`  Output: ${forged.dir}/`);
    log(`  Validate: uv run ${forged.dir}/scripts/validate.py`);
  }
  log("");
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  if (process.argv.includes("--json")) {
    emit(failure("skill-forge", "FATAL", message, Date.now()), true);
  } else {
    console.error(`\nFatal: ${message}`);
  }
  process.exitCode = 1;
});
