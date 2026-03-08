#!/usr/bin/env npx tsx
/**
 * skill-forge.ts — Unified skill generation pipeline
 *
 * Combines EVERY capability from agents-cli/lib into a single pipeline that
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
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, chmodSync, statSync } from "node:fs";

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
}

function parseArgs(): CliArgs {
  const argv = process.argv.slice(2);
  const opts: CliArgs = {
    prompt: "", tool: "", deep: false, audit: false,
    dryRun: false, limit: 10, json: false, strict: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--tool" && argv[i + 1])    { opts.tool = argv[++i]!; }
    else if (a === "--deep")              { opts.deep = true; }
    else if (a === "--audit")             { opts.audit = true; }
    else if (a === "--dry-run")           { opts.dryRun = true; }
    else if (a === "--limit" && argv[i+1]){ opts.limit = parseInt(argv[++i]!, 10); }
    else if (a === "--json")              { opts.json = true; }
    else if (a === "--strict")            { opts.strict = true; }
    else if (!a.startsWith("--"))         { opts.prompt += (opts.prompt ? " " : "") + a; }
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
  const skillDir = join(OUTPUT_DIR, tool.meta.name);

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
  let chunkStats: ChunkStats;
  try {
    chunkStats = chunkToolSource(tool);
  } catch (err) {
    log(`  WARN: chunking failed: ${(err as Error).message}`);
    chunkStats = { files: 0, chunks: 0, byType: {} };
  }

  // Build the full file set
  const files: Record<string, string> = { ...directory.files };

  // Always add CONTEXT.md
  files["CONTEXT.md"] = generateContextMd(tool);

  // Generate scripts/install.sh — npm/npx or uv depending on source
  files["scripts/install.sh"] = generateInstallScript(tool);

  // Generate scripts/validate.py — uv single-file script for validation
  files["scripts/validate.py"] = generateValidateScript();

  // Generate scripts/search.sh + scripts/grep.sh if we have a manifest entry
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
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(join(skillDir, "SKILL.md"), directory.skillMd, "utf-8");

    for (const [relPath, content] of Object.entries(files)) {
      const fullPath = join(skillDir, relPath);
      mkdirSync(dirname(fullPath), { recursive: true });
      writeFileSync(fullPath, content, "utf-8");

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

function buildIndexes(tools: Tool[]): void {
  const entries: ManifestEntry[] = tools.map(toolToManifestEntry).filter(Boolean) as ManifestEntry[];
  if (entries.length === 0) return;

  const byDomain = groupByDomain(entries);

  // Write domain index for each domain
  for (const [domain, domainEntries] of byDomain) {
    const indexContent = generateDomainIndex(domain, domainEntries, DOMAIN_TRIGGERS);
    const indexDir = join(OUTPUT_DIR, `_index-${domain}`);
    mkdirSync(indexDir, { recursive: true });
    writeFileSync(join(indexDir, "SKILL.md"), indexContent, "utf-8");
  }

  // Write master index
  const manifest: Manifest = { repos: entries };
  const masterContent = generateMasterIndex(manifest, DOMAIN_TRIGGERS);
  const masterDir = join(OUTPUT_DIR, "_index-master");
  mkdirSync(masterDir, { recursive: true });
  writeFileSync(join(masterDir, "SKILL.md"), masterContent, "utf-8");

  log(`  Indexes: master + ${byDomain.size} domain indexes`);
}

// ── Script Generators ──────────────────────────────────────────────────

function generateInstallScript(tool: Tool): string {
  const name = tool.meta.name;
  const lines: string[] = [
    "#!/usr/bin/env bash",
    `# Install ${name} — auto-detected from source format`,
    "set -euo pipefail",
    "",
  ];

  // Strip registry prefix from URI for install commands
  const pkg = tool.source.uri.replace(/^(pypi|crates|npm):/, "");

  switch (tool.source.format) {
    case "npm":
      lines.push(`# Install via npm (global)`, `npm install -g ${pkg}`, "");
      lines.push(`# Or run without installing`, `npx ${pkg} --help`);
      break;
    case "pypi":
      lines.push(`# Install via uv (recommended)`, `uv tool install ${pkg}`, "");
      lines.push(`# Or run without installing`, `uvx ${pkg} --help`);
      break;
    case "crates":
      lines.push(`# Install via cargo-binstall (fast, pre-built binaries)`, `cargo binstall ${pkg}`, "");
      lines.push(`# Or build from source`, `cargo install ${pkg}`);
      break;
    case "github":
      lines.push(`# Clone and build from source`);
      lines.push(`git clone https://github.com/${tool.source.uri}.git`, `cd ${name}`);
      lines.push(`# Follow README for build instructions`);
      break;
    default:
      lines.push(`# Install from: ${tool.source.uri}`);
      lines.push(`echo "See project README for installation instructions"`);
  }

  lines.push("");
  lines.push(`# Verify installation`);
  lines.push(`${name} --version 2>/dev/null || ${name} version 2>/dev/null || echo "${name} installed (no --version flag)"`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Generate scripts/validate.py — a single-file uv script that validates
 * the skill directory structure and frontmatter compliance.
 *
 * Runs with: uv run scripts/validate.py
 * (uv auto-creates a venv and installs pyyaml from the inline metadata)
 */
function generateValidateScript(): string {
  return `#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml>=6.0"]
# ///
"""
Validate skill directory structure and SKILL.md frontmatter.
Checks compliance with Anthropic skill spec:
  - name: kebab-case, max 64 chars, no reserved words
  - description: non-empty, max 1024 chars, includes trigger phrase, no XML tags
  - File structure: SKILL.md required, references/ one level deep
  - No README.md inside skill folder

Usage: uv run scripts/validate.py
"""

import sys
import re
from pathlib import Path

try:
    import yaml
except ImportError:
    print("WARN: pyyaml not available, using basic parsing")
    yaml = None

SKILL_DIR = Path(__file__).resolve().parent.parent
SKILL_FILE = SKILL_DIR / "SKILL.md"

def check(condition: bool, msg: str, issues: list[str]) -> None:
    if not condition:
        issues.append(msg)

def validate() -> list[str]:
    issues: list[str] = []

    # File structure checks
    check(SKILL_FILE.exists(), "SKILL.md not found (must be exactly SKILL.md, case-sensitive)", issues)
    check(not (SKILL_DIR / "README.md").exists(), "README.md should not be inside skill folder", issues)
    check(not (SKILL_DIR / "SKILL.MD").exists() or SKILL_FILE.exists(), "File must be SKILL.md not SKILL.MD", issues)

    if not SKILL_FILE.exists():
        return issues

    content = SKILL_FILE.read_text(encoding="utf-8")

    # Frontmatter delimiters
    fm_match = re.match(r"^---\\r?\\n([\\s\\S]*?)\\r?\\n---", content)
    check(fm_match is not None, "Missing --- frontmatter delimiters", issues)
    if not fm_match:
        return issues

    fm_text = fm_match.group(1)

    # Parse frontmatter
    fields: dict = {}
    if yaml:
        try:
            fields = yaml.safe_load(fm_text) or {}
        except yaml.YAMLError as e:
            issues.append(f"Invalid YAML frontmatter: {e}")
            return issues
    else:
        for line in fm_text.split("\\n"):
            m = re.match(r"^(\\w[\\w-]*):\\s*(.+)$", line)
            if m:
                fields[m.group(1)] = m.group(2).strip().strip("'\\"")

    # name field
    name = fields.get("name", "")
    check(bool(name), "Missing required field: name", issues)
    check(len(name) <= 64, f"name too long: {len(name)} chars (max 64)", issues)
    check(bool(re.match(r"^[a-z0-9][a-z0-9-]*$", name)) if name else False,
          f"name must be kebab-case (lowercase, hyphens only): '{name}'", issues)
    check("claude" not in name.lower() and "anthropic" not in name.lower(),
          "name must not contain reserved words: claude, anthropic", issues)

    # description field
    desc = fields.get("description", "")
    check(bool(desc), "Missing required field: description", issues)
    check(len(desc) <= 1024, f"description too long: {len(desc)} chars (max 1024)", issues)
    check("<" not in desc and ">" not in desc, "description must not contain XML tags", issues)
    check("use when" in desc.lower() or "use for" in desc.lower(),
          "description should include trigger phrase ('Use when...')", issues)

    # Description quality
    if desc:
        words = desc.split()
        check(len(words) >= 8, f"description too short: {len(words)} words (aim for 15+)", issues)

        # Third person check (best practice)
        check(not desc.lower().startswith("i ") and not desc.lower().startswith("you "),
              "description should be third person (not 'I' or 'You')", issues)

    # Progressive disclosure: SKILL.md body length
    body = content[fm_match.end():].strip()
    body_lines = body.split("\\n")
    check(len(body_lines) <= 500, f"SKILL.md body too long: {len(body_lines)} lines (max 500)", issues)

    # References depth check — should be one level deep from SKILL.md
    refs_dir = SKILL_DIR / "references"
    if refs_dir.exists():
        for ref_file in refs_dir.rglob("*"):
            if ref_file.is_file():
                depth = len(ref_file.relative_to(refs_dir).parts)
                check(depth <= 1, f"Reference too deep: {ref_file.relative_to(SKILL_DIR)} (keep one level)", issues)

    # Forward slashes in file paths (no Windows backslashes)
    if "\\\\\\\\" in content:
        issues.append("Use forward slashes in file paths, not backslashes")

    return issues


if __name__ == "__main__":
    issues = validate()

    skill_name = SKILL_DIR.name
    if not issues:
        print(f"  PASS  {skill_name} — all checks passed")
        sys.exit(0)
    else:
        print(f"  FAIL  {skill_name} — {len(issues)} issue(s):")
        for issue in issues:
            print(f"    - {issue}")
        sys.exit(1)
`;
}

// ── Helpers ────────────────────────────────────────────────────────────

function inferDomainFromTool(tool: Tool): string {
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

function toolToManifestEntry(tool: Tool): ManifestEntry | null {
  // lookupDomain requires a manifest entries list; we don't have one in direct mode,
  // so infer domain from DOMAIN_TRIGGERS keywords matching the tool description
  const domain = inferDomainFromTool(tool);
  return {
    name: tool.meta.name,
    repo: tool.source.uri,
    domain,
    description: tool.meta.description || `CLI tool: ${tool.meta.name}`,
  };
}

let quiet = false;
function log(msg: string): void {
  if (!quiet) console.log(msg);
}

function fmtTable(rows: string[][], headers: string[]): string {
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

// ── Mode: Audit existing skills ────────────────────────────────────────

function runAudit(strict: boolean): void {
  log("\n  Skill Quality Audit");
  log(`  Directory: ${OUTPUT_DIR}\n`);

  const results = testAllSkillsSync(OUTPUT_DIR);

  if (results.length === 0) {
    log("  No skills found to audit.");
    return;
  }

  // Group by domain
  const domainGroups = new Map<string, typeof results>();
  for (const r of results) {
    try {
      const content = readFileSync(r.skillPath, "utf-8");
      const domainMatch = content.match(/domain:\s*(\S+)/);
      const domain = domainMatch?.[1] ?? "unknown";
      if (!domainGroups.has(domain)) domainGroups.set(domain, []);
      domainGroups.get(domain)!.push(r);
    } catch {
      if (!domainGroups.has("unknown")) domainGroups.set("unknown", []);
      domainGroups.get("unknown")!.push(r);
    }
  }

  printQualityReport(results);

  const passed = results.filter(r => r.passed).length;
  const failed = results.length - passed;

  // Domain summary
  log("  Domain Distribution:");
  for (const [domain, group] of domainGroups) {
    const p = group.filter(r => r.passed).length;
    log(`    ${domain.padEnd(20)} ${group.length} skills (${p} pass, ${group.length - p} fail)`);
  }
  log("");

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

  // ── Mode: Audit ──
  if (args.audit) {
    runAudit(args.strict);
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
    log("    npx tsx examples/skill-forge.ts --audit");
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
      const result = forgeSkill(tool, false);
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
    buildIndexes(tools);
  }

  // Generate lockfile
  if (tools.length > 0) {
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
  console.error(`\nFatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
