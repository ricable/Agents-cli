#!/usr/bin/env npx tsx
/**
 * top100-pipeline.ts
 *
 * Install and analyze CLI tools for AI agents — 91 general + 502 AI/ML tools.
 * Sources: GitHub repos + npm packages.
 *
 * Usage:
 *   npx tsx examples/top100-pipeline.ts [--dry-run] [--limit N] [--category CAT] [--skip-installed] [--list-categories]
 *
 * Examples:
 *   npx tsx examples/top100-pipeline.ts --dry-run                       # preview all 593 tools
 *   npx tsx examples/top100-pipeline.ts --category ai-ml --dry-run      # all 502 AI/ML tools
 *   npx tsx examples/top100-pipeline.ts --category ai-ml/llm-inference  # just LLM inference tools
 *   npx tsx examples/top100-pipeline.ts --category ai-ml/ai-agents      # just AI agent frameworks
 *   npx tsx examples/top100-pipeline.ts --category security             # security tools
 *   npx tsx examples/top100-pipeline.ts --limit 10 --skip-installed     # first 10, skip existing
 *   npx tsx examples/top100-pipeline.ts --list-categories               # show all categories
 */

import { createResolver } from "../lib/resolver.js";
import { createInstaller } from "../lib/installer.js";
import { createAnalyzer, findMainBinary } from "../lib/analyzer.js";
import { createStore, getToolInstallDir, generateContextMd } from "../lib/store.js";
import { generateRichSkillMd, installTool } from "../lib/skills.js";
import { readPkgVersion } from "../lib/pkg-utils.js";
import type { Tool, ToolCapabilities } from "../lib/types.js";
import { homedir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// ── Config ───────────────────────────────────────────────────────────────────
const DATA_DIR = join(homedir(), ".agents-cli");
const OUTPUT_DIR = resolve("examples/generated-skills");

// ── CLI Tool Registry ────────────────────────────────────────────────────────

interface CliTool {
  name: string;
  source: string;
  sourceType: "github" | "npm";
  description: string;
  category: string;
  agentValue: string;
}

/**
 * 91 general-purpose CLI tools (code-search, data-processing, http-api, git,
 * javascript, python, cloud, package-managers, testing, security, etc.)
 */
const GENERAL_TOOLS: CliTool[] = [
  // ── Code Search & Navigation ─────────────────────────────────────
  { name: "rg", source: "BurntSushi/ripgrep", sourceType: "github", description: "Recursively search directories for a regex pattern with structured output", category: "code-search", agentValue: "Fastest code search with --json output, essential for codebase understanding" },
  { name: "fd", source: "sharkdp/fd", sourceType: "github", description: "Simple, fast alternative to find with colorized output", category: "code-search", agentValue: "Fast file discovery with regex/glob, simpler syntax than find" },
  { name: "fzf", source: "junegunn/fzf", sourceType: "github", description: "General-purpose command-line fuzzy finder", category: "code-search", agentValue: "Scriptable fuzzy matching with --filter mode for non-interactive use" },
  { name: "bat", source: "sharkdp/bat", sourceType: "github", description: "Cat clone with syntax highlighting and Git integration", category: "code-search", agentValue: "Syntax-aware file reading with line ranges and plain output mode" },
  { name: "eza", source: "eza-community/eza", sourceType: "github", description: "Modern replacement for ls with Git status and tree view", category: "code-search", agentValue: "Structured directory listing with tree and git integration" },
  { name: "ag", source: "ggreer/the_silver_searcher", sourceType: "github", description: "Code-searching tool similar to ack, optimized for speed", category: "code-search", agentValue: "Fast pattern matching with --vimgrep structured output" },
  { name: "tree", source: "Old-Man-Programmer/tree", sourceType: "github", description: "Recursive directory listing producing a tree structure", category: "code-search", agentValue: "JSON output (-J) for directory structure analysis" },
  { name: "tokei", source: "XAMPPRocky/tokei", sourceType: "github", description: "Count lines of code quickly with language breakdown", category: "code-search", agentValue: "JSON output for codebase statistics and project composition" },
  { name: "ast-grep", source: "ast-grep/ast-grep", sourceType: "github", description: "Structural code search and rewriting using AST patterns", category: "code-search", agentValue: "AST-level code search with JSON output, precise refactoring" },

  // ── JSON/Data Processing ─────────────────────────────────────────
  { name: "jq", source: "jqlang/jq", sourceType: "github", description: "Lightweight command-line JSON processor", category: "data-processing", agentValue: "Standard for JSON transformation in pipelines" },
  { name: "yq", source: "mikefarah/yq", sourceType: "github", description: "YAML/JSON/XML/CSV/TOML processor with jq-like syntax", category: "data-processing", agentValue: "Handles YAML config files with JSON output mode" },
  { name: "fx", source: "antonmedv/fx", sourceType: "github", description: "Terminal JSON viewer and processor", category: "data-processing", agentValue: "JavaScript-based JSON transformations for complex pipelines" },
  { name: "dasel", source: "TomWright/dasel", sourceType: "github", description: "Query and modify data structures across formats", category: "data-processing", agentValue: "Universal data format selector with consistent syntax" },
  { name: "gron", source: "tomnomnom/gron", sourceType: "github", description: "Make JSON greppable by flattening to assignments", category: "data-processing", agentValue: "Flattens nested JSON so agents can grep for deep values" },
  { name: "miller", source: "johnkerl/miller", sourceType: "github", description: "Like awk/sed/cut for name-indexed data (CSV, JSON)", category: "data-processing", agentValue: "Transforms between CSV/JSON/TSV with powerful operations" },
  { name: "csvkit", source: "wireservice/csvkit", sourceType: "github", description: "Suite of tools for converting to and working with CSV", category: "data-processing", agentValue: "SQL queries on CSV (csvsql), format conversion, statistics" },
  { name: "xsv", source: "BurntSushi/xsv", sourceType: "github", description: "Fast CSV command-line toolkit written in Rust", category: "data-processing", agentValue: "Blazing fast CSV indexing, slicing, joining" },

  // ── HTTP/API ─────────────────────────────────────────────────────
  { name: "curl", source: "curl/curl", sourceType: "github", description: "Command-line tool for transferring data with URLs", category: "http-api", agentValue: "Universal HTTP client with JSON output, essential for API interaction" },
  { name: "httpie", source: "httpie/cli", sourceType: "github", description: "Human-friendly HTTP client for the API era", category: "http-api", agentValue: "Cleaner syntax than curl for REST APIs, built-in JSON handling" },
  { name: "xh", source: "ducaale/xh", sourceType: "github", description: "Friendly and fast HTTP request tool (Rust httpie)", category: "http-api", agentValue: "Faster httpie alternative with identical syntax" },
  { name: "grpcurl", source: "fullstorydev/grpcurl", sourceType: "github", description: "Command-line tool for interacting with gRPC servers", category: "http-api", agentValue: "JSON-based gRPC interaction without compiled proto stubs" },
  { name: "hey", source: "rakyll/hey", sourceType: "github", description: "HTTP load generator and benchmarking tool", category: "http-api", agentValue: "Quick API load testing with structured statistics" },

  // ── Git/Version Control ──────────────────────────────────────────
  { name: "gh", source: "cli/cli", sourceType: "github", description: "GitHub's official CLI for PRs, issues, repos, and actions", category: "git", agentValue: "Full GitHub API access with --json output" },
  { name: "gitleaks", source: "gitleaks/gitleaks", sourceType: "github", description: "Detect and prevent hardcoded secrets in git repos", category: "git", agentValue: "JSON report output for automated secret scanning" },
  { name: "git-cliff", source: "orhun/git-cliff", sourceType: "github", description: "Customizable changelog generator from conventional commits", category: "git", agentValue: "Automated changelog generation with JSON output" },
  { name: "delta", source: "dandavison/delta", sourceType: "github", description: "Syntax-highlighting pager for git diff", category: "git", agentValue: "Better diff visualization with raw mode for structured parsing" },
  { name: "commitizen", source: "commitizen-tools/commitizen", sourceType: "github", description: "Tool for creating committing rules and changelogs", category: "git", agentValue: "Enforces conventional commits, automatable with --yes" },

  // ── JavaScript/TypeScript ────────────────────────────────────────
  { name: "prettier", source: "prettier", sourceType: "npm", description: "Opinionated code formatter for JS/TS/CSS/HTML/JSON", category: "javascript", agentValue: "Deterministic formatting with --check and JSON error output" },
  { name: "eslint", source: "eslint", sourceType: "npm", description: "Pluggable linting utility for JavaScript and TypeScript", category: "javascript", agentValue: "JSON output (-f json) with fix locations for automated fixes" },
  { name: "biome", source: "biomejs/biome", sourceType: "github", description: "Fast formatter and linter for JS/TS/JSON/CSS", category: "javascript", agentValue: "Single tool replacing eslint+prettier, JSON diagnostics" },
  { name: "tsx", source: "tsx", sourceType: "npm", description: "TypeScript execute — run TS files directly with Node.js", category: "javascript", agentValue: "Zero-config TS execution without build step" },
  { name: "esbuild", source: "esbuild", sourceType: "npm", description: "Extremely fast JavaScript/TypeScript bundler", category: "javascript", agentValue: "Sub-second builds with JSON metafile output" },
  { name: "swc", source: "swc-project/swc", sourceType: "github", description: "Super-fast Rust-based JS/TS compiler", category: "javascript", agentValue: "Fast transpilation, drop-in Babel replacement" },
  { name: "turbo", source: "turbo", sourceType: "npm", description: "High-performance build system for JS/TS monorepos", category: "javascript", agentValue: "Parallel tasks with --dry=json for dependency graph analysis" },
  { name: "tsc", source: "typescript", sourceType: "npm", description: "TypeScript compiler and type checker", category: "javascript", agentValue: "Type checking with parseable error output" },
  { name: "oxlint", source: "oxlint", sourceType: "npm", description: "Blazingly fast JS/TS linter (50-100x faster than ESLint)", category: "javascript", agentValue: "Near-instant linting with JSON output" },

  // ── Python ───────────────────────────────────────────────────────
  { name: "uv", source: "astral-sh/uv", sourceType: "github", description: "Extremely fast Python package installer and resolver", category: "python", agentValue: "10-100x faster than pip, handles venvs and Python versions" },
  { name: "ruff", source: "astral-sh/ruff", sourceType: "github", description: "Extremely fast Python linter and formatter", category: "python", agentValue: "JSON output, replaces flake8+isort+black, sub-second linting" },
  { name: "mypy", source: "python/mypy", sourceType: "github", description: "Static type checker for Python", category: "python", agentValue: "JSON output for type errors, code quality automation" },
  { name: "pyright", source: "pyright", sourceType: "npm", description: "Fast static type checker for Python", category: "python", agentValue: "JSON output with --outputjson, faster than mypy" },
  { name: "pytest", source: "pytest-dev/pytest", sourceType: "github", description: "Full-featured Python testing framework", category: "python", agentValue: "JSON output via plugins, markers for selective execution" },

  // ── Container/Cloud ──────────────────────────────────────────────
  { name: "docker", source: "moby/moby", sourceType: "github", description: "Container runtime and management platform", category: "cloud", agentValue: "JSON output (--format json), full container lifecycle automation" },
  { name: "kubectl", source: "kubernetes/kubectl", sourceType: "github", description: "Kubernetes command-line tool", category: "cloud", agentValue: "JSON/YAML output (-o json), JSONPath queries" },
  { name: "helm", source: "helm/helm", sourceType: "github", description: "Kubernetes package manager for charts", category: "cloud", agentValue: "JSON output, template rendering, automated deployments" },
  { name: "terraform", source: "hashicorp/terraform", sourceType: "github", description: "Infrastructure as Code for any cloud provider", category: "cloud", agentValue: "JSON plan output (-json), state inspection" },
  { name: "pulumi", source: "pulumi/pulumi", sourceType: "github", description: "Infrastructure as Code using real programming languages", category: "cloud", agentValue: "JSON output, programmatic infra in TS/Python/Go" },
  { name: "aws", source: "aws/aws-cli", sourceType: "github", description: "Official AWS command-line interface", category: "cloud", agentValue: "JSON output by default, JMESPath queries (--query)" },
  { name: "flyctl", source: "superfly/flyctl", sourceType: "github", description: "CLI for Fly.io application platform", category: "cloud", agentValue: "JSON output, simple app deployment automation" },
  { name: "podman", source: "containers/podman", sourceType: "github", description: "Daemonless container engine, Docker-compatible", category: "cloud", agentValue: "Docker-compatible JSON output, rootless containers" },

  // ── Package Managers ─────────────────────────────────────────────
  { name: "pnpm", source: "pnpm/pnpm", sourceType: "github", description: "Fast, disk space efficient package manager", category: "package-managers", agentValue: "JSON output for dependency trees, strict dependencies" },
  { name: "bun", source: "oven-sh/bun", sourceType: "github", description: "All-in-one JS runtime, bundler, and package manager", category: "package-managers", agentValue: "Fastest JS installs, built-in test runner and bundler" },
  { name: "mise", source: "jdx/mise", sourceType: "github", description: "Polyglot runtime manager (replaces asdf, nvm, pyenv)", category: "package-managers", agentValue: "Single tool for all language runtimes, JSON output" },

  // ── Testing/QA ───────────────────────────────────────────────────
  { name: "playwright", source: "@playwright/test", sourceType: "npm", description: "Browser automation and end-to-end testing framework", category: "testing", agentValue: "JSON test reports, headless browser automation, codegen" },
  { name: "jest", source: "jest", sourceType: "npm", description: "Delightful JavaScript testing framework", category: "testing", agentValue: "JSON output (--json), snapshot testing, watch mode" },
  { name: "vitest", source: "vitest", sourceType: "npm", description: "Vite-native unit test framework, Jest-compatible", category: "testing", agentValue: "JSON reporter, fast HMR re-runs, Jest API compatible" },
  { name: "k6", source: "grafana/k6", sourceType: "github", description: "Modern load testing tool for developers", category: "testing", agentValue: "JSON output, scriptable in JS, threshold-based pass/fail" },
  { name: "artillery", source: "artillery", sourceType: "npm", description: "Cloud-scale load testing platform", category: "testing", agentValue: "JSON reports, YAML scenarios, HTTP/WebSocket/gRPC" },
  { name: "cypress", source: "cypress", sourceType: "npm", description: "Fast, reliable E2E testing for web applications", category: "testing", agentValue: "JSON output, headless mode, automatic screenshots on failure" },

  // ── Security ─────────────────────────────────────────────────────
  { name: "trivy", source: "aquasecurity/trivy", sourceType: "github", description: "Comprehensive vulnerability scanner for containers and code", category: "security", agentValue: "JSON output, scans containers/filesystems/repos/IaC" },
  { name: "snyk", source: "snyk", sourceType: "npm", description: "Developer-first security platform CLI", category: "security", agentValue: "JSON output, dependency vulnerability scanning" },
  { name: "semgrep", source: "semgrep/semgrep", sourceType: "github", description: "Lightweight static analysis with custom pattern rules", category: "security", agentValue: "JSON output, custom rules, supports 30+ languages" },
  { name: "trufflehog", source: "trufflesecurity/trufflehog", sourceType: "github", description: "Find and verify leaked credentials in git repos", category: "security", agentValue: "JSON output, verifies if secrets are live" },
  { name: "osv-scanner", source: "google/osv-scanner", sourceType: "github", description: "Vulnerability scanner using the OSV database", category: "security", agentValue: "JSON output, scans lockfiles/SBOMs" },
  { name: "grype", source: "anchore/grype", sourceType: "github", description: "Vulnerability scanner for containers and filesystems", category: "security", agentValue: "JSON output, pairs with syft for SBOM pipeline" },

  // ── Documentation ────────────────────────────────────────────────
  { name: "typedoc", source: "typedoc", sourceType: "npm", description: "Documentation generator for TypeScript projects", category: "documentation", agentValue: "JSON output plugin, generates API docs from TS source" },
  { name: "swagger-cli", source: "@apidevtools/swagger-cli", sourceType: "npm", description: "Validate and bundle OpenAPI/Swagger specs", category: "documentation", agentValue: "Validate API specs programmatically" },
  { name: "redocly", source: "@redocly/cli", sourceType: "npm", description: "OpenAPI linting, bundling, and documentation", category: "documentation", agentValue: "Lint OpenAPI specs with JSON output" },

  // ── DevOps/Automation ────────────────────────────────────────────
  { name: "just", source: "casey/just", sourceType: "github", description: "Command runner — better make for project commands", category: "devops", agentValue: "Simple task runner with --list for discovery" },
  { name: "act", source: "nektos/act", sourceType: "github", description: "Run GitHub Actions locally", category: "devops", agentValue: "Test CI workflows locally before pushing" },
  { name: "task", source: "go-task/task", sourceType: "github", description: "Task runner / simpler Make alternative in Go", category: "devops", agentValue: "YAML-based tasks, --json for task listing" },
  { name: "direnv", source: "direnv/direnv", sourceType: "github", description: "Per-directory environment variables", category: "devops", agentValue: "Automatic env loading per project, JSON export" },
  { name: "watchexec", source: "watchexec/watchexec", sourceType: "github", description: "Execute commands when files change", category: "devops", agentValue: "File watcher for auto-rebuilds with glob filters" },
  { name: "zoxide", source: "ajeetdsouza/zoxide", sourceType: "github", description: "Smarter cd command using frecency ranking", category: "devops", agentValue: "Fast directory navigation using learned paths" },

  // ── Database ─────────────────────────────────────────────────────
  { name: "prisma", source: "prisma", sourceType: "npm", description: "Next-generation ORM for Node.js and TypeScript", category: "database", agentValue: "Schema-driven migrations, DB introspection, JSON output" },
  { name: "drizzle-kit", source: "drizzle-kit", sourceType: "npm", description: "CLI companion for Drizzle ORM migrations", category: "database", agentValue: "Schema diff and migration generation, TypeScript-first" },

  // ── AI/ML ────────────────────────────────────────────────────────
  { name: "ollama", source: "ollama/ollama", sourceType: "github", description: "Run large language models locally", category: "ai-ml", agentValue: "Local LLM inference via CLI/API, JSON streaming" },
  { name: "llm", source: "simonw/llm", sourceType: "github", description: "CLI for interacting with LLMs (local and API)", category: "ai-ml", agentValue: "Unified LLM interface, template system, SQLite logging" },
  { name: "aider", source: "paul-gauthier/aider", sourceType: "github", description: "AI pair programming in your terminal", category: "ai-ml", agentValue: "Automated code editing via LLMs, git integration" },

  // ── Monitoring/Debugging ─────────────────────────────────────────
  { name: "procs", source: "dalance/procs", sourceType: "github", description: "Modern replacement for ps written in Rust", category: "monitoring", agentValue: "JSON output (--json), better process filtering" },
  { name: "dust", source: "bootandy/dust", sourceType: "github", description: "More intuitive version of du (disk usage)", category: "monitoring", agentValue: "Visual disk usage analysis for finding large files" },
  { name: "duf", source: "muesli/duf", sourceType: "github", description: "Disk usage/free utility with JSON output", category: "monitoring", agentValue: "JSON output (--json), clean disk space reporting" },
  { name: "hyperfine", source: "sharkdp/hyperfine", sourceType: "github", description: "Command-line benchmarking tool", category: "monitoring", agentValue: "JSON output (--export-json), statistical benchmarking" },
  { name: "bandwhich", source: "imsnif/bandwhich", sourceType: "github", description: "Terminal bandwidth utilization by process", category: "monitoring", agentValue: "Per-process network usage monitoring" },

  // ── Browser/Web ──────────────────────────────────────────────────
  { name: "lighthouse", source: "lighthouse", sourceType: "npm", description: "Automated web page quality auditing tool", category: "browser", agentValue: "JSON output, performance/accessibility/SEO scoring" },
  { name: "pa11y", source: "pa11y", sourceType: "npm", description: "Accessibility testing tool for web pages", category: "browser", agentValue: "JSON output, automated accessibility compliance" },

  // ── File Processing ──────────────────────────────────────────────
  { name: "pandoc", source: "jgm/pandoc", sourceType: "github", description: "Universal document converter (40+ formats)", category: "file-processing", agentValue: "JSON AST output, convert between Markdown/HTML/PDF/DOCX" },
  { name: "exiftool", source: "exiftool/exiftool", sourceType: "github", description: "Read, write, and edit file metadata", category: "file-processing", agentValue: "JSON output (-j), metadata across 400+ file formats" },

  // ── Network ──────────────────────────────────────────────────────
  { name: "mtr", source: "traviscross/mtr", sourceType: "github", description: "Network diagnostic combining ping and traceroute", category: "network", agentValue: "JSON output (--json), automated network path analysis" },
  { name: "dog", source: "ogham/dog", sourceType: "github", description: "Command-line DNS client (modern dig alternative)", category: "network", agentValue: "JSON output (--json), cleaner DNS lookups" },
  { name: "websocat", source: "vi/websocat", sourceType: "github", description: "Command-line WebSocket client", category: "network", agentValue: "Non-interactive WebSocket communication for APIs" },
  { name: "oha", source: "hatoo/oha", sourceType: "github", description: "HTTP load generator with TUI", category: "network", agentValue: "JSON output (--json), detailed latency histograms" },
];

// ── AI/ML Tools (loaded from ai-ml-tools.json) ──────────────────────────────

interface AiMlToolEntry {
  name: string;
  source: string;
  sourceType: "github" | "npm";
  description: string;
  subcategory: string;
  agentValue: string;
}

function loadAiMlTools(): CliTool[] {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const jsonPath = join(scriptDir, "..", "ai-ml-tools.json");
  if (!existsSync(jsonPath)) {
    console.log("  ⚠ ai-ml-tools.json not found, skipping AI/ML tools");
    return [];
  }
  const raw = JSON.parse(readFileSync(jsonPath, "utf-8")) as AiMlToolEntry[];
  return raw.map(t => ({
    name: t.name,
    source: t.source,
    sourceType: t.sourceType,
    description: t.description,
    category: `ai-ml/${t.subcategory.toLowerCase().replace(/ & /g, "-and-").replace(/ /g, "-")}`,
    agentValue: t.agentValue,
  }));
}

/** Merge general + AI/ML tools, deduplicating by name */
function loadAllTools(): CliTool[] {
  const aiMlTools = loadAiMlTools();
  const seen = new Set(GENERAL_TOOLS.map(t => t.name));
  const merged = [...GENERAL_TOOLS];
  for (const t of aiMlTools) {
    if (!seen.has(t.name)) {
      merged.push(t);
      seen.add(t.name);
    }
  }
  return merged;
}

// ── CLI Args ─────────────────────────────────────────────────────────────────
function parseCliArgs() {
  const args = process.argv.slice(2);
  let limit = 0; // 0 = no limit
  let dryRun = false;
  let category = "";
  let skipInstalled = false;
  let verbose = false;
  let listCategories = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === "--limit" && args[i + 1]) { limit = parseInt(args[++i]!, 10); }
    else if (arg === "--dry-run") { dryRun = true; }
    else if (arg === "--category" && args[i + 1]) { category = args[++i]!.toLowerCase(); }
    else if (arg === "--skip-installed") { skipInstalled = true; }
    else if (arg === "--verbose" || arg === "-v") { verbose = true; }
    else if (arg === "--list-categories") { listCategories = true; }
  }
  return { limit, dryRun, category, skipInstalled, verbose, listCategories };
}

// ── Pipeline ─────────────────────────────────────────────────────────────────

async function processCliTool(
  tool: CliTool,
  store: ReturnType<typeof createStore>,
  verbose: boolean,
): Promise<{ tool: Tool; skillPath: string } | null> {
  const source = tool.source;

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  ${tool.name} — ${tool.description}`);
  console.log(`  Source: ${tool.source} (${tool.sourceType})`);
  console.log(`  Category: ${tool.category} | Agent value: ${tool.agentValue}`);
  console.log(`${"─".repeat(60)}`);

  try {
    // Check if resolver supports this source
    const resolver = createResolver();
    if (!resolver.supports(source)) {
      console.log(`  ⚠ Unsupported source format: ${source}, skipping`);
      return null;
    }

    // Step 1: Resolve metadata
    console.log(`  [1/4] Resolving ${source}...`);
    const resolved = await resolver.resolve(source);
    const toolId = resolved.meta.name ?? source.replace(/[/@]/g, "-").replace(/^-/, "");
    console.log(`  → ${resolved.source.format}:${resolved.source.uri} (${toolId})`);

    // Check if already installed
    if (await store.has(toolId)) {
      console.log(`  ℹ Already installed, generating skill from existing data...`);
      const existing = await store.get(toolId);
      if (existing) {
        const skillPath = writeSkillForTool(existing, tool);
        return { tool: existing, skillPath };
      }
    }

    // Step 2: Install
    console.log(`  [2/4] Installing...`);
    const installed = await installTool(source, DATA_DIR, { store, verbose });
    console.log(`  ✓ Installed ${installed.meta.name}@${installed.meta.version}`);

    // Step 3: Report analysis
    const cmdCount = installed.capabilities.commands.length;
    const flagCount = installed.capabilities.globalFlags.length;
    console.log(`  [3/4] Analysis: ${cmdCount} commands, ${flagCount} flags (${installed.capabilities.analysisMethod})`);
    if (cmdCount > 0 && verbose) {
      console.log(`  Commands: ${installed.capabilities.commands.map(c => c.name).join(", ")}`);
    }

    // Step 4: Generate SKILL.md
    console.log(`  [4/4] Generating SKILL.md...`);
    const skillPath = writeSkillForTool(installed, tool);
    console.log(`  ✓ Skill written to: ${skillPath}`);

    return { tool: installed, skillPath };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ✗ Failed: ${msg}`);
    return null;
  }
}

function writeSkillForTool(installed: Tool, meta: CliTool): string {
  const skillDir = join(OUTPUT_DIR, meta.name);
  mkdirSync(skillDir, { recursive: true });

  // Use the rich skill generator from lib/skills.ts
  const content = generateRichSkillMd(installed);
  const skillPath = join(skillDir, "SKILL.md");
  writeFileSync(skillPath, content, "utf-8");

  // Write CONTEXT.md for full reference
  const contextPath = join(skillDir, "CONTEXT.md");
  writeFileSync(contextPath, generateContextMd(installed), "utf-8");

  return skillPath;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseCliArgs();

  // Load all tools (91 general + 502 AI/ML)
  const allTools = loadAllTools();

  // --list-categories: show available categories and exit
  if (opts.listCategories) {
    const cats = new Map<string, number>();
    for (const t of allTools) {
      cats.set(t.category, (cats.get(t.category) ?? 0) + 1);
    }
    console.log(`\n  ${allTools.length} tools across ${cats.size} categories:\n`);
    const sorted = [...cats.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    for (const [cat, count] of sorted) {
      console.log(`    ${cat.padEnd(35)} ${count} tools`);
    }
    console.log(`\n  Filter with: --category <name>  (matches partial, e.g. "ai-ml" or "ai-ml/llm")\n`);
    return;
  }

  // Filter by category if specified (supports partial match: "ai-ml" matches all ai-ml/* subcategories)
  let tools = allTools;
  if (opts.category) {
    tools = tools.filter(t => t.category.toLowerCase().includes(opts.category));
  }

  // Apply limit (0 = no limit)
  if (opts.limit > 0) {
    tools = tools.slice(0, opts.limit);
  }

  // Group by category for display
  const categories = new Map<string, CliTool[]>();
  for (const t of tools) {
    if (!categories.has(t.category)) categories.set(t.category, []);
    categories.get(t.category)!.push(t);
  }

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   agents-cli: CLI Tools for AI Agents Pipeline          ║");
  console.log("║   91 general + 502 AI/ML tools from GitHub & npm        ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`  Total tools:  ${tools.length} / ${allTools.length}`);
  console.log(`  Categories:   ${categories.size}`);
  if (opts.category) console.log(`  Filter:       "${opts.category}"`);
  console.log(`  Dry run:      ${opts.dryRun}`);
  console.log(`  Output:       ${OUTPUT_DIR}`);
  console.log("");

  // Display by category
  for (const [cat, catTools] of categories) {
    console.log(`  📂 ${cat} (${catTools.length})`);
    for (const t of catTools) {
      const srcLabel = t.sourceType === "npm" ? `npm:${t.source}` : t.source;
      console.log(`     ${t.name.padEnd(16)} ${srcLabel.padEnd(35)} ${t.description.slice(0, 50)}`);
    }
    console.log("");
  }

  if (opts.dryRun) {
    console.log("🏁 Dry run complete. Remove --dry-run to install and analyze.");
    console.log(`   ${tools.length} tools would be processed across ${categories.size} categories.`);
    return;
  }

  // Process each tool
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const store = createStore(DATA_DIR);

  const results: { meta: CliTool; tool: Tool; skillPath: string }[] = [];
  const failures: { meta: CliTool; error: string }[] = [];
  const skipped: CliTool[] = [];

  for (const meta of tools) {
    // Optionally skip already-installed tools
    if (opts.skipInstalled) {
      const skillPath = join(OUTPUT_DIR, meta.name, "SKILL.md");
      if (existsSync(skillPath)) {
        console.log(`  ⏭ Skipping ${meta.name} (already has SKILL.md)`);
        skipped.push(meta);
        continue;
      }
    }

    try {
      const result = await processCliTool(meta, store, opts.verbose);
      if (result) {
        results.push({ meta, ...result });
      } else {
        failures.push({ meta, error: "Install/analysis returned null" });
      }
    } catch (err) {
      failures.push({ meta, error: err instanceof Error ? err.message : String(err) });
    }
  }

  // ── Summary ──────────────────────────────────────────────────────

  console.log("\n\n╔══════════════════════════════════════════════════════════╗");
  console.log("║                    Pipeline Summary                     ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  console.log(`  ✓ Successfully processed: ${results.length}`);
  console.log(`  ✗ Failed/skipped:         ${failures.length}`);
  if (skipped.length > 0) {
    console.log(`  ⏭ Skipped (existing):     ${skipped.length}`);
  }
  console.log(`  📁 Output directory:      ${OUTPUT_DIR}\n`);

  if (results.length > 0) {
    console.log("  Generated Skills:");
    console.log("  ─────────────────");

    // Group results by category
    const resultsByCategory = new Map<string, typeof results>();
    for (const r of results) {
      if (!resultsByCategory.has(r.meta.category)) resultsByCategory.set(r.meta.category, []);
      resultsByCategory.get(r.meta.category)!.push(r);
    }

    for (const [cat, catResults] of resultsByCategory) {
      console.log(`\n  📂 ${cat}:`);
      for (const r of catResults) {
        const cmds = r.tool.capabilities.commands.length;
        const flags = r.tool.capabilities.globalFlags.length;
        console.log(`    ${r.meta.name}@${r.tool.meta.version} — ${cmds} commands, ${flags} flags`);
      }
    }
  }

  if (failures.length > 0) {
    console.log("\n  Failures:");
    console.log("  ─────────");
    for (const f of failures) {
      console.log(`  ${f.meta.name} (${f.meta.source}): ${f.error.slice(0, 80)}`);
    }
  }

  // Write INDEX.md
  const indexLines = [
    `# CLI Tools for AI Agents (${results.length} generated)`,
    "",
    `Generated on ${new Date().toISOString()}`,
    "",
    "## By Category",
    "",
  ];

  const allByCategory = new Map<string, typeof results>();
  for (const r of results) {
    if (!allByCategory.has(r.meta.category)) allByCategory.set(r.meta.category, []);
    allByCategory.get(r.meta.category)!.push(r);
  }

  for (const [cat, catResults] of allByCategory) {
    indexLines.push(`### ${cat}`);
    indexLines.push("");
    indexLines.push("| Tool | Version | Commands | Flags | Source |");
    indexLines.push("|------|---------|----------|-------|--------|");
    for (const r of catResults) {
      const cmds = r.tool.capabilities.commands.length;
      const flags = r.tool.capabilities.globalFlags.length;
      const src = r.meta.sourceType === "npm" ? `npm:${r.meta.source}` : r.meta.source;
      indexLines.push(`| [${r.meta.name}](./${r.meta.name}/SKILL.md) | ${r.tool.meta.version} | ${cmds} | ${flags} | ${src} |`);
    }
    indexLines.push("");
  }

  const indexPath = join(OUTPUT_DIR, "INDEX.md");
  writeFileSync(indexPath, indexLines.join("\n"), "utf-8");
  console.log(`\n  📋 Index written to: ${indexPath}`);
}

main().catch((err) => {
  console.error(`\nFatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
});
