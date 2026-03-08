# agents-cli — Project Instructions

## What this is

agents-cli is a package manager for AI agent tools. It resolves, installs, analyzes, and exposes CLI tools from GitHub repos, npm packages, or local paths. Tools are stored in `~/.agents-cli/` and can be invoked directly or exposed via MCP.

Built on the "Rewrite Your CLI for AI Agents" philosophy — every command outputs structured JSON, supports schema introspection, respects context window limits, and hardens inputs against agent hallucinations.

## Strict guidelines

- **Always build before running**: `npm run build` (tsup). Entry points are in `dist/`.
- **Never modify `dist/`** — edit source in `lib/` and `bin/`, then rebuild.
- **Source is ESM** — all imports must use `.js` extensions (`import { foo } from "./bar.js"`).
- **No default exports** — use named exports only.
- **Types in `lib/types.ts`** — all shared interfaces and types live there. Don't scatter type definitions.
- **Security**: The codebase has SSRF protection, path traversal guards, size limits, and input validation. Do NOT bypass these. Do NOT remove `assertWithinDir`, `isPrivateUrl`, `validateToolId`, guard functions, or size checks.
- **No interactive prompts** — the CLI must work non-interactively (CI/agent-friendly).
- **Tests**: Run `npm test` (vitest). Tests are in `tests/`. Write tests for new functionality.
- **Atomic writes**: Store uses temp-file + rename for crash safety. Maintain this pattern.
- **Structured output everywhere**: Every command must support `--json` flag and `OUTPUT_FORMAT=json` env var via the `CliOutput<T>` envelope from `lib/output.ts`.
- **Dry-run on mutating commands**: All commands that modify state must support `--dry-run`.
- **Input hardening**: All user/agent inputs must pass through guards in `lib/guards.ts` before use.

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
agents-cli add @scope/pkg              # from npm
agents-cli add pypi:ruff               # from PyPI
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

### Trending pipeline

```bash
npx tsx examples/trending-pipeline.ts --limit 25
npx tsx examples/trending-pipeline.ts --language rust --since weekly
npx tsx examples/trending-pipeline.ts --dry-run
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
  agents-cli.ts    — main CLI entry point (commander), all 14+ commands
  agent-run.ts     — tool execution engine
lib/
  types.ts         — all shared types (CliOutput, ToolSubcommand, ToolSchema, etc.)
  index.ts         — public SDK entry point (re-exports)
  output.ts        — structured output layer (success/failure/emit)
  guards.ts        — input hardening against agent hallucinations
  resolver.ts      — source format detection + metadata fetching
  installer.ts     — download, extract, build, install deps
  analyzer.ts      — deep recursive --help probing, command/flag parsing
  store.ts         — flat-file JSON tool store + CONTEXT.md generation
  registry.ts      — 4-layer registry cascade (local, community, github, npm)
  skills.ts        — SKILL.md parsing, skill install/remove, lockfile, rich generation
  mcp.ts           — MCP bridge for exposing tools to AI agents
  pkg-utils.ts     — package.json reading, monorepo walking
  schemas.ts       — zod schemas
examples/
  github-cli/      — example SKILL.md for gh CLI
  trending-pipeline.ts — batch pipeline: GitHub trending -> skills
  generated-skills/ — 23 auto-generated SKILL.md files (ripgrep, fd, jq, fzf, uv, ruff, bat, eza, etc.)
tests/
  skills.test.ts   — test suite
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

## Pipeline flow

1. `createResolver()` — detects format (github/npm/local), fetches metadata from API
2. `createInstaller()` — downloads tarball, extracts, runs `npm install`, auto-builds
3. `createAnalyzer()` — runs `--help`/`-h`/`help`, parses commands and flags (recursive mode available)
4. `deepProbe()` — recursively probes subcommand trees up to depth 3, max 500 commands
5. `createStore()` — persists tool JSON + generates CONTEXT.md
6. `generateRichSkillMd()` / `installSkill()` — bundles tools into rich SKILL.md with lockfiles
7. `McpBridge` — exposes installed tools as MCP server

## Do NOT

- Add heavy dependencies — the CLI should stay lean
- Use `yaml` or `js-yaml` — we have a custom frontmatter parser
- Skip the build step — TypeScript source is not directly runnable via node (only via tsx)
- Remove security guards (SSRF, path traversal, size limits, input validation)
- Use `process.exit()` — set `process.exitCode` instead
- Add interactive prompts or TTY-dependent features
- Bypass the `CliOutput<T>` envelope — all commands must use `success()`/`failure()`/`emit()`
- Remove input hardening guards from `lib/guards.ts`
