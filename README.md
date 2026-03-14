# agents-cli

A package manager for AI agent tools — like npm but for CLI tools that agents use.

Any GitHub repo, npm package, PyPI package, or crates.io crate with a CLI becomes a managed, analyzable, MCP-exposable tool in one command. Built-in skill forge generates production-ready Claude Code plugins with hooks, multi-agents, and domain-specific workflows.

Built on the ["Rewrite Your CLI for AI Agents"](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/) philosophy — structured JSON output, schema introspection, context window discipline, input hardening, dry-run safety, and rich skill generation.

> For contributor guidelines and strict implementation rules, see **[CLAUDE.md](./CLAUDE.md)**.

## What it does

```
You (or an agent) finds a useful CLI on GitHub/npm/PyPI/crates.io
        |
        v
  agents-cli add owner/repo           # or pypi:ruff, npm:prettier, crates:ripgrep
        |
        |-- resolves source (GitHub API / npm / PyPI / crates.io)
        |-- downloads & extracts
        |-- installs deps, auto-builds (monorepo-aware)
        |-- probes --help → extracts commands & flags recursively
        '-- stores metadata in ~/.agents-cli/
        |
        v
  skill-forge --tool pypi:ruff         ← forge rich SKILL.md
  skill-forge --plugin --full           ← build Claude Code plugins
  skill-forge --marketplace             ← build plugin marketplace
  agents-cli mcp start                  ← expose to AI agents via MCP
```

## Install

```bash
npm install -g agents-cli
# or run directly without installing
npx agents-cli
```

## Quick start

```bash
# Install tools from any registry
agents-cli add astral-sh/ruff          # GitHub
agents-cli add pypi:pytest             # PyPI
agents-cli add npm:prettier            # npm
agents-cli add crates:ripgrep          # crates.io

# Introspect command trees (machine-readable)
agents-cli schema ruff --json

# Run tools
agents-cli run ruff -- check .

# Expose all tools to AI agents via MCP
agents-cli mcp start
```

## Source format prefixes

| Prefix | Example | Registry |
|--------|---------|----------|
| (none) | `owner/repo` | GitHub |
| `@scope/` | `@anthropic-ai/sdk` | npm (scoped) |
| `npm:` | `npm:express` | npm (bare) |
| `pypi:` | `pypi:ruff` | PyPI |
| `crates:` | `crates:ripgrep` | crates.io |
| `./` or `/` | `./local-path` | local directory |

Bare names without `/` or prefix (e.g. `httpie`) fall back to `pypi:`.

## Commands reference

All commands support `--json` for structured output and `--dry-run` for mutating operations.

### Discover & install tools

```bash
agents-cli add owner/repo              # GitHub (owner/repo)
agents-cli add @scope/pkg              # npm scoped
agents-cli add npm:express             # npm bare name
agents-cli add pypi:ruff               # PyPI
agents-cli add crates:ripgrep          # crates.io
agents-cli add ./local-path            # local directory
agents-cli add owner/repo --deep       # deep-probe subcommands (depth 3)
agents-cli add owner/repo --skill      # auto-generate SKILL.md on install
agents-cli add owner/repo --dry-run    # preview without installing
```

### Manage tools

```bash
agents-cli list                        # list all installed tools
agents-cli list --json --fields name,version
agents-cli describe <tool>             # detailed info + command tree
agents-cli describe <tool> --fields commands,globalFlags
agents-cli run <tool> -- <args>        # execute tool
agents-cli update <tool>               # update to latest
agents-cli remove <tool>
```

### Schema introspection

```bash
agents-cli schema <tool>               # command tree (default depth 3)
agents-cli schema <tool> --depth 5     # deeper probing
agents-cli schema <tool> --refresh     # re-probe, ignore cache
agents-cli schema <tool> --json        # machine-readable output
```

### Skills

```bash
agents-cli init --name "my-skill"               # scaffold new skill
agents-cli skills generate --from-tool <name>   # generate SKILL.md from installed tool
agents-cli skills install SKILL.md              # install a skill from file
agents-cli skills list                          # list installed skills
agents-cli skills remove <name>                 # uninstall a skill
```

### Lockfile

```bash
agents-cli freeze     # generate agentcli.lock from installed tools
agents-cli install    # install all tools from lockfile
agents-cli verify     # verify lockfile integrity matches installed tools
```

### MCP bridge

```bash
agents-cli mcp start  # start MCP server, expose all tools to agents
agents-cli mcp list   # list tools available via MCP
```

### Plugin management (Claude Code spec)

```bash
agents-cli plugin init                 # scaffold a new plugin
agents-cli plugin publish <name>       # publish plugin to registry
agents-cli plugin test [dir]           # audit plugin compliance
agents-cli plugin group                # group skills into plugin domains
agents-cli plugin factory              # run skill factory pipeline
agents-cli plugin pipeline <prompt>    # NL → workflow generation
agents-cli plugin index <source>       # index a source into SQLite
```

### Registry

```bash
agents-cli search "query"              # search all registries
agents-cli scan ./dir [--deep]         # discover tools in a local directory
agents-cli info <name>                 # show registry info for a package
```

## Skill Forge — generate skills from any CLI tool

The skill forge resolves, installs, analyzes, and generates rich SKILL.md files from any package registry.

```bash
# Single tool — any registry
npx tsx examples/skill-forge.ts --tool astral-sh/ruff    # GitHub
npx tsx examples/skill-forge.ts --tool pypi:pytest       # PyPI
npx tsx examples/skill-forge.ts --tool npm:prettier      # npm
npx tsx examples/skill-forge.ts --tool crates:ripgrep    # crates.io
npx tsx examples/skill-forge.ts --tool @anthropic-ai/sdk # npm scoped

# Natural language discovery
npx tsx examples/skill-forge.ts "build a RAG pipeline with vector search"
npx tsx examples/skill-forge.ts "python linting tools" --limit 5
npx tsx examples/skill-forge.ts "kubernetes deployment tools"

# Trending from GitHub
npx tsx examples/skill-forge.ts --trending
npx tsx examples/skill-forge.ts --trending --language rust --since weekly --limit 10
npx tsx examples/skill-forge.ts --trending --language python --since daily

# Curated registry (91 general + 502 AI/ML tools from examples/data/ai-ml-tools.json)
npx tsx examples/skill-forge.ts --curated --list-categories
npx tsx examples/skill-forge.ts --curated --category ai-ml/llm-inference
npx tsx examples/skill-forge.ts --curated --category security --limit 10
npx tsx examples/skill-forge.ts --curated --force --limit 600

# Workflow generation — analyze agent scripts → workflow SKILL.md
npx tsx examples/skill-forge.ts --workflow-gen ./my-agents
npx tsx examples/skill-forge.ts --workflow-gen ./agents --domain ai-ml --out ./output
npx tsx examples/skill-forge.ts --workflow-gen ./scripts --dry-run --json

# System PATH discovery
npx tsx examples/skill-forge.ts --system --dry-run     # preview local executables
npx tsx examples/skill-forge.ts --system --limit 20    # forge top 20
```

### Common forge flags

```bash
--deep           # deep-probe subcommands (depth 3)
--json           # structured JSON output
--factory        # run 3-layer skill factory (structural → AI)
--force          # regenerate even if skill already exists
--no-cache       # skip skill cache
--limit N        # max tools to process
--batch-size N   # concurrent batch size
--concurrency N  # parallel workers
--timeout <ms>   # per-tool timeout
--resume <path>  # resume interrupted batch
--output-dir     # custom output directory
--dry-run        # preview without writing files
--no-index       # skip domain index generation
--domain X       # filter by domain label
--ai             # include AI-enhanced generation
--strict         # strict quality gate (trigger ≥ 0.90)
```

## Workflow generation — turn agent scripts into managed workflows

Point `--workflow-gen` at a directory of agent scripts (.py/.ts/.js/.sh) and the forge will analyze them, infer execution order, data flow, and environment requirements, then generate a complete workflow package with quality gates.

```bash
# Basic — analyze scripts and generate workflow
npx tsx examples/skill-forge.ts --workflow-gen ./my-agents

# With domain and custom output
npx tsx examples/skill-forge.ts --workflow-gen ./agents --domain ai-ml --out ./workflows

# Preview without writing
npx tsx examples/skill-forge.ts --workflow-gen ./scripts --dry-run --json
```

### What it does

1. **Analyze** — regex/heuristic parser extracts imports, env vars, file I/O, SDK calls (50+ known SDKs), entry points, and cross-script dependencies from each script
2. **Infer** — topological sort from cross-script imports + file I/O chains determines step ordering; data flow edges, env var requirements, and duration estimates are computed
3. **Generate** — produces SKILL.md (with frontmatter + workflow description), run.sh (orchestrator), setup.sh (env var + tool validation), workflow.md (pipeline diagram + step table), and copies agent scripts
4. **Quality gate** — 4-axis scoring (each must be >= 0.5): step completeness, data flow validity, env var documentation, setup runnability

### Output structure

```
examples/generated-workflows/<name>/
  SKILL.md              — frontmatter + workflow description
  scripts/run.sh        — orchestrator script
  scripts/setup.sh      — env var + tool validation
  references/workflow.md — pipeline diagram + step table
  agents/*.py           — copied agent scripts
```

### SaaS UI workflow features

- **Workflows tab** in marketplace (2nd position after All, with NEW badge)
- **Mini pipeline preview** on workflow cards showing step flow (scout -> ghostwriter -> image-gen -> ...)
- **Step count + duration estimate** on cards
- **Pipeline tab** in detail modal with DAG visualization, step table, and env vars table
- **Tier gating** — workflows require at least Starter tier (free = view-only, starter = 5/month, pro/enterprise = unlimited + publish)

## Plugin system — Claude Code spec-compliant

Build self-contained plugins with hooks, multi-agents, 8 slash commands, team workflows, and multi-runtime adapters.

```bash
# Basic mode (2 commands, 1 agent per plugin)
npx tsx examples/skill-forge.ts --plugin

# Full mode (hooks, multi-agents, 8 commands, settings, CLAUDE.md, teams)
npx tsx examples/skill-forge.ts --plugin --full

# Full mode with multi-runtime adapters (pi-mono + opencode)
npx tsx examples/skill-forge.ts --plugin --full --multi-runtime

# Single domain
npx tsx examples/skill-forge.ts --plugin --full --domain python

# Build marketplace
npx tsx examples/skill-forge.ts --marketplace

# Test locally in Claude Code
claude --plugin-dir ./examples/plugins/python
```

### Plugin structure

```
.claude-plugin/
  plugin.json             — official fields only: name, version, description, keywords, license
  skills/<name>/
    SKILL.md              — trigger-aware description + 4-section progressive content
    references/           — api.md, patterns.md, search.md
    scripts/              — install.sh, validate.sh
  agents/<name>.md        — YAML frontmatter + system prompt
  commands/<name>.md      — slash command definitions ($ARGUMENTS for user input)
  hooks.json              — 7 event-type hooks
  settings.json           — default agent assignment
  CLAUDE.md               — CLI-first doctrine, domain conventions, hook docs
```

### What full mode generates per plugin

| Component | Count | Description |
|-----------|-------|-------------|
| Hooks | 7 event types | PreToolUse (safety), PostToolUse (lint), Stop (quality gate), SessionStart (context), SubagentStart/Stop (audit), Notification |
| Agents | 2–5 | Expert (sonnet, user memory) + domain workers (haiku, maxTurns:3) |
| Commands | 8 | search, list, setup, status, audit, run, team, update |
| Settings | 1 | Default agent assignment |
| CLAUDE.md | 1 | CLI-first doctrine, domain conventions, hook docs |
| Team skill | 1 | Agent team orchestration (context: fork) |

### Domain hook templates

| Domain | PreToolUse blocks | Stop gates |
|--------|-------------------|------------|
| database | DROP/TRUNCATE/DELETE without WHERE | migrations check |
| security | private IP curl, metadata endpoints, eval() | vulnerability scan |
| python | — | ruff check, pytest, mypy |
| javascript | — | eslint, tsc type check |
| devops | mass kubectl/terraform delete | health check |
| git | force-push, hard reset, clean -fd | — |
| cloud | S3 force-remove, bulk EC2 termination | deployment verify |
| testing | — | all tests pass, .only()/.skip() detection |

## Quality & compliance

```bash
# Skill quality audit
npx tsx examples/skill-forge.ts --audit --strict

# Plugin compliance audit (HTML/JSON report)
npx tsx examples/skill-forge.ts --audit-plugins --json

# Full benchmark (skills + plugins + coverage metrics)
npx tsx examples/skill-forge.ts --benchmark --json

# Battle test (41 automated checks)
bash battle-test-ecosystem.sh
bash battle-test-ecosystem.sh --quick
```

### Current metrics

| Metric | Value |
|--------|-------|
| Unit tests | 369 (19 files) |
| Skills generated | 393 |
| Trigger score | 1.000 avg (100% at 1.0) |
| Quality score | 9.0/10 avg |
| Domain plugins | 52 |
| Plugin compliance | 100% |
| Marketplace skills | 378 |

## Agent-first design

Every command supports `--json` for structured output (or set `OUTPUT_FORMAT=json`):

```bash
agents-cli list --json
# {"ok":true,"command":"list","data":[...],"meta":{"version":"0.1.0","duration":12,"timestamp":"..."}}
```

Context window discipline with `--fields`:

```bash
agents-cli list --json --fields name,version
```

Dry-run on all mutating commands:

```bash
agents-cli add owner/repo --dry-run --json
npx tsx examples/skill-forge.ts --plugin --full --dry-run
```

Schema introspection — machine-readable command trees:

```bash
agents-cli schema ruff --json --depth 3
```

## SaaS UI & Companion Server

The SaaS marketplace UI lives at `examples/saas-ui/`. Serve it with the companion server:

```bash
# Start companion server (UI at http://localhost:3100)
agents-cli mcp start
```

The UI includes:

- **Marketplace** — product grid with Agent-Native filter, Workflows tab (NEW badge), bulk select, `▶ Try` button (pre-fills Forge)
- **Skill Forge** — cost estimator, quality preview bar, AI persona selector, generation history, batch CSV upload
- **Dashboard** — usage meter, revenue tracker with split bar, agent wallet with 24h heatmap
- **Agent Economy** — creator earnings, per-skill revenue with SVG sparklines, agent leaderboard
- **API Keys** — create/revoke scoped keys (one-time secret reveal)
- **Product Detail** — 3-tab view (Overview / Pricing / Changelog), live SSE invocation feed, MCP deploy button

### Companion API

All endpoints require `Authorization: Bearer <token>`.

```
GET  /api/earnings?period=month        — creator revenue summary
GET  /api/agents/:id/metrics           — call/cost/latency stats
GET  /api/agents/:id/heatmap           — 24h invocation heatmap
POST /api/agent-keys                   — create scoped API key
DELETE /api/agent-keys/:id             — revoke key
GET  /api/invocations/stream?skill=X   — SSE live invocation feed
GET  /api/catalog / /api/usage / /api/health
POST /api/generate | GET /api/status/:id | GET /api/download/:id
POST /api/billing/checkout | GET /api/billing/portal
```

## Full pipeline example

```bash
# 1. Build the project
npm run build

# 2. Forge skills from curated tools
npx tsx examples/skill-forge.ts --curated --category code-search --limit 5

# 3. Generate workflows from agent scripts
npx tsx examples/skill-forge.ts --workflow-gen ./my-agents --domain ai-ml

# 4. Build full-featured plugins
npx tsx examples/skill-forge.ts --plugin --full

# 5. Build marketplace
npx tsx examples/skill-forge.ts --marketplace

# 6. Validate everything
npx tsx examples/skill-forge.ts --benchmark --json
bash battle-test-ecosystem.sh --quick

# 7. Test a plugin in Claude Code
claude --plugin-dir ./examples/plugins/python

# 8. Serve the SaaS UI
agents-cli mcp start   # → open http://localhost:3100
```

## Architecture

```
bin/
  agents-cli.ts         — 67-line dispatcher (thin shell)
  commands/             — 22 registerXCommand files
lib/
  skills/               — 5 focused modules (frontmatter / lockfile / description / lifecycle / generators)
  guards.ts             — security guards + shellQuote (canonical location)
  companion/            — SaaS HTTP server, billing, OAuth, metering
examples/
  forge/                — 16 mode modules (incl. mode-workflow-gen.ts)
  saas-ui/              — SaaS marketplace UI
  data/ai-ml-tools.json — 502 curated AI/ML tool definitions
```

### Pipeline steps

1. **Resolve** — detect source format, fetch metadata from appropriate registry
2. **Install** — download, extract, install deps, auto-build (monorepo-aware, branch fallback)
3. **Analyze** — probe `--help` recursively (depth 3, up to 500 commands)
4. **Store** — persist metadata in `~/.agents-cli/` (JSON + CONTEXT.md)
5. **Generate** — produce SKILL.md with trigger-aware descriptions and domain content
6. **Quality** — gate on trigger score ≥ 0.80, quality ≥ 6/10, content ≥ 5
7. **Plugin** — build Claude Code plugins (hooks, agents, commands, settings)
8. **Marketplace** — generate marketplace.json + plugin distribution
9. **Expose** — MCP bridge + SaaS API
10. **Workflow Gen** — analyze agent scripts → infer manifest (topo sort + data flow) → generate workflow SKILL.md + scripts

## Development

```bash
npm install
npm run build        # build with tsup (always run before testing)
npm run dev          # watch mode (rebuilds on change)
npm test             # vitest — 369 tests, 19 files
npm run lint         # tsc --noEmit type check
```

See **[CLAUDE.md](./CLAUDE.md)** for the complete contributor reference:
- Hard rules (ESM, security, output format, dry-run, no process.exit, etc.)
- Full project structure with all file paths and module responsibilities
- Key function signatures and their module locations
- Common pitfalls and the Do-NOT list

## License

MIT
