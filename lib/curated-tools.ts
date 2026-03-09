/**
 * curated-tools.ts — Registry of curated CLI tools for AI agents.
 *
 * 91 general-purpose tools + optional AI/ML tools from ai-ml-tools.json.
 * Used by skill-forge --curated mode.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ── Types ────────────────────────────────────────────────────────────

export interface CliTool {
  name: string;
  source: string;
  sourceType: "github" | "npm" | "pypi" | "local";
  description: string;
  category: string;
  agentValue: string;
}

// ── General Tools (91 entries) ───────────────────────────────────────

export const GENERAL_TOOLS: CliTool[] = [
  // ── Code Search & Navigation
  { name: "rg", source: "BurntSushi/ripgrep", sourceType: "github", description: "Recursively search directories for a regex pattern with structured output", category: "code-search", agentValue: "Fastest code search with --json output, essential for codebase understanding" },
  { name: "fd", source: "sharkdp/fd", sourceType: "github", description: "Simple, fast alternative to find with colorized output", category: "code-search", agentValue: "Fast file discovery with regex/glob, simpler syntax than find" },
  { name: "fzf", source: "junegunn/fzf", sourceType: "github", description: "General-purpose command-line fuzzy finder", category: "code-search", agentValue: "Scriptable fuzzy matching with --filter mode for non-interactive use" },
  { name: "bat", source: "sharkdp/bat", sourceType: "github", description: "Cat clone with syntax highlighting and Git integration", category: "code-search", agentValue: "Syntax-aware file reading with line ranges and plain output mode" },
  { name: "eza", source: "eza-community/eza", sourceType: "github", description: "Modern replacement for ls with Git status and tree view", category: "code-search", agentValue: "Structured directory listing with tree and git integration" },
  { name: "ag", source: "ggreer/the_silver_searcher", sourceType: "github", description: "Code-searching tool similar to ack, optimized for speed", category: "code-search", agentValue: "Fast pattern matching with --vimgrep structured output" },
  { name: "tree", source: "Old-Man-Programmer/tree", sourceType: "github", description: "Recursive directory listing producing a tree structure", category: "code-search", agentValue: "JSON output (-J) for directory structure analysis" },
  { name: "tokei", source: "XAMPPRocky/tokei", sourceType: "github", description: "Count lines of code quickly with language breakdown", category: "code-search", agentValue: "JSON output for codebase statistics and project composition" },
  { name: "ast-grep", source: "ast-grep/ast-grep", sourceType: "github", description: "Structural code search and rewriting using AST patterns", category: "code-search", agentValue: "AST-level code search with JSON output, precise refactoring" },

  // ── JSON/Data Processing
  { name: "jq", source: "jqlang/jq", sourceType: "github", description: "Lightweight command-line JSON processor", category: "data-processing", agentValue: "Standard for JSON transformation in pipelines" },
  { name: "yq", source: "mikefarah/yq", sourceType: "github", description: "YAML/JSON/XML/CSV/TOML processor with jq-like syntax", category: "data-processing", agentValue: "Handles YAML config files with JSON output mode" },
  { name: "fx", source: "antonmedv/fx", sourceType: "github", description: "Terminal JSON viewer and processor", category: "data-processing", agentValue: "JavaScript-based JSON transformations for complex pipelines" },
  { name: "dasel", source: "TomWright/dasel", sourceType: "github", description: "Query and modify data structures across formats", category: "data-processing", agentValue: "Universal data format selector with consistent syntax" },
  { name: "gron", source: "tomnomnom/gron", sourceType: "github", description: "Make JSON greppable by flattening to assignments", category: "data-processing", agentValue: "Flattens nested JSON so agents can grep for deep values" },
  { name: "miller", source: "johnkerl/miller", sourceType: "github", description: "Like awk/sed/cut for name-indexed data (CSV, JSON)", category: "data-processing", agentValue: "Transforms between CSV/JSON/TSV with powerful operations" },
  { name: "csvkit", source: "wireservice/csvkit", sourceType: "github", description: "Suite of tools for converting to and working with CSV", category: "data-processing", agentValue: "SQL queries on CSV (csvsql), format conversion, statistics" },
  { name: "xsv", source: "BurntSushi/xsv", sourceType: "github", description: "Fast CSV command-line toolkit written in Rust", category: "data-processing", agentValue: "Blazing fast CSV indexing, slicing, joining" },

  // ── HTTP/API
  { name: "curl", source: "curl/curl", sourceType: "github", description: "Command-line tool for transferring data with URLs", category: "http-api", agentValue: "Universal HTTP client with JSON output, essential for API interaction" },
  { name: "httpie", source: "httpie/cli", sourceType: "github", description: "Human-friendly HTTP client for the API era", category: "http-api", agentValue: "Cleaner syntax than curl for REST APIs, built-in JSON handling" },
  { name: "xh", source: "ducaale/xh", sourceType: "github", description: "Friendly and fast HTTP request tool (Rust httpie)", category: "http-api", agentValue: "Faster httpie alternative with identical syntax" },
  { name: "grpcurl", source: "fullstorydev/grpcurl", sourceType: "github", description: "Command-line tool for interacting with gRPC servers", category: "http-api", agentValue: "JSON-based gRPC interaction without compiled proto stubs" },
  { name: "hey", source: "rakyll/hey", sourceType: "github", description: "HTTP load generator and benchmarking tool", category: "http-api", agentValue: "Quick API load testing with structured statistics" },

  // ── Git/Version Control
  { name: "gh", source: "cli/cli", sourceType: "github", description: "GitHub's official CLI for PRs, issues, repos, and actions", category: "git", agentValue: "Full GitHub API access with --json output" },
  { name: "gitleaks", source: "gitleaks/gitleaks", sourceType: "github", description: "Detect and prevent hardcoded secrets in git repos", category: "git", agentValue: "JSON report output for automated secret scanning" },
  { name: "git-cliff", source: "orhun/git-cliff", sourceType: "github", description: "Customizable changelog generator from conventional commits", category: "git", agentValue: "Automated changelog generation with JSON output" },
  { name: "delta", source: "dandavison/delta", sourceType: "github", description: "Syntax-highlighting pager for git diff", category: "git", agentValue: "Better diff visualization with raw mode for structured parsing" },
  { name: "commitizen", source: "commitizen-tools/commitizen", sourceType: "github", description: "Tool for creating committing rules and changelogs", category: "git", agentValue: "Enforces conventional commits, automatable with --yes" },

  // ── JavaScript/TypeScript
  { name: "prettier", source: "prettier", sourceType: "npm", description: "Opinionated code formatter for JS/TS/CSS/HTML/JSON", category: "javascript", agentValue: "Deterministic formatting with --check and JSON error output" },
  { name: "eslint", source: "eslint", sourceType: "npm", description: "Pluggable linting utility for JavaScript and TypeScript", category: "javascript", agentValue: "JSON output (-f json) with fix locations for automated fixes" },
  { name: "biome", source: "biomejs/biome", sourceType: "github", description: "Fast formatter and linter for JS/TS/JSON/CSS", category: "javascript", agentValue: "Single tool replacing eslint+prettier, JSON diagnostics" },
  { name: "tsx", source: "tsx", sourceType: "npm", description: "TypeScript execute — run TS files directly with Node.js", category: "javascript", agentValue: "Zero-config TS execution without build step" },
  { name: "esbuild", source: "esbuild", sourceType: "npm", description: "Extremely fast JavaScript/TypeScript bundler", category: "javascript", agentValue: "Sub-second builds with JSON metafile output" },
  { name: "swc", source: "swc-project/swc", sourceType: "github", description: "Super-fast Rust-based JS/TS compiler", category: "javascript", agentValue: "Fast transpilation, drop-in Babel replacement" },
  { name: "turbo", source: "turbo", sourceType: "npm", description: "High-performance build system for JS/TS monorepos", category: "javascript", agentValue: "Parallel tasks with --dry=json for dependency graph analysis" },
  { name: "tsc", source: "typescript", sourceType: "npm", description: "TypeScript compiler and type checker", category: "javascript", agentValue: "Type checking with parseable error output" },
  { name: "oxlint", source: "oxlint", sourceType: "npm", description: "Blazingly fast JS/TS linter (50-100x faster than ESLint)", category: "javascript", agentValue: "Near-instant linting with JSON output" },

  // ── Python
  { name: "uv", source: "astral-sh/uv", sourceType: "github", description: "Extremely fast Python package installer and resolver", category: "python", agentValue: "10-100x faster than pip, handles venvs and Python versions" },
  { name: "ruff", source: "astral-sh/ruff", sourceType: "github", description: "Extremely fast Python linter and formatter", category: "python", agentValue: "JSON output, replaces flake8+isort+black, sub-second linting" },
  { name: "mypy", source: "python/mypy", sourceType: "github", description: "Static type checker for Python", category: "python", agentValue: "JSON output for type errors, code quality automation" },
  { name: "pyright", source: "pyright", sourceType: "npm", description: "Fast static type checker for Python", category: "python", agentValue: "JSON output with --outputjson, faster than mypy" },
  { name: "pytest", source: "pytest-dev/pytest", sourceType: "github", description: "Full-featured Python testing framework", category: "python", agentValue: "JSON output via plugins, markers for selective execution" },

  // ── Container/Cloud
  { name: "docker", source: "moby/moby", sourceType: "github", description: "Container runtime and management platform", category: "cloud", agentValue: "JSON output (--format json), full container lifecycle automation" },
  { name: "kubectl", source: "kubernetes/kubectl", sourceType: "github", description: "Kubernetes command-line tool", category: "cloud", agentValue: "JSON/YAML output (-o json), JSONPath queries" },
  { name: "helm", source: "helm/helm", sourceType: "github", description: "Kubernetes package manager for charts", category: "cloud", agentValue: "JSON output, template rendering, automated deployments" },
  { name: "terraform", source: "hashicorp/terraform", sourceType: "github", description: "Infrastructure as Code for any cloud provider", category: "cloud", agentValue: "JSON plan output (-json), state inspection" },
  { name: "pulumi", source: "pulumi/pulumi", sourceType: "github", description: "Infrastructure as Code using real programming languages", category: "cloud", agentValue: "JSON output, programmatic infra in TS/Python/Go" },
  { name: "aws", source: "aws/aws-cli", sourceType: "github", description: "Official AWS command-line interface", category: "cloud", agentValue: "JSON output by default, JMESPath queries (--query)" },
  { name: "flyctl", source: "superfly/flyctl", sourceType: "github", description: "CLI for Fly.io application platform", category: "cloud", agentValue: "JSON output, simple app deployment automation" },
  { name: "podman", source: "containers/podman", sourceType: "github", description: "Daemonless container engine, Docker-compatible", category: "cloud", agentValue: "Docker-compatible JSON output, rootless containers" },

  // ── Package Managers
  { name: "pnpm", source: "pnpm/pnpm", sourceType: "github", description: "Fast, disk space efficient package manager", category: "package-managers", agentValue: "JSON output for dependency trees, strict dependencies" },
  { name: "bun", source: "oven-sh/bun", sourceType: "github", description: "All-in-one JS runtime, bundler, and package manager", category: "package-managers", agentValue: "Fastest JS installs, built-in test runner and bundler" },
  { name: "mise", source: "jdx/mise", sourceType: "github", description: "Polyglot runtime manager (replaces asdf, nvm, pyenv)", category: "package-managers", agentValue: "Single tool for all language runtimes, JSON output" },

  // ── Testing/QA
  { name: "playwright", source: "@playwright/test", sourceType: "npm", description: "Browser automation and end-to-end testing framework", category: "testing", agentValue: "JSON test reports, headless browser automation, codegen" },
  { name: "jest", source: "jest", sourceType: "npm", description: "Delightful JavaScript testing framework", category: "testing", agentValue: "JSON output (--json), snapshot testing, watch mode" },
  { name: "vitest", source: "vitest", sourceType: "npm", description: "Vite-native unit test framework, Jest-compatible", category: "testing", agentValue: "JSON reporter, fast HMR re-runs, Jest API compatible" },
  { name: "k6", source: "grafana/k6", sourceType: "github", description: "Modern load testing tool for developers", category: "testing", agentValue: "JSON output, scriptable in JS, threshold-based pass/fail" },
  { name: "artillery", source: "artillery", sourceType: "npm", description: "Cloud-scale load testing platform", category: "testing", agentValue: "JSON reports, YAML scenarios, HTTP/WebSocket/gRPC" },
  { name: "cypress", source: "cypress", sourceType: "npm", description: "Fast, reliable E2E testing for web applications", category: "testing", agentValue: "JSON output, headless mode, automatic screenshots on failure" },

  // ── Security
  { name: "trivy", source: "aquasecurity/trivy", sourceType: "github", description: "Comprehensive vulnerability scanner for containers and code", category: "security", agentValue: "JSON output, scans containers/filesystems/repos/IaC" },
  { name: "snyk", source: "snyk", sourceType: "npm", description: "Developer-first security platform CLI", category: "security", agentValue: "JSON output, dependency vulnerability scanning" },
  { name: "semgrep", source: "semgrep/semgrep", sourceType: "github", description: "Lightweight static analysis with custom pattern rules", category: "security", agentValue: "JSON output, custom rules, supports 30+ languages" },
  { name: "trufflehog", source: "trufflesecurity/trufflehog", sourceType: "github", description: "Find and verify leaked credentials in git repos", category: "security", agentValue: "JSON output, verifies if secrets are live" },
  { name: "osv-scanner", source: "google/osv-scanner", sourceType: "github", description: "Vulnerability scanner using the OSV database", category: "security", agentValue: "JSON output, scans lockfiles/SBOMs" },
  { name: "grype", source: "anchore/grype", sourceType: "github", description: "Vulnerability scanner for containers and filesystems", category: "security", agentValue: "JSON output, pairs with syft for SBOM pipeline" },

  // ── Documentation
  { name: "typedoc", source: "typedoc", sourceType: "npm", description: "Documentation generator for TypeScript projects", category: "documentation", agentValue: "JSON output plugin, generates API docs from TS source" },
  { name: "swagger-cli", source: "@apidevtools/swagger-cli", sourceType: "npm", description: "Validate and bundle OpenAPI/Swagger specs", category: "documentation", agentValue: "Validate API specs programmatically" },
  { name: "redocly", source: "@redocly/cli", sourceType: "npm", description: "OpenAPI linting, bundling, and documentation", category: "documentation", agentValue: "Lint OpenAPI specs with JSON output" },

  // ── DevOps/Automation
  { name: "just", source: "casey/just", sourceType: "github", description: "Command runner — better make for project commands", category: "devops", agentValue: "Simple task runner with --list for discovery" },
  { name: "act", source: "nektos/act", sourceType: "github", description: "Run GitHub Actions locally", category: "devops", agentValue: "Test CI workflows locally before pushing" },
  { name: "task", source: "go-task/task", sourceType: "github", description: "Task runner / simpler Make alternative in Go", category: "devops", agentValue: "YAML-based tasks, --json for task listing" },
  { name: "direnv", source: "direnv/direnv", sourceType: "github", description: "Per-directory environment variables", category: "devops", agentValue: "Automatic env loading per project, JSON export" },
  { name: "watchexec", source: "watchexec/watchexec", sourceType: "github", description: "Execute commands when files change", category: "devops", agentValue: "File watcher for auto-rebuilds with glob filters" },
  { name: "zoxide", source: "ajeetdsouza/zoxide", sourceType: "github", description: "Smarter cd command using frecency ranking", category: "devops", agentValue: "Fast directory navigation using learned paths" },

  // ── Database
  { name: "prisma", source: "prisma", sourceType: "npm", description: "Next-generation ORM for Node.js and TypeScript", category: "database", agentValue: "Schema-driven migrations, DB introspection, JSON output" },
  { name: "drizzle-kit", source: "drizzle-kit", sourceType: "npm", description: "CLI companion for Drizzle ORM migrations", category: "database", agentValue: "Schema diff and migration generation, TypeScript-first" },

  // ── AI/ML
  { name: "ollama", source: "ollama/ollama", sourceType: "github", description: "Run large language models locally", category: "ai-ml", agentValue: "Local LLM inference via CLI/API, JSON streaming" },
  { name: "llm", source: "simonw/llm", sourceType: "github", description: "CLI for interacting with LLMs (local and API)", category: "ai-ml", agentValue: "Unified LLM interface, template system, SQLite logging" },
  { name: "aider", source: "paul-gauthier/aider", sourceType: "github", description: "AI pair programming in your terminal", category: "ai-ml", agentValue: "Automated code editing via LLMs, git integration" },

  // ── Monitoring/Debugging
  { name: "procs", source: "dalance/procs", sourceType: "github", description: "Modern replacement for ps written in Rust", category: "monitoring", agentValue: "JSON output (--json), better process filtering" },
  { name: "dust", source: "bootandy/dust", sourceType: "github", description: "More intuitive version of du (disk usage)", category: "monitoring", agentValue: "Visual disk usage analysis for finding large files" },
  { name: "duf", source: "muesli/duf", sourceType: "github", description: "Disk usage/free utility with JSON output", category: "monitoring", agentValue: "JSON output (--json), clean disk space reporting" },
  { name: "hyperfine", source: "sharkdp/hyperfine", sourceType: "github", description: "Command-line benchmarking tool", category: "monitoring", agentValue: "JSON output (--export-json), statistical benchmarking" },
  { name: "bandwhich", source: "imsnif/bandwhich", sourceType: "github", description: "Terminal bandwidth utilization by process", category: "monitoring", agentValue: "Per-process network usage monitoring" },

  // ── Browser/Web
  { name: "lighthouse", source: "lighthouse", sourceType: "npm", description: "Automated web page quality auditing tool", category: "browser", agentValue: "JSON output, performance/accessibility/SEO scoring" },
  { name: "pa11y", source: "pa11y", sourceType: "npm", description: "Accessibility testing tool for web pages", category: "browser", agentValue: "JSON output, automated accessibility compliance" },

  // ── File Processing
  { name: "pandoc", source: "jgm/pandoc", sourceType: "github", description: "Universal document converter (40+ formats)", category: "file-processing", agentValue: "JSON AST output, convert between Markdown/HTML/PDF/DOCX" },
  { name: "exiftool", source: "exiftool/exiftool", sourceType: "github", description: "Read, write, and edit file metadata", category: "file-processing", agentValue: "JSON output (-j), metadata across 400+ file formats" },

  // ── GUI Wrappers (CLI-Anything — auto-generated CLIs for GUI apps)
  { name: "cli-anything-gimp", source: "./examples/cli-anything-gimp", sourceType: "local", description: "CLI wrapper for GIMP image editor with JSON output and batch processing", category: "gui-wrappers", agentValue: "Automate GIMP operations (resize, filter, convert) via structured CLI" },
  // Planned: these PyPI packages are not yet published. Entries are aspirational
  // and will fail in --curated mode until published. Use cli-anything-gimp (local) as reference.
  // { name: "cli-anything-blender", source: "cli-anything-blender", sourceType: "pypi", description: "CLI wrapper for Blender 3D modeling with JSON output", category: "gui-wrappers", agentValue: "Automate Blender renders, exports, and scene manipulation via CLI" },
  // { name: "cli-anything-inkscape", source: "cli-anything-inkscape", sourceType: "pypi", description: "CLI wrapper for Inkscape vector graphics editor with JSON output", category: "gui-wrappers", agentValue: "Automate SVG editing, format conversion, and batch vector operations" },
  // { name: "cli-anything-audacity", source: "cli-anything-audacity", sourceType: "pypi", description: "CLI wrapper for Audacity audio editor with JSON output", category: "gui-wrappers", agentValue: "Automate audio processing, format conversion, and effects via CLI" },
  // { name: "cli-anything-libreoffice", source: "cli-anything-libreoffice", sourceType: "pypi", description: "CLI wrapper for LibreOffice suite with JSON output", category: "gui-wrappers", agentValue: "Automate document conversion, spreadsheet ops, and presentation generation" },
  // { name: "cli-anything-obs-studio", source: "cli-anything-obs-studio", sourceType: "pypi", description: "CLI wrapper for OBS Studio recording and streaming", category: "gui-wrappers", agentValue: "Automate recording, streaming, and scene management via CLI" },
  // { name: "cli-anything-kdenlive", source: "cli-anything-kdenlive", sourceType: "pypi", description: "CLI wrapper for Kdenlive video editor with JSON output", category: "gui-wrappers", agentValue: "Automate video editing, rendering, and project management via CLI" },
  // { name: "cli-anything-shotcut", source: "cli-anything-shotcut", sourceType: "pypi", description: "CLI wrapper for Shotcut video editor with JSON output", category: "gui-wrappers", agentValue: "Automate video editing and export operations via CLI" },

  // ── Network
  { name: "mtr", source: "traviscross/mtr", sourceType: "github", description: "Network diagnostic combining ping and traceroute", category: "network", agentValue: "JSON output (--json), automated network path analysis" },
  { name: "dog", source: "ogham/dog", sourceType: "github", description: "Command-line DNS client (modern dig alternative)", category: "network", agentValue: "JSON output (--json), cleaner DNS lookups" },
  { name: "websocat", source: "vi/websocat", sourceType: "github", description: "Command-line WebSocket client", category: "network", agentValue: "Non-interactive WebSocket communication for APIs" },
  { name: "oha", source: "hatoo/oha", sourceType: "github", description: "HTTP load generator with TUI", category: "network", agentValue: "JSON output (--json), detailed latency histograms" },
];

// ── AI/ML Tools (loaded from ai-ml-tools.json) ──────────────────────

interface AiMlToolEntry {
  name: string;
  source: string;
  sourceType: "github" | "npm" | "pypi" | "local";
  description: string;
  subcategory: string;
  agentValue: string;
}

/** Load AI/ML tools from ai-ml-tools.json at project root */
export function loadAiMlTools(projectRoot: string): CliTool[] {
  const jsonPath = join(projectRoot, "ai-ml-tools.json");
  if (!existsSync(jsonPath)) return [];
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
export function loadAllTools(projectRoot: string): CliTool[] {
  const aiMlTools = loadAiMlTools(projectRoot);
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

/** Extract unique sorted categories from a tool list */
export function getCategories(tools: CliTool[]): string[] {
  return [...new Set(tools.map(t => t.category))].sort();
}

/**
 * Look up curated metadata for a tool by matching its source URI or name
 * against the curated registry. Returns null if not found.
 */
export function findCuratedMeta(
  source: string,
  toolName: string,
  projectRoot: string,
): { description: string; agentValue: string; category: string } | null {
  const allTools = loadAllTools(projectRoot);
  // Normalize source for matching: strip prefixes like pypi:, npm:, crates:
  const bare = source.replace(/^(pypi:|npm:|crates:|github:)/, "");
  for (const t of allTools) {
    if (
      t.source === source ||
      t.source === bare ||
      t.name === toolName ||
      t.name.toLowerCase() === toolName.toLowerCase()
    ) {
      return { description: t.description, agentValue: t.agentValue, category: t.category };
    }
  }
  return null;
}
