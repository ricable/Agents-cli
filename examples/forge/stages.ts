/**
 * forge/stages.ts — Core pipeline stages for skill-forge.
 *
 * Stages: discover, resolveInstallAnalyze, chunkToolSource, forgeSkill,
 * assessQuality, buildIndexes, processBatch
 */

import { join, resolve, dirname } from "node:path";
import {
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  chmodSync,
  appendFileSync,
  readFileSync,
  unlinkSync,
} from "node:fs";

// Core pipeline
import { detectFormat } from "../../lib/resolver.js";
import { findMainBinary, deepProbe, probeWithArgs, probeHelp, probeFlag } from "../../lib/analyzer.js";
import { createStore, generateContextMd, getToolInstallDir } from "../../lib/store.js";

// Skills
import {
  parseFrontmatter,
  generateRichSkillMd,
  generateSkillDirectory,
  installTool,

} from "../../lib/skills.js";

// Skill content
import {
  generatePatternsFile,
  generateApiFile,
  generateSearchScript,
  generateGrepScript,
} from "../../lib/skill-content.js";

// Quality testing
import {
  testSkillSync,
  generateTriggerQueries,
  generateNonTriggerQueries,
} from "../../lib/skill-tester.js";

// Pipeline intelligence
import { classifyIntent } from "../../lib/pipeline/intent.js";
import { extractEntities } from "../../lib/pipeline/entity-extractor.js";
import { parsePrompt } from "../../lib/pipeline/prompt-parser.js";

// Classifiers (multi-registry discovery)
import { discoverNpmPackages } from "../../lib/classifier/npm.js";
import { discoverGitHubRepos } from "../../lib/classifier/github.js";
import { discoverCratesPackages } from "../../lib/classifier/crates.js";
import { discoverPyPIPackages } from "../../lib/classifier/pypi.js";

// Chunking + extraction
import { chunkFileAST, shouldSkipFile, extractMetadataChunks, type AstChunk } from "../../lib/chunker.js";
import { analyzeRepo, extractExportGroups, findEntryPoints, extractCodeBlocks, readReadme, extractReadmeSections, extractCommandsFromReadme, inferBinaryNames } from "../../lib/extractor.js";

// Indexing
import { groupByDomain, generateDomainIndex, generateMasterIndex } from "../../lib/indexes.js";

// Domains
import { DOMAIN_TRIGGERS } from "../../lib/domains.js";

// Guards
import { validateSource, validateToolName } from "../../lib/guards.js";
import { validateFullFrontmatter } from "../../lib/guards.js";

// Cache
import { SkillCache, manifestHash, getRepoHeadSha } from "../../lib/cache.js";

// Types
import type {
  Tool,
  CuratedMeta,
  SkillDirectory,
  Manifest,
  ManifestEntry,
} from "../../lib/types.js";
import type {
  ChunkStats,
  ForgedSkill,
  QualityResult,
  BatchItem,
  BatchResult,
  BatchOutcome,
  DiscoveredPackage,
  DiscoveryResult,
} from "./types.js";
import { DATA_DIR, OUTPUT_DIR } from "./types.js";
import { log, atomicWrite, toolToManifestEntry } from "./helpers.js";
import { toErrorMessage } from "../../lib/output.js";

/** Repos too large (>200MB tarball) to download — skip in batch mode. */
const HUGE_REPOS = new Set([
  "oven-sh/bun", "NVIDIA/TensorRT-LLM", "pytorch/pytorch", "tensorflow/tensorflow",
  "huggingface/transformers", "microsoft/DeepSpeed", "ray-project/ray",
  "PaddlePaddle/PaddleOCR", "PaddlePaddle/Paddle", "apache/spark",
  "apache/airflow", "kubernetes/kubernetes", "rust-lang/rust",
  "llvm/llvm-project", "chromium/chromium", "nicbarker/clay",
  "BerriAI/litellm", "langgenius/dify", "AUTOMATIC1111/stable-diffusion-webui",
  "comfyanonymous/ComfyUI", "oobabooga/text-generation-webui", "invoke-ai/InvokeAI",
  "vllm-project/vllm", "ggml-org/llama.cpp",
  "elastic/elasticsearch", "apache/mxnet", "autogluon/autogluon",
  "PygmalionAI/aphrodite-engine",
]);

// ── Stage 1: Discovery (NL prompt → multi-registry search) ────────────

export async function discover(prompt: string, limit: number): Promise<DiscoveryResult> {
  const parsed   = parsePrompt(prompt);
  const intent   = classifyIntent(prompt);
  const entities = extractEntities(prompt);

  log(`  Intent:       ${intent.intent} (${(intent.confidence * 100).toFixed(0)}%)`);
  log(`  Capabilities: ${parsed.capabilities.join(", ") || "none"}`);
  log(`  Entities:     ${entities.length > 0 ? entities.map(e => e.name).join(", ") : "none"}`);

  const searchTerms = [
    ...parsed.capabilities,
    ...parsed.directTerms,
    ...entities.map(e => e.packageName).filter(Boolean) as string[],
  ].filter(Boolean);

  const query = searchTerms.slice(0, 5).join(" ") || prompt.slice(0, 60);

  log(`\n  Searching registries for: "${query}"...`);

  const [npmResults, githubResults, cratesResults, pypiResults] = await Promise.allSettled([
    discoverNpmPackages(query, limit),
    discoverGitHubRepos(query, limit),
    discoverCratesPackages(query, limit),
    discoverPyPIPackages(query, limit),
  ]);

  const allPackages: DiscoveredPackage[] = [];
  const seen = new Set<string>();

  const addResults = (results: PromiseSettledResult<ManifestEntry[]>, source: string) => {
    if (results.status !== "fulfilled") return;
    for (const pkg of results.value) {
      const key = pkg.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

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

export async function resolveInstallAnalyze(
  source: string,
  deep: boolean,
): Promise<Tool> {
  validateSource(source);

  const format = detectFormat(source);
  if (!format) {
    const pypiSource = `pypi:${source}`;
    if (detectFormat(pypiSource)) {
      log(`  (bare name → trying pypi:${source})`);
      return resolveInstallAnalyze(pypiSource, deep);
    }
    throw new Error(`Unsupported source format: ${source}. Use owner/repo, @scope/pkg, pypi:name, or crates:name`);
  }

  const repoId = source.replace(/^github:/, "");
  if (HUGE_REPOS.has(repoId)) {
    throw new Error(`Skipping oversized repo ${repoId} (>200MB tarball)`);
  }

  log(`  [1/3] Resolving ${source}...`);
  log(`  [2/3] Installing...`);
  const store = createStore(DATA_DIR);
  const tool = await installTool(source, DATA_DIR, { store, verbose: false });
  log(`  → ${tool.meta.name}@${tool.meta.version} (${tool.source.format})`);

  const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);

  let cachedBin: string | null = null;

  if (deep && tool.capabilities.commands.length > 0) {
    log(`  [3/3] Deep probing subcommands...`);
    cachedBin = findMainBinary(installDir);
    if (cachedBin) {
      const probed = deepProbe(cachedBin, { maxDepth: 3 });
      (tool as { capabilities: typeof tool.capabilities }).capabilities = {
        ...tool.capabilities,
        commands: probed.tree,
      };
      log(`  → Deep probe: ${probed.totalCommands} commands discovered`);
    }
  } else {
    log(`  [3/3] Analysis: ${tool.capabilities.commands.length} commands, ${tool.capabilities.globalFlags.length} flags`);
  }

  // Smoke test: verify --version, --help, and sample commands respond
  const smoke = smokeTest(tool, installDir, cachedBin);
  if (smoke.helpOk || smoke.versionOk) {
    const parts: string[] = [];
    if (smoke.versionOk) parts.push("--version");
    if (smoke.helpOk) parts.push("--help");
    if (smoke.commandsVerified > 0) parts.push(`${smoke.commandsVerified} cmds`);
    log(`  → Smoke test: ${parts.join(", ")} OK`);
    // Upgrade analysisMethod to "verified" if commands pass
    if (smoke.commandsVerified > 0 && smoke.commandsFailed === 0) {
      (tool as { capabilities: typeof tool.capabilities }).capabilities = {
        ...tool.capabilities,
        analysisMethod: "verified",
      };
    }
  }

  return tool;
}

// ── Stage 2b: Smoke Test (verify commands respond) ─────────────────────

export interface SmokeTestResult {
  versionOk: boolean;
  helpOk: boolean;
  commandsVerified: number;
  commandsFailed: number;
}

/** Run a quick smoke test on a tool after install: --version, --help, and per-command --help.
 *  Reuses rawHelp from analyzer when available to avoid redundant process spawns. */
export function smokeTest(tool: Tool, installDir: string, cachedBin?: string | null): SmokeTestResult {
  const result: SmokeTestResult = { versionOk: false, helpOk: false, commandsVerified: 0, commandsFailed: 0 };
  const bin = cachedBin ?? findMainBinary(installDir);
  if (!bin) return result;

  const TIMEOUT = 2000;

  // Reuse rawHelp from analyzer if available (avoids re-probing --help)
  result.helpOk = tool.capabilities.rawHelp ? true : probeHelp(bin, TIMEOUT) !== null;
  // --version: direct call without appending help flags
  result.versionOk = probeFlag(bin, "--version", TIMEOUT);

  // Probe top-level commands individually to verify they respond.
  // The shallow analysis path only enriches flags for commands when count < 30,
  // so we always probe here rather than trusting analysisMethod alone.
  const topLevelCmds = tool.capabilities.commands.filter(c => !c.name.includes(" ")).slice(0, 5);
  for (const cmd of topLevelCmds) {
    if (probeWithArgs(bin, [cmd.name], TIMEOUT) !== null) {
      result.commandsVerified++;
    } else {
      result.commandsFailed++;
    }
  }

  return result;
}

// ── Stage 5: Chunking (AST-aware) ─────────────────────────────────────

/** Walk a tool's install dir and collect AST chunks from each file. */
function walkAndChunk(
  installDir: string,
  pkg: string,
  callback: (chunks: AstChunk[], filePath: string) => void,
): void {
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
          const chunks = chunkFileAST(full, pkg, installDir);
          if (chunks.length > 0) {
            callback(chunks, full);
          }
        }
      } catch { /* skip unreadable */ }
    }
  }

  walk(installDir);
}

export function chunkToolSource(tool: Tool): ChunkStats {
  const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);
  if (!existsSync(installDir)) return { files: 0, chunks: 0, byType: {} };

  const stats: ChunkStats = { files: 0, chunks: 0, byType: {} };

  walkAndChunk(installDir, tool.meta.name, (chunks, filePath) => {
    stats.files++;
    stats.chunks += chunks.length;
    for (const c of chunks) {
      stats.byType[c.chunk_type] = (stats.byType[c.chunk_type] ?? 0) + 1;
    }

    // Also extract metadata chunks (JSDoc + signatures)
    const metaChunks = extractMetadataChunks(filePath, tool.meta.name, installDir);
    if (metaChunks.length > 0) {
      stats.byType["metadata"] = (stats.byType["metadata"] ?? 0) + metaChunks.length;
    }
  });

  return stats;
}

// ── Stage 5b: Chunk persistence (db) ──────────────────────────────────

export async function persistChunks(tool: Tool, domain: string): Promise<number> {
  const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);
  if (!existsSync(installDir)) return 0;

  const { getDomainDb } = await import("../../lib/db/domain-db.js");
  const { upsertChunks } = await import("../../lib/db/sqlite.js");

  const domainDb = await getDomainDb(domain);
  let totalPersisted = 0;

  walkAndChunk(installDir, tool.meta.name, (chunks) => {
    upsertChunks(domainDb, chunks);
    totalPersisted += chunks.length;
  });

  return totalPersisted;
}

// ── Stage 6: Generate Compliant Skill Directory ────────────────────────

interface ForgeSkillOptions {
  dryRun: boolean;
  noCache?: boolean;
  force?: boolean;
}

export function forgeSkill(tool: Tool, opts: ForgeSkillOptions): ForgedSkill {
  validateToolName(tool.meta.name);
  const skillDir = resolve(OUTPUT_DIR, tool.meta.name);
  const installDir = getToolInstallDir(DATA_DIR, tool.meta.name);
  const manifestEntry = toolToManifestEntry(tool);
  const cache = (!opts.noCache && !opts.dryRun) ? new SkillCache(OUTPUT_DIR) : null;
  const mHash = manifestEntry ? manifestHash(manifestEntry) : "";
  const rSha = getRepoHeadSha(installDir);

  // Cache check (Gap 1)
  if (cache && !opts.force && manifestEntry) {
    const cached = cache.get(tool.meta.name);
    if (cached && cached.manifestHash === mHash && cached.repoSha === rSha) {
      log(`  → Cache hit: ${tool.meta.name} (skipping regeneration)`);
      return {
        dir: skillDir,
        skillMd: "",
        files: {},
        chunkStats: { files: 0, chunks: 0, byType: {} },
        skipped: true,
      };
    }
  }

  // Extract README sections and attach to tool for richer skill generation
  let readme = "";
  if (existsSync(installDir)) {
    try {
      readme = readReadme(installDir);
      if (readme.length > 50) {
        const sections = extractReadmeSections(readme);
        (tool as { _readmeSections?: typeof sections })._readmeSections = sections;

        // If analyzer found 0 commands, try extracting from README code blocks
        // Try both the tool name and inferred binary names (e.g. "rg" for ripgrep)
        if (tool.capabilities.commands.length === 0) {
          const namesToTry = [tool.meta.name, ...inferBinaryNames(installDir)];
          const seen = new Set<string>();
          const allCommands: Array<{ name: string; description: string }> = [];
          for (const name of namesToTry) {
            if (seen.has(name)) continue;
            seen.add(name);
            const cmds = extractCommandsFromReadme(readme, name);
            for (const c of cmds) {
              if (!allCommands.some(x => x.name === c.name)) allCommands.push(c);
            }
          }
          if (allCommands.length > 0) {
            const synthCommands = allCommands.map(c => ({
              name: c.name,
              description: c.description,
              flags: [] as readonly import("../../lib/types.js").ToolFlag[],
            }));
            tool = {
              ...tool,
              capabilities: {
                ...tool.capabilities,
                commands: synthCommands,
              },
            } as Tool;
          }
        }
      }
    } catch { /* non-fatal */ }
  }

  // Generate skill directory
  let directory: SkillDirectory;
  try {
    directory = generateSkillDirectory(tool);
  } catch (err) {
    log(`  WARN: generateSkillDirectory failed: ${toErrorMessage(err)}`);
    directory = { skillMd: generateRichSkillMd(tool), files: {} };
  }

  // Chunk source for stats
  let chunkStats: ChunkStats;
  if (opts.dryRun) {
    chunkStats = { files: 0, chunks: 0, byType: {} };
  } else {
    try {
      chunkStats = chunkToolSource(tool);
    } catch (err) {
      log(`  WARN: chunking failed: ${toErrorMessage(err)}`);
      chunkStats = { files: 0, chunks: 0, byType: {} };
    }
  }

  // Build file set
  const files: Record<string, string> = { ...directory.files };

  files["CONTEXT.md"] = generateContextMd(tool);

  if (manifestEntry) {
    files["scripts/search.sh"] = generateSearchScript(manifestEntry);
    files["scripts/grep.sh"]   = generateGrepScript(manifestEntry);

    if (existsSync(installDir)) {
      try {
        const analysis = analyzeRepo(manifestEntry, installDir);

        // Enrich references/patterns.md with code blocks from README (Gap 12)
        const codeBlocks = extractCodeBlocks(readme);
        const patterns = generatePatternsFile(manifestEntry, analysis);
        if (patterns) {
          let enrichedPatterns = patterns;
          if (codeBlocks.length > 0) {
            enrichedPatterns += "\n\n## Code Examples from README\n\n";
            for (const block of codeBlocks) {
              enrichedPatterns += "```typescript\n" + block + "\n```\n\n";
            }
          }
          files["references/patterns.md"] = enrichedPatterns;
        }

        // Enrich references/api.md with export groups (Gap 12)
        const api = generateApiFile(manifestEntry, analysis);
        let enrichedApi = api ?? "";
        const entryPoints = findEntryPoints(installDir, tool.meta.name);
        if (entryPoints.length > 0) {
          const exportSections: string[] = [];
          for (const ep of entryPoints.slice(0, 5)) {
            const groups = extractExportGroups(ep);
            if (groups.length > 0) {
              for (const g of groups) {
                const names = g.symbols.join(", ");
                exportSections.push(`- \`${g.module}\`: ${names}`);
              }
            }
          }
          if (exportSections.length > 0) {
            enrichedApi += "\n\n## Export Groups\n\n" + exportSections.join("\n") + "\n";
          }
        }
        if (enrichedApi) files["references/api.md"] = enrichedApi;
      } catch (err) {
        log(`  WARN: repo analysis failed: ${toErrorMessage(err)}`);
      }
    }
  }

  // Write files
  if (!opts.dryRun) {
    const resolvedSkillDir = resolve(skillDir);
    mkdirSync(resolvedSkillDir, { recursive: true });
    atomicWrite(join(resolvedSkillDir, "SKILL.md"), directory.skillMd);

    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = resolve(resolvedSkillDir, relPath);
      if (!fullPath.startsWith(resolvedSkillDir + "/")) {
        throw new Error(`Path traversal detected: "${relPath}" escapes skill directory`);
      }
      mkdirSync(dirname(fullPath), { recursive: true });
      atomicWrite(fullPath, content);

      if (relPath.endsWith(".sh") || relPath.endsWith(".py")) {
        chmodSync(fullPath, 0o755);
      }
    }

    // Update cache (Gap 1)
    if (cache && manifestEntry) {
      cache.set(tool.meta.name, { manifestHash: mHash, repoSha: rSha, generatedAt: Date.now() });
      cache.save();
    }
  }

  return { dir: skillDir, skillMd: directory.skillMd, files, chunkStats };
}

// ── Stage 7: Quality Gate ──────────────────────────────────────────────

export function assessQuality(skillMd: string, name: string): QualityResult {
  const result = testSkillSync("inline", skillMd);

  const fm = parseFrontmatter(skillMd);
  const description = fm?.description ?? "";
  const triggerQueries = generateTriggerQueries(description, name);
  const nonTriggerQueries = generateNonTriggerQueries(description);

  // Validate SKILL.md content (Gap 8) — validateFullFrontmatter includes base validation
  const validationErrors = validateFullFrontmatter(skillMd);

  const passed = result.passed && validationErrors.length === 0;

  return {
    triggerScore: result.triggerScore,
    qualityScore: result.qualityScore,
    passed,
    issues: [...result.issues, ...validationErrors],
    triggerQueries,
    nonTriggerQueries,
    validationErrors,
  };
}

// ── Stage 8: Indexing ──────────────────────────────────────────────────

export async function buildIndexes(tools: Tool[], dryRun: boolean): Promise<void> {
  const entries: ManifestEntry[] = tools.map(toolToManifestEntry).filter(Boolean) as ManifestEntry[];
  if (entries.length === 0) return;

  const byDomain = groupByDomain(entries);

  if (!dryRun) {
    // Write domain indexes
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

    // Merge domain DBs to aggregated DB (Gap 4)
    try {
      const { mergeAllDomainsToAggregated } = await import("../../lib/db/aggregated-db.js");
      const total = await mergeAllDomainsToAggregated((domain, n) => {
        log(`    Merged ${n} chunks from ${domain}`);
      });
      if (total > 0) {
        log(`  Aggregated DB: ${total} total chunks in agentdb.sqlite`);
      }
    } catch {
      // DB modules may not be available — non-fatal
    }
  }

  log(`  Indexes: master + ${byDomain.size} domain indexes${dryRun ? " (dry-run, not written)" : ""}`);
}

// ── Batch processing ──────────────────────────────────────────────────

export interface ProcessBatchOptions {
  deep: boolean;
  noCache?: boolean;
  force?: boolean;
  timeout?: number;
  concurrency?: number;
  checkpointPath?: string;
  resumeFrom?: string;
  onProgress?: (label: string, completed: number, total: number, result: BatchResult | null) => void;
}

/** Race a promise against a timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
    ),
  ]);
}

/** Simple concurrency limiter. */
class Semaphore {
  private queue: Array<() => void> = [];
  private active = 0;
  constructor(private max: number) {}
  async acquire(): Promise<void> {
    if (this.active < this.max) { this.active++; return; }
    return new Promise(resolve => this.queue.push(resolve));
  }
  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) { this.active++; next(); }
  }
}

/** Enrich a Tool's metadata with curated info (description, tags, domain). */
function enrichToolWithCuratedMeta(tool: Tool, curated: CuratedMeta): Tool {
  const enrichedMeta = {
    ...tool.meta,
    // Use curated description if resolver returned a generic/empty one
    description: (tool.meta.description && tool.meta.description.length > 20)
      ? tool.meta.description
      : curated.description,
    tags: [...new Set([
      ...tool.meta.tags,
      ...curated.category.split("/"),
      ...(curated.agentValue.length > 10 ? ["agent-ready"] : []),
    ])],
  };
  // Attach agentValue and category as extra metadata on the tool object
  // so generateRichSkillMd can use them
  return {
    ...tool,
    meta: enrichedMeta,
    _curatedMeta: curated,
  } as Tool;
}

export async function processBatch(items: BatchItem[], opts: ProcessBatchOptions): Promise<BatchOutcome> {
  const results: BatchResult[] = [];
  const failures: Array<{ label: string; error: string }> = [];
  const timeout = opts.timeout ?? 300_000;
  const concurrency = opts.concurrency ?? 1;

  // Resume: load completed labels from checkpoint
  let doneLabels = new Set<string>();
  if (opts.resumeFrom && existsSync(opts.resumeFrom)) {
    try {
      const lines = readFileSync(opts.resumeFrom, "utf-8").split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const entry = JSON.parse(line) as { label: string };
          doneLabels.add(entry.label);
        } catch { /* skip malformed lines */ }
      }
      log(`  Resuming: ${doneLabels.size} tools already completed`);
    } catch { /* ignore read errors */ }
  }

  const toProcess = doneLabels.size > 0 ? items.filter(i => !doneLabels.has(i.label)) : items;
  let completed = items.length - toProcess.length; // already done count

  const processOne = async (item: BatchItem): Promise<void> => {
    log(`\n  ── Forging: ${item.label} ──`);
    try {
      let tool = await withTimeout(
        resolveInstallAnalyze(item.source, opts.deep),
        timeout,
        item.label,
      );
      // Enrich with curated metadata if available
      if (item.curatedMeta) {
        tool = enrichToolWithCuratedMeta(tool, item.curatedMeta);
      }
      const forged = forgeSkill(tool, { dryRun: false, noCache: opts.noCache, force: opts.force });
      completed++;
      if (forged.skipped) {
        log(`  → CACHED (skipped)`);
        // Checkpoint even cached items
        if (opts.checkpointPath) {
          appendFileSync(opts.checkpointPath, JSON.stringify({ label: item.label, status: "cached", timestamp: new Date().toISOString() }) + "\n");
        }
        opts.onProgress?.(item.label, completed, items.length, null);
        return;
      }
      const quality = assessQuality(forged.skillMd, tool.meta.name);
      results.push({ label: item.label, tool, forged, quality });
      log(`  → ${quality.passed ? "PASS" : "FAIL"} (trigger: ${quality.triggerScore.toFixed(2)}, quality: ${quality.qualityScore}/10)`);
      // Checkpoint
      if (opts.checkpointPath) {
        appendFileSync(opts.checkpointPath, JSON.stringify({ label: item.label, status: "ok", timestamp: new Date().toISOString() }) + "\n");
      }
      opts.onProgress?.(item.label, completed, items.length, { label: item.label, tool, forged, quality });
    } catch (err) {
      completed++;
      const msg = toErrorMessage(err);
      failures.push({ label: item.label, error: msg });
      log(`  → SKIP: ${msg}`);
      // Checkpoint failures too
      if (opts.checkpointPath) {
        appendFileSync(opts.checkpointPath, JSON.stringify({ label: item.label, status: "fail", error: msg, timestamp: new Date().toISOString() }) + "\n");
      }
      opts.onProgress?.(item.label, completed, items.length, null);
    }
  };

  if (concurrency <= 1) {
    // Sequential (original behavior)
    for (const item of toProcess) {
      await processOne(item);
    }
  } else {
    // Concurrent with semaphore
    const sem = new Semaphore(concurrency);
    const tasks = toProcess.map(item => async () => {
      await sem.acquire();
      try {
        await processOne(item);
      } finally {
        sem.release();
      }
    });
    await Promise.all(tasks.map(fn => fn()));
  }

  // Clean up checkpoint on full completion (no unfinished items)
  if (opts.checkpointPath && failures.length === 0 && existsSync(opts.checkpointPath)) {
    try { unlinkSync(opts.checkpointPath); } catch { /* ignore */ }
  } else if (opts.checkpointPath && failures.length > 0) {
    log(`  Resume with: --resume ${opts.checkpointPath}`);
  }

  return { results, failures };
}
