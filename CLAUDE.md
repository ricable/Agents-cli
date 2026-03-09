# agents-cli — Project Instructions

## What this is

agents-cli is a package manager for AI agent tools. It resolves, installs, analyzes, and exposes CLI tools from GitHub repos, npm packages, PyPI packages, crates.io crates, or local paths. Tools are stored in `~/.agents-cli/` and can be invoked directly or exposed via MCP.

Built on the "Rewrite Your CLI for AI Agents" philosophy — every command outputs structured JSON, supports schema introspection, respects context window limits, and hardens inputs against agent hallucinations.

## Strict guidelines

- **Always build before running**: `npm run build` (tsup). Entry points are in `dist/`.
- **Never modify `dist/`** — edit source in `lib/` and `bin/`, then rebuild.
- **Source is ESM** — all imports must use `.js` extensions (`import { foo } from "./bar.js"`).
- **No default exports** — use named exports only.
- **Types in `lib/types.ts`** — all shared interfaces and types live there. Don't scatter type definitions.
- **Security**: The codebase has SSRF protection, path traversal guards, size limits, and input validation. Do NOT bypass these. Do NOT remove `assertWithinDir`, `isPrivateUrl`, `validateToolId`, guard functions, or size checks.
- **SSRF on HTTP helpers**: `fetchHtml()` in `lib/classifier/github.ts` restricts to github.com hosts only. `fetchJson()` in `lib/resolver.ts` uses `isPrivateUrl()`. Any new HTTP helper must check hosts and cap response size (see `MAX_RESPONSE_BYTES`).
- **Shell safety**: When interpolating tool names or URIs into generated shell scripts, always call `validateToolName()` first and shell-quote all values (`shellQuote()` from `lib/skills.ts`). Never pass unsanitized user input into shell commands.
- **Path containment**: When writing files based on user/tool-provided paths, always verify the resolved path stays within the intended output directory: `resolve(fullPath).startsWith(resolve(baseDir) + "/")`. Use `rejectPathTraversal()` on all user-provided path arguments (e.g. `--out`).
- **Promise safety**: When wrapping Node.js streams in Promises, use a `settled` flag to prevent double-resolve/reject (see `fetchHtml` pattern). `res.destroy()` can trigger both error and close events.
- **No interactive prompts** — the CLI must work non-interactively (CI/agent-friendly).
- **Tests**: Run `npm test` (vitest). Tests are in `tests/`. Write tests for new functionality.
- **Atomic writes**: Store uses temp-file + rename for crash safety. Maintain this pattern.
- **Structured output everywhere**: Every command must support `--json` flag and `OUTPUT_FORMAT=json` env var via the `CliOutput<T>` envelope from `lib/output.ts`. Error paths must also use `emit(failure(...))` when `--json` is active — never fall back to bare `console.error`.
- **Dry-run on mutating commands**: All commands that modify state must support `--dry-run`. This includes file writes, index generation, and lockfile creation — not just the primary operation.
- **Input hardening**: All user/agent inputs must pass through guards in `lib/guards.ts` before use. Key guards: `validateSource()` for tool URIs, `validateToolName()` for tool names used in paths/scripts, `rejectPathTraversal()` for file paths.
- **Skill description quality**: Generated descriptions must include "Use when" + action verbs recognized by `scoreTrigger()` (e.g. "running", "building", "deploying", "configuring", "managing", "processing"). Trigger score must be ≥ 0.80. Use `CATEGORY_ACTION_MAP` (module-level constant) in `buildDescription()` for curated tools — triggers use `%` placeholder templated with tool name for uniqueness (e.g. "searching code with %").
- **Ecosystem-aware content**: Generated troubleshooting, install scripts, and guides must match the tool's actual ecosystem. Use `detectToolLanguage(tool)` which checks source format → GitHub topics → installed files (Cargo.toml/go.mod/etc.) → curated category. Never suggest `pip install` for a Rust binary or `npm update` for a Python tool.
- **No fabricated commands**: Never generate CLI subcommands that don't exist. Only emit commands extracted from actual `--help` output or README code blocks. Libraries with 0 commands get API usage, not fake CLI commands.
- **Frontmatter fields**: `ALLOWED_FIELDS` in `lib/guards.ts` must include all fields used by the forge: `name`, `description`, `version`, `ingredients`, `tags`, `domain`, `allowed-tools`, `compatibility`, `license`, `metadata`.

## Key commands

```bash
# Build & test
npm run build          # build with tsup
npm run dev            # watch mode
npm test               # run tests (vitest)
npm run lint           # type check (tsc --noEmit)

# Run CLI in dev mode (via tsx)
npx tsx bin/agents-cli.ts <command>

# Run CLI from build
node dist/bin/agents-cli.js <command>
```

## CLI commands reference

All commands support `--json` for structured JSON output, or set `OUTPUT_FORMAT=json`.

### Tool management

```bash
# Add a tool (supports --dry-run, --deep, --skill, --force)
agents-cli add owner/repo              # from GitHub
agents-cli add @scope/pkg              # from npm (scoped)
agents-cli add npm:express             # from npm (bare name)
agents-cli add pypi:ruff               # from PyPI
agents-cli add crates:ripgrep          # from crates.io
agents-cli add ./local-path            # from local directory
agents-cli add owner/repo --deep       # deep-probe subcommands recursively
agents-cli add owner/repo --skill      # auto-generate rich SKILL.md
agents-cli add owner/repo --dry-run    # preview without installing

# List installed tools (supports --fields)
agents-cli list                        # all installed tools
agents-cli list --json --fields name,version  # only name and version fields

# Describe a tool (supports --fields)
agents-cli describe <tool>             # detailed info + help output
agents-cli describe <tool> --json --fields commands,globalFlags

# Run a tool (supports --dry-run)
agents-cli run <tool> -- <args>        # execute a tool
agents-cli run <tool> --dry-run -- <args>  # preview execution

# Update / remove (supports --dry-run)
agents-cli update <tool>
agents-cli remove <tool>
agents-cli remove <tool> --dry-run
```

### Schema introspection

```bash
# Get machine-readable command tree for any installed tool
agents-cli schema <tool>               # default depth=3
agents-cli schema <tool> --depth 5     # deeper probing
agents-cli schema <tool> --refresh     # re-probe (ignore cache)
agents-cli schema <tool> --json        # structured JSON output
```

### Skills

```bash
# Generate SKILL.md for an installed tool
agents-cli skills generate             # interactive
agents-cli skills generate --from-tool <name>  # from installed tool

# Install / manage skills
agents-cli skills install SKILL.md     # install a skill bundle
agents-cli skills install SKILL.md --dry-run
agents-cli skills list
agents-cli skills remove <name>

# Initialize a new skill
agents-cli init --name "my-skill"
```

### Lockfile & reproducibility

```bash
agents-cli freeze                      # generate agentcli.lock
agents-cli install                     # install from lockfile
agents-cli verify                      # check lockfile matches
```

### Registry & discovery

```bash
agents-cli search "query"              # search for tools
agents-cli scan ./dir                  # scan directory for CLIs
agents-cli scan ./dir --deep           # deep-probe discovered CLIs
agents-cli info <name>                 # show registry info
```

### MCP bridge

```bash
agents-cli mcp start                   # expose tools as MCP server
agents-cli mcp list                    # list MCP-available tools
```

### Skill Forge (unified skill generation pipeline)

```bash
# Direct tool mode — resolve, install, analyze, and forge a skill
npx tsx examples/skill-forge.ts --tool pypi:ruff            # PyPI
npx tsx examples/skill-forge.ts --tool crates:ripgrep       # crates.io
npx tsx examples/skill-forge.ts --tool astral-sh/uv         # GitHub
npx tsx examples/skill-forge.ts --tool @anthropic-ai/sdk    # npm (scoped)
npx tsx examples/skill-forge.ts --tool npm:express          # npm (bare)
npx tsx examples/skill-forge.ts --tool httpie               # bare name → pypi fallback
npx tsx examples/skill-forge.ts --tool pypi:ruff --deep     # deep recursive --help probing
npx tsx examples/skill-forge.ts --tool crates:ripgrep --json # structured JSON output

# Discovery mode — NL prompt → multi-registry search → forge skills
npx tsx examples/skill-forge.ts "build a RAG pipeline with vector search"
npx tsx examples/skill-forge.ts "python linting" --limit 5
npx tsx examples/skill-forge.ts --dry-run "vector search"   # preview without installing

# Trending mode — scrape GitHub trending → filter CLI tools → forge skills
npx tsx examples/skill-forge.ts --trending
npx tsx examples/skill-forge.ts --trending --language rust --since weekly --limit 10
npx tsx examples/skill-forge.ts --trending --dry-run

# Curated mode — 91 general + 502 AI/ML tools from registry → forge skills
npx tsx examples/skill-forge.ts --curated --list-categories
npx tsx examples/skill-forge.ts --curated --category ai-ml/llm-inference
npx tsx examples/skill-forge.ts --curated --category code-search --limit 5
npx tsx examples/skill-forge.ts --curated --skip-installed --limit 20
npx tsx examples/skill-forge.ts --curated --force --limit 600  # full run, all tools

# Workflow mode — NL prompt → template-based agent code generation
npx tsx examples/skill-forge.ts --workflow "build a content publishing pipeline"
npx tsx examples/skill-forge.ts --workflow --list

# Enhanced audit mode — quality check with domain filter and AI scoring
npx tsx examples/skill-forge.ts --audit
npx tsx examples/skill-forge.ts --audit --domain agent
npx tsx examples/skill-forge.ts --audit --ai --strict

# Search mode — query indexed skills (FTS/hybrid/vector)
npx tsx examples/skill-forge.ts --search "python linting"
npx tsx examples/skill-forge.ts --search "vector search" --search-mode hybrid
npx tsx examples/skill-forge.ts --search "error handling" --pkg ruff

# Index mode — rebuild search index from generated skills
npx tsx examples/skill-forge.ts --index
npx tsx examples/skill-forge.ts --index --domain agent

# Plugin mode — build domain plugins, agent definitions, marketplace
npx tsx examples/skill-forge.ts --plugin --dry-run
npx tsx examples/skill-forge.ts --plugin --domain agent --ai
npx tsx examples/skill-forge.ts --agent-defs --domain agent
npx tsx examples/skill-forge.ts --marketplace

# Lockfile — freeze/verify skill integrity
npx tsx examples/skill-forge.ts --freeze
npx tsx examples/skill-forge.ts --verify

# MCP server — expose forged skills as MCP tools
npx tsx examples/skill-forge.ts --mcp

# Factory mode — use skill-factory pipeline with AI enhancement
npx tsx examples/skill-forge.ts --tool pypi:ruff --factory
npx tsx examples/skill-forge.ts --tool pypi:ruff --factory --ai

# Monorepo mode — discover sub-packages in monorepos
npx tsx examples/skill-forge.ts --tool owner/repo --monorepo

# Cache control
npx tsx examples/skill-forge.ts --tool pypi:ruff --no-cache  # skip cache
npx tsx examples/skill-forge.ts --tool pypi:ruff --force     # force regeneration

# Common flags: --deep, --dry-run, --json, --strict, --limit N, --no-cache, --force
```

## Agent-first design principles

These 7 principles from "Rewrite Your CLI for AI Agents" are integrated throughout:

1. **Structured JSON output** — `CliOutput<T>` envelope `{ok, command, data, error, meta}` on every command via `--json` or `OUTPUT_FORMAT=json`
2. **Schema introspection** — `schema <tool>` recursively probes subcommand trees (up to 500 commands, depth 3)
3. **Context window discipline** — `--fields name,version` picks specific fields to reduce token usage
4. **Input hardening** — `lib/guards.ts` rejects control chars, path traversals, embedded params, percent-encoding
5. **Rich skill generation** — `generateRichSkillMd()` produces trigger-aware SKILL.md with examples and agent integration
6. **Multi-surface output** — same source of truth powers CLI text, JSON, and MCP
7. **Dry-run safety** — `--dry-run` on all mutating commands shows what would happen

## Project structure

```
bin/
  agents-cli.ts        — main CLI entry point (commander), all 14+ commands
  agent-run.ts         — tool execution engine
lib/
  types.ts             — all shared types (CliOutput, Tool, ManifestEntry, etc.)
  index.ts             — public SDK entry point (re-exports everything)
  output.ts            — structured output layer: success(), failure(), emit()
  guards.ts            — input hardening: validateSource, validateToolName, rejectPathTraversal
  resolver.ts          — source format detection + metadata fetching
  installer.ts         — download, extract, build, install deps
  analyzer.ts          — deep recursive --help probing, command/flag parsing
  store.ts             — flat-file JSON tool store + CONTEXT.md generation
  registry.ts          — 4-layer registry cascade (local, community, github, npm)
  skills.ts            — SKILL.md parsing, skill install/remove, lockfile, rich generation
  skill-content.ts     — structural skill generation (scripts, patterns, api docs)
  skill-tester.ts      — quality gate: trigger scoring + structural quality
  skill-factory.ts     — 3-layer skill creation (structural → AI-enhanced)
  mcp.ts               — MCP bridge for exposing tools to AI agents
  mcp-skill.ts         — opensrc MCP skill bridge (callOpensrc, opensrc)
  chunker.ts           — AST-aware semantic chunking of source files
  extractor.ts         — README excerpts, code blocks, export groups, repo analysis, section extraction
  curated-tools.ts     — 91 general + AI/ML tool registry for --curated mode
  cache.ts             — SkillCache, file hashing, incremental generation
  search.ts            — hybrid FTS + vector search (lazy better-sqlite3)
  indexer.ts           — source indexing pipeline (files → chunks → SQLite)
  indexes.ts           — domain grouping + master/domain index generation
  domains.ts           — domain trigger phrases (19 domains) for skill descriptions
  pkg-utils.ts         — package.json reading, monorepo walking
  schemas.ts           — zod schemas
  classifier/          — multi-registry auto-discovery
    npm.ts             — npm registry search
    github.ts          — GitHub repo/trending search
    crates.ts          — crates.io search
    pypi.ts            — PyPI package discovery
  pipeline/            — NL prompt intelligence
    intent.ts          — classify user intent from natural language
    entity-extractor.ts — extract named entities (APIs, services, libraries)
    prompt-parser.ts   — parse capabilities and direct terms
    capability-map.ts  — capability → search query mapping
    workflow-gen.ts    — generate skills from workflow templates
    templates/         — workflow skill templates
  plugin/              — plugin system
    builder.ts         — build plugin.json from installed tools
    publisher.ts       — publish plugins to registry
    ai-generator.ts    — generate agent definitions
    marketplace.ts     — marketplace generation
  db/                  — database layer (lazy better-sqlite3)
    domain-db.ts       — per-domain SQLite databases
    aggregated-db.ts   — aggregated cross-domain database
    sqlite.ts          — SQLite utilities, WAL pragmas, chunk upsert
examples/
  skill-forge.ts           — CLI dispatcher + arg parsing (thin entry point)
  forge/
    types.ts               — ForgedSkill, QualityResult, BatchResult, CliArgs
    helpers.ts             — log, atomicWrite, fmtTable, toolToManifestEntry, inferDomain
    parse-args.ts          — CLI argument parser (--tool, --search, --plugin, etc.)
    stages.ts              — discover, resolveInstallAnalyze, chunkToolSource, forgeSkill, assessQuality, buildIndexes
    mode-tool.ts           — --tool mode (+ --factory, --monorepo)
    mode-discovery.ts      — NL prompt discovery mode
    mode-trending.ts       — --trending mode
    mode-curated.ts        — --curated mode
    mode-workflow.ts       — --workflow mode (+ --skill-output)
    mode-audit.ts          — --audit mode
    mode-search.ts         — --search mode (FTS/hybrid/vector)
    mode-index.ts          — --index mode (rebuild search DB)
    mode-plugin.ts         — --plugin, --agent-defs, --marketplace modes
    mode-lockfile.ts       — --freeze, --verify modes
    mode-mcp.ts            — --mcp mode (MCP server)
  regenerate-skills.ts     — batch regeneration of existing skills
  chunker-demo.ts          — AST chunking demonstration
  generated-skills/        — 350+ auto-generated skill directories
  generated-workflows/     — template-generated agent code
tests/
  skills.test.ts, resolver.test.ts, guards.test.ts, analyzer.test.ts,
  store.test.ts, registry.test.ts, schemas.test.ts, mcp.test.ts,
  pipeline.test.ts, pypi.test.ts, crates.test.ts, agent-run.test.ts
```

## Data directory: ~/.agents-cli/

```
~/.agents-cli/
  tools.json           — tool metadata store
  tools/<tool-id>/
    CONTEXT.md         — auto-generated tool docs
    package/           — installed tool files
  skills/<skill-name>/
    skill.json         — skill metadata
    CONTEXT.md         — assembled context
```

## Source format prefixes

| Prefix | Example | Registry |
|--------|---------|----------|
| (none) | `owner/repo` | GitHub |
| `@scope/` | `@anthropic-ai/sdk` | npm (scoped) |
| `npm:` | `npm:express` | npm (bare name) |
| `pypi:` | `pypi:ruff` | PyPI |
| `crates:` | `crates:ripgrep` | crates.io |
| `./` or `/` | `./local-path` | local directory |

Bare names without `/` or prefix (e.g. `httpie`) fall back to `pypi:` then error.

## Pipeline flow

1. **Resolve** — `createResolver()` detects format (github/npm/pypi/crates/local), fetches metadata from API. GitHub resolver also fetches version from releases/tags API via `fetchGithubVersion()`.
2. **Install** — `createInstaller()` downloads tarball (with branch fallback: main→master→develop), extracts, runs `npm install` / `uv pip install` / `cargo binstall`. Huge repos (bun, pytorch, etc.) are skipped via `HUGE_REPOS` set in `stages.ts`.
3. **Analyze** — `createAnalyzer()` runs `--help`/`-h`/`help`, parses commands and flags (recursive mode available)
4. **Deep probe** — `deepProbe(binPath, { maxDepth })` recursively probes subcommand trees; returns `{ tree, totalCommands }`
5. **Store** — `createStore()` persists tool JSON + generates CONTEXT.md
6. **Generate** — `generateRichSkillMd()` / `generateSkillDirectory()` produces SKILL.md + references/ + scripts/. Uses curated metadata (`_curatedMeta`) for category-specific triggers (via `CATEGORY_ACTION_MAP` with `%` tool-name templates) and README sections (`_readmeSections`) for real content. `detectToolLanguage()` inspects source format, GitHub topics, and installed files (Cargo.toml/go.mod/etc.) to produce ecosystem-correct troubleshooting, install scripts, and guides. `isLikelyCli()` determines if a tool is a CLI (→ `cli-tool` tag) vs library. When analyzer finds 0 commands, `extractCommandsFromReadme()` provides fallback subcommands from README code blocks. Install-only code blocks are filtered via `INSTALL_CMD_RE`.
7. **Quality** — `testSkillSync()` / `assessQuality()` trigger scoring + structural quality gate
8. **Index** — `groupByDomain()` / `generateMasterIndex()` domain grouping + index skills
9. **Factory** — `runSkillFactory()` optional 3-layer pipeline (structural → AI-enhanced)
10. **MCP** — `McpBridge` exposes installed tools as MCP server

### Skill forge modes (examples/skill-forge.ts)

The forge dispatcher delegates to mode modules in `examples/forge/`:

| Mode | Flag | Module | Description |
|------|------|--------|-------------|
| Tool | `--tool <source>` | `mode-tool.ts` | Direct tool → skill (+ `--factory`, `--monorepo`) |
| Discovery | positional prompt | `mode-discovery.ts` | NL prompt → multi-registry search → forge |
| Trending | `--trending` | `mode-trending.ts` | GitHub trending page → filter CLI → forge |
| Curated | `--curated` | `mode-curated.ts` | 91 general + 502 AI/ML tools → forge |
| Workflow | `--workflow` | `mode-workflow.ts` | NL prompt → template-based agent code |
| Audit | `--audit` | `mode-audit.ts` | Quality check (+ `--domain`, `--ai`) |
| Search | `--search` | `mode-search.ts` | FTS/hybrid/vector query indexed skills |
| Index | `--index` | `mode-index.ts` | Rebuild search DB from generated skills |
| Plugin | `--plugin` | `mode-plugin.ts` | Build domain plugins, agent defs, marketplace |
| Lockfile | `--freeze`/`--verify` | `mode-lockfile.ts` | Freeze/verify skill integrity |
| MCP | `--mcp` | `mode-mcp.ts` | Expose forged skills as MCP tools |

## Classifier API conventions

All classifiers in `lib/classifier/` follow the same signature:

```typescript
export async function discoverXPackages(query?: string, limit?: number): Promise<ExtendedManifestEntry[]>
```

- When `query` is provided, search the registry for that query
- When `query` is omitted, search across hardcoded keyword groups
- Always return `ExtendedManifestEntry[]` (extends `ManifestEntry`)

## Skill spec compliance (Anthropic)

Generated skills must comply with the Anthropic skill specification:

- **name**: kebab-case, max 64 chars, no reserved words ("claude", "anthropic")
- **description**: max 1024 chars, must include trigger phrase ("Use when..."), no XML tags, third person
- **tags**: array of relevant keywords for discovery
- **SKILL.md body**: max 500 lines, progressive disclosure (Quick Start → details → references)
- **references/**: one level deep from SKILL.md (no nested subdirectories)
- **No README.md** inside skill folders — use SKILL.md as the entry point
- **File must be exactly `SKILL.md`** (case-sensitive, not `SKILL.MD` or `skill.md`)
- **scripts/**: executable helpers (bash `.sh`, python `.py` with uv inline metadata)

Quality gate thresholds (from `testSkillSync`):
- Trigger score ≥ 0.80 (fraction of trigger queries that match the description)
- Quality score ≥ 6/10 (structural quality check)

## Key function signatures

```typescript
// Output (lib/output.ts) — always use these, never bare console.log for commands
success<T>(command: string, data: T, startTime: number): CliOutput<T>
failure(command: string, code: string, message: string, startTime: number): CliOutput<never>
emit<T>(result: CliOutput<T>, json: boolean): void

// Guards (lib/guards.ts) — call before using user input
validateSource(source: string): void      // validates tool URI format
validateToolName(name: string): void      // validates name for paths/scripts
rejectPathTraversal(path: string, label: string): void  // blocks ../ in paths

// Deep probing (lib/analyzer.ts)
deepProbe(binPath: string, opts: { maxDepth: number }): { tree: ToolCommand[], totalCommands: number }

// Skills (lib/skills.ts)
parseFrontmatter(content: string): SkillFrontmatter | null  // returns { name, version, description, ingredients, tags, compatibility, domain }
installTool(source: string, dataDir: string, opts): Promise<Tool>
generateRichSkillMd(tool: Tool): string
generateSkillDirectory(tool: Tool): { skillMd: string, files: Record<string, string> }
generateInstallScript(tool: Tool): string
generateValidateScript(): string
shellQuote(s: string): string
writeLockfile(lockPath: string, tools: Tool[]): void

// Quality (lib/skill-tester.ts)
testSkillSync(skillPath: string, preloadedContent?: string): SkillTestResult
testAllSkillsSync(dir: string, domainFilter?: string): SkillTestResult[]  // optional domain filter
testAllSkills(dir: string, useAI?: boolean, domain?: string): Promise<SkillTestResultFull[]>
printQualityReport(results: SkillTestResult[]): void

// Classifiers (lib/classifier/*.ts) — all follow same pattern
discoverNpmPackages(query?: string, limit?: number): Promise<ExtendedManifestEntry[]>
discoverGitHubRepos(query?: string, limit?: number): Promise<ExtendedManifestEntry[]>
discoverCratesPackages(query?: string, limit?: number): Promise<ExtendedManifestEntry[]>
discoverPyPIPackages(query?: string, limit?: number): Promise<ExtendedManifestEntry[]>

// GitHub trending scraping (lib/classifier/github.ts)
fetchHtml(url: string, maxRedirects?: number): Promise<string>  // github.com only, 5MB limit
scrapeTrendingHtml(language: string, since: string): Promise<TrendingRepo[]>
isLikelyCli(repo: TrendingRepo): { likely: boolean; reason: string }
getWellKnownCliRepos(): TrendingRepo[]  // 15 fallback repos

// Curated tools (lib/curated-tools.ts)
loadAllTools(projectRoot: string): CliTool[]    // 91 general + AI/ML from ai-ml-tools.json
loadAiMlTools(projectRoot: string): CliTool[]   // AI/ML tools only
getCategories(tools: CliTool[]): string[]       // unique sorted categories
GENERAL_TOOLS: CliTool[]                        // 91 general-purpose CLI tools

// Extractor (lib/extractor.ts) — README content extraction for skill generation
extractReadmeSections(readme: string, maxSectionChars?: number): ReadmeSections  // code-block-aware section splitting, cleans badges/HTML
extractReadmeExcerpt(readme: string, maxChars?: number): string
extractCodeBlocks(markdown: string, maxBlocks?: number, maxChars?: number): string[]
extractCommandsFromReadme(readme: string, toolName: string): Array<{ name: string; description: string }>  // fallback command extraction
isActualCode(code: string, lang: string): boolean   // filters prose wrapped in code fences
cleanMarkdownSection(text: string): string           // strips badges, HTML comments, noise
INSTALL_CMD_RE: RegExp                               // shared install-command detection regex

// Skill factory (lib/skill-factory.ts)
runSkillFactory(opts: SkillFactoryOptions): Promise<SkillFactoryResult>

// Indexes (lib/indexes.ts)
groupByDomain(entries: ManifestEntry[]): Map<string, ManifestEntry[]>
generateDomainIndex(domain: string, entries: ManifestEntry[], triggers: DomainTriggers): string
generateMasterIndex(manifest: Manifest, triggers: DomainTriggers): string
```

## Do NOT

- Add heavy dependencies — the CLI should stay lean
- Use `yaml` or `js-yaml` — we have a custom frontmatter parser (`parseFrontmatter` in skills.ts)
- Skip the build step — TypeScript source is not directly runnable via node (only via tsx)
- Remove security guards (SSRF, path traversal, size limits, input validation)
- Use `process.exit()` — set `process.exitCode` instead
- Add interactive prompts or TTY-dependent features
- Bypass the `CliOutput<T>` envelope — all commands must use `success()`/`failure()`/`emit()`
- Remove input hardening guards from `lib/guards.ts`
- Interpolate unsanitized tool names/URIs into shell scripts — always validate + quote
- Write files outside the intended output directory — always verify path containment
- Use `require()` in ESM modules — use `import` (the codebase is pure ESM)
- Hardcode `dryRun: false` — always thread the dry-run flag through the full pipeline
- Return bare `console.error` when `--json` is active — use `emit(failure(...))`
- Add HTTP helpers without SSRF checks — validate hostname and cap response body size
- Use magic numbers for detection — check file existence directly (e.g. `existsSync`) not indirect heuristics
- Match frontmatter fields with full-content regex — use `parseFrontmatter()` return values (it extracts `domain`, `name`, `description`, etc.)
- Generate fabricated CLI subcommands — only emit commands from actual `--help` output or README code blocks
- Use the same trigger text for different tool categories — each `categoryActionMap` entry must be unique and match the tool's actual domain
- Suggest wrong package managers in generated content — match ecosystem to source format (pypi→pip, npm→npm, crates→cargo, github→releases)
