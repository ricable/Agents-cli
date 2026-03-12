# agents-cli

Package manager for AI agent tools. Resolves, installs, analyzes, exposes CLI tools from GitHub/npm/PyPI/crates.io/local. Stored in `~/.agents-cli/`. Built on "Rewrite Your CLI for AI Agents" — structured JSON output, schema introspection, context window discipline, input hardening, rich skill generation, multi-surface output, dry-run safety.

## Build & Test

```bash
npm run build          # tsup (required before running)
npm run dev            # watch mode
npm test               # vitest
npm run lint           # tsc --noEmit
npx tsx bin/agents-cli.ts <cmd>          # dev mode
npx tsx score-all.ts                     # score skills
npx tsx examples/skill-forge.ts --audit  # quality audit
bash battle-test-ecosystem.sh --quick    # battle test (34 checks)
```

## Hard Rules

- **ESM only** — `.js` extensions on imports, named exports, no `require()`, no default exports
- **Never modify `dist/`** — edit `lib/`+`bin/`, rebuild
- **Types in `lib/types.ts`** — all shared interfaces/types there
- **Security** — never bypass SSRF (`isPrivateUrl`), path traversal (`rejectPathTraversal`, `assertWithinDir`), size limits, input validation (`validateSource`, `validateToolName`)
- **SSRF**: `fetchHtml()` github.com only; `fetchJson()` uses `isPrivateUrl()`. New HTTP helpers must check hosts + cap response size (`MAX_RESPONSE_BYTES`)
- **Shell safety** — `validateToolName()` + `shellQuote()` before interpolating into shell
- **Path containment** — `resolve(path).startsWith(resolve(baseDir) + "/")`. Use `rejectPathTraversal()` on user paths
- **Promise safety** — `settled` flag to prevent double-resolve/reject on streams
- **Error handling** — `toErrorMessage(err)` from `lib/output.ts`, never `(err as Error).message`
- **Structured output** — all commands use `success()`/`failure()`/`emit()` via `CliOutput<T>`. `--json` + `OUTPUT_FORMAT=json` everywhere. Error paths use `emit(failure(...))` when `--json` active
- **Dry-run** — all mutating commands support `--dry-run` (file writes, index gen, lockfile)
- **No interactive prompts** — CI/agent-friendly
- **Atomic writes** — temp-file + rename
- **No `process.exit()`** — use `process.exitCode`
- **No fabricated commands** — only from actual `--help` or README code blocks
- **Ecosystem-aware** — `detectToolLanguage()` checks source→topics→files→category. Never wrong package manager
- **Binary name inference** — `inferBinaryNames()` checks Cargo.toml `[[bin]]`, Go `cmd/`, `go.mod`. Use binary names in templates
- **Frontmatter** — use `parseFrontmatter()` return values, never regex on full content
- **Version fallbacks** — GitHub releases→tags→`readSourceVersion()`→package.json→"0.0.0". Set `GITHUB_TOKEN` for higher rate limits
- **Skill descriptions** — must have "Use when" + action verbs + "Do NOT use for" + TechNames for trigger score ≥ 0.80. Use `CATEGORY_ACTION_MAP` with `%` templates. `DOMAIN_NEGATIVE_TRIGGERS` for negative clauses
- **Frontmatter fields** — `ALLOWED_FIELDS` in guards.ts: name, description, version, ingredients, tags, domain, allowed-tools, compatibility, license, metadata, context, argument-hint, disable-model-invocation, agent, hooks, user-invocable, model

## Source Prefixes

| Prefix | Example | Registry |
|--------|---------|----------|
| (none) | `owner/repo` | GitHub |
| `@scope/` | `@anthropic-ai/sdk` | npm scoped |
| `npm:` | `npm:express` | npm bare |
| `pypi:` | `pypi:ruff` | PyPI |
| `crates:` | `crates:ripgrep` | crates.io |
| `./` `/` | `./local-path` | local |

Bare names (e.g. `httpie`) → `pypi:` fallback.

## CLI Commands (all support `--json`)

```bash
# Tools: add/list/describe/run/update/remove (all support --dry-run)
agents-cli add owner/repo [--deep --skill --force --dry-run]
agents-cli add pypi:ruff | npm:express | crates:ripgrep | @scope/pkg | ./path
agents-cli list [--fields name,version]
agents-cli describe <tool> [--fields commands,globalFlags]
agents-cli run <tool> [--dry-run] -- <args>
agents-cli update/remove <tool> [--dry-run]

# Schema introspection
agents-cli schema <tool> [--depth 5 --refresh --json]

# Skills
agents-cli skills generate [--from-tool <name>]
agents-cli skills install/list/remove

# Lockfile
agents-cli freeze | install | verify

# Registry
agents-cli search "query" | scan ./dir [--deep] | info <name>

# MCP
agents-cli mcp start | list
```

## Skill Forge (`npx tsx examples/skill-forge.ts`)

```bash
# Direct tool
--tool pypi:ruff [--deep --json --factory --monorepo --force --no-cache]

# Discovery (NL → multi-registry search)
"build a RAG pipeline" [--limit 5 --dry-run]

# Modes
--trending [--language rust --since weekly --limit 10]
--curated [--category ai-ml/llm-inference --skip-installed --force --limit 600]
--workflow "CI/CD pipeline" [--list --skill-output]
--audit [--domain agent --ai --strict]
--search "query" [--search-mode hybrid --pkg ruff]
--index [--domain agent]
--plugin [--full --multi-runtime --domain git --ai --output-dir ~/plugins]
--agent-defs [--domain agent --ai]
--marketplace [--dry-run]
--freeze | --verify
--system [--limit 20 --deep]
--mcp
--audit-plugins [--json]
--benchmark [--json]

# Common flags: --deep --dry-run --json --strict --limit N --no-cache --force
# --domain X --ai --full --multi-runtime --output-dir --batch-size N
# --timeout <ms> --concurrency N --resume <path> --no-index
```

## Project Structure

```
bin/agents-cli.ts — CLI entry (commander, 14+ commands)
bin/agent-run.ts  — tool execution engine
lib/
  types.ts        — CliOutput, Tool, ManifestEntry, etc.
  index.ts        — public SDK entry (re-exports)
  output.ts       — success(), failure(), emit(), toErrorMessage()
  guards.ts       — validateSource, validateToolName, rejectPathTraversal
  resolver.ts     — source detection + metadata (github/npm/pypi/crates/local)
  installer.ts    — download, extract, build (branch fallback: main→master→develop)
  analyzer.ts     — --help probing, deepProbe(), detectInteractionMode()
  store.ts        — flat-file JSON store + CONTEXT.md
  registry.ts     — 4-layer cascade (local→community→github→npm)
  skills.ts       — SKILL.md gen, parseFrontmatter(), scoreTrigger(), shellQuote()
  skill-content.ts — structural gen (scripts, patterns, api docs)
  skill-tester.ts — quality gate: trigger/quality/content scoring
  skill-factory.ts — 3-layer pipeline (structural→AI)
  mcp.ts          — MCP bridge
  mcp-skill.ts    — opensrc MCP skill bridge
  chunker.ts      — AST-aware semantic chunking
  extractor.ts    — README parsing, inferBinaryNames(), readSourceVersion()
  curated-tools.ts — 91 general + AI/ML tool registry
  cache.ts        — SkillCache, file hashing
  search.ts       — hybrid FTS + vector search (lazy sqlite3)
  indexer.ts      — source indexing (files→chunks→SQLite)
  indexes.ts      — domain grouping + index generation
  domains.ts      — DOMAIN_TRIGGERS (28 domains), inferDomainLabel()
  pkg-utils.ts    — package.json, monorepo walking
  schemas.ts      — zod schemas
  classifier/     — npm.ts, github.ts, crates.ts, pypi.ts (all: discoverXPackages(query?, limit?))
  pipeline/       — intent.ts, entity-extractor.ts, prompt-parser.ts, capability-map.ts, workflow-gen.ts
  hooks/          — types.ts, generator.ts, validator.ts, templates/ (30+ domain configs)
  plugin/         — builder.ts, publisher.ts, ai-generator.ts, marketplace.ts, commands-generator.ts, settings-generator.ts, team-generator.ts, runtime-adapters.ts, audit-report.ts, versioning.ts, shared.ts
  db/             — domain-db.ts, aggregated-db.ts, sqlite.ts
examples/
  skill-forge.ts  — thin dispatcher → forge/ modules
  forge/          — types, helpers, parse-args, stages, 15 mode-* modules
  regenerate-skills.ts — batch regeneration
  generated-skills/    — auto-generated skills (trigger ≥ 0.80)
tests/            — 18 test files, 347 tests
```

## Pipeline Flow

1. **Resolve** — detect format, fetch metadata. GitHub: releases→tags→`readSourceVersion()`. Local: package.json→basename
2. **Install** — download tarball (branch fallback), extract, install deps. `HUGE_REPOS` skipped
3. **Analyze** — `--help` parsing, recursive mode. `deepProbe(bin, {maxDepth})` → `{tree, totalCommands}`
4. **Store** — persist JSON + CONTEXT.md
5. **Generate** — `generateSkillDirectory()` → SKILL.md + refs/ + scripts/. Uses `_curatedMeta` for triggers, `_readmeSections` for content. `detectToolLanguage()` for ecosystem. `inferBinName()` for binary names. `extractCommandsFromReadme()` fallback when 0 commands
6. **Quality** — `testSkillSync()`: trigger ≥ 0.80, quality ≥ 6, content ≥ 5
7. **Index** — `groupByDomain()` + `generateMasterIndex()`
8. **Factory** — `runSkillFactory()` optional 3-layer
9. **MCP** — `McpBridge` exposes tools

## Skill Quality

`scoreTrigger()` (max 1.0, clamped): +0.3 "Use when", +0.4 action verbs (3×0.15 from 60+ verbs), +0.2 "Do NOT use for", +0.1 comma triggers (≥2 clauses), +0.1 TechNames (≥2 capitalized words). `buildDescription()` auto-generates all via `CATEGORY_ACTION_MAP` (% templates) + `DOMAIN_NEGATIVE_TRIGGERS` + `detectToolLanguage()`.

## Plugin System (Claude Code spec)

**Structure** — `.claude-plugin/plugin.json` (official fields: name, version, description, keywords, license), `skills/<name>/SKILL.md+refs+scripts`, `agents/<name>.md` (YAML frontmatter+prompt), `commands/<name>.md`

**Basic** (`--plugin`): 2 commands, 1 agent. **Full** (`--plugin --full`): 8 commands, multi-agents, hooks (7 event types), settings.json, CLAUDE.md, team skills. `--multi-runtime` adds pi-mono + opencode adapters.

**Rules** — no non-standard plugin.json fields, skills self-contained, domains flattened (`ai-ml/x`→`ai-ml-x`), no external path refs, `$ARGUMENTS` for user input in commands.

**Key functions**: `buildPlugins(opts)`, `generateHooksJson(domain, entries)`, `generatePluginCommands(domain, entries)` (8 cmds), `defaultMultiAgentMarkdown(domain, pkgs)`, `auditPlugin(dir)`, `generateMarketplace(opts)`, `publishPlugin(domain, dryRun)`, `generateTeamSkill(domain, agents)`, `generateRuntimeAdapters(domain, entries, name)`, `computePluginHash(dir)`, `bumpVersion(current, type)`

## Key Functions

```typescript
// Output
success<T>(cmd, data, startTime): CliOutput<T>
failure(cmd, code, msg, startTime): CliOutput<never>
emit<T>(result, json): void
toErrorMessage(err: unknown): string

// Guards
validateSource(source): void
validateToolName(name): void
rejectPathTraversal(path, label): void

// Analysis
deepProbe(bin, {maxDepth}): {tree, totalCommands}
detectInteractionMode(cmds, flags, help?): "repl"|"subcommand"|"single"
smokeTest(tool, installDir, cachedBin?): SmokeTestResult

// Skills
parseFrontmatter(content): SkillFrontmatter | null
generateRichSkillMd(tool): string
generateSkillDirectory(tool): {skillMd, files}
shellQuote(s): string
writeLockfile(path, tools): void

// Quality
testSkillSync(path, preloaded?): SkillTestResult
testAllSkillsSync(dir, domainFilter?): SkillTestResult[]
scoreTrigger(description): number
scoreContentQuality(skillMd): {score, issues}

// Classifiers (all same signature)
discoverNpmPackages(query?, limit?): Promise<ExtendedManifestEntry[]>
discoverGitHubRepos / discoverCratesPackages / discoverPyPIPackages

// Extractor
extractReadmeSections(readme, maxChars?): ReadmeSections
inferBinaryNames(repoDir): string[]
readSourceVersion(repoDir): string | undefined
extractCommandsFromReadme(readme, toolName): Array<{name, description}>

// Curated
loadAllTools(projectRoot): CliTool[]
GENERAL_TOOLS: CliTool[]

// Indexes
groupByDomain(entries): Map<string, ManifestEntry[]>
generateMasterIndex(manifest, triggers): string
```

## Data Directory

```
~/.agents-cli/tools.json — metadata store
~/.agents-cli/tools/<id>/package/ — installed files
~/.agents-cli/tools/<id>/CONTEXT.md — auto-docs
~/.agents-cli/skills/<name>/skill.json + CONTEXT.md
```

## Do NOT

- Add heavy deps or `yaml`/`js-yaml` (custom frontmatter parser exists)
- Skip build, remove security guards, use `process.exit()`, add interactive prompts
- Bypass `CliOutput<T>`, hardcode `dryRun: false`, bare `console.error` with `--json`
- Add HTTP helpers without SSRF checks, use `require()`, use magic numbers
- Match frontmatter with full-content regex, fabricate CLI subcommands
- Use same trigger text for different categories, suggest wrong package managers
- Write files outside output dir, interpolate unsanitized input into shell
