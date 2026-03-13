# agents-cli

A package manager for AI agent tools — like npm but for CLI tools that agents use.

Any GitHub repo, npm package, PyPI package, or crates.io crate with a CLI becomes a managed, analyzable, MCP-exposable tool in one command. Built-in skill forge generates production-ready Claude Code plugins with hooks, multi-agents, and domain-specific workflows.

Built on the ["Rewrite Your CLI for AI Agents"](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/) philosophy — structured JSON output, schema introspection, context window discipline, input hardening, dry-run safety, and rich skill generation.

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
        |-- probes --help -> extracts commands & flags recursively
        '-- stores metadata in ~/.agents-cli/
        |
        v
  skill-forge --tool pypi:ruff         <- forge rich SKILL.md
  skill-forge --plugin --full           <- build Claude Code plugins
  skill-forge --marketplace             <- build plugin marketplace
  agents-cli mcp start                  <- expose to AI agents
```

## Install

```bash
npm install -g agents-cli
# or use directly
npx agents-cli
```

## Quick start

```bash
# Install tools from any registry
agents-cli add astral-sh/ruff          # GitHub
agents-cli add pypi:pytest             # PyPI
agents-cli add npm:prettier            # npm
agents-cli add crates:ripgrep          # crates.io

# Introspect command trees
agents-cli schema ruff --json

# Run tools
agents-cli run ruff -- check .

# Expose all tools to AI agents via MCP
agents-cli mcp start
```

## Skill Forge — generate skills from any CLI tool

The skill forge resolves, installs, analyzes, and generates rich SKILL.md files from any package registry.

### From any registry

```bash
# GitHub repos
npx tsx examples/skill-forge.ts --tool charmbracelet/glow
npx tsx examples/skill-forge.ts --tool junegunn/fzf
npx tsx examples/skill-forge.ts --tool jesseduffield/lazygit

# PyPI packages
npx tsx examples/skill-forge.ts --tool pypi:ruff
npx tsx examples/skill-forge.ts --tool pypi:pytest
npx tsx examples/skill-forge.ts --tool pypi:httpie
npx tsx examples/skill-forge.ts --tool pypi:uv
npx tsx examples/skill-forge.ts --tool pypi:ansible
npx tsx examples/skill-forge.ts --tool pypi:litellm

# npm packages
npx tsx examples/skill-forge.ts --tool npm:prettier
npx tsx examples/skill-forge.ts --tool npm:eslint
npx tsx examples/skill-forge.ts --tool @anthropic-ai/sdk

# crates.io packages
npx tsx examples/skill-forge.ts --tool crates:ripgrep
npx tsx examples/skill-forge.ts --tool crates:fd-find
npx tsx examples/skill-forge.ts --tool crates:bat
npx tsx examples/skill-forge.ts --tool crates:eza
npx tsx examples/skill-forge.ts --tool crates:tokei
npx tsx examples/skill-forge.ts --tool crates:hyperfine
```

### Natural language discovery

```bash
npx tsx examples/skill-forge.ts "build a RAG pipeline with vector search"
npx tsx examples/skill-forge.ts "python linting" --limit 5
npx tsx examples/skill-forge.ts "kubernetes deployment tools"
npx tsx examples/skill-forge.ts "database migration tools"
```

### Trending & curated tools

```bash
# Scrape GitHub trending → filter CLIs → forge skills
npx tsx examples/skill-forge.ts --trending
npx tsx examples/skill-forge.ts --trending --language rust --since weekly --limit 10
npx tsx examples/skill-forge.ts --trending --language python --since daily

# Curated registry (91 general + 502 AI/ML tools)
npx tsx examples/skill-forge.ts --curated --list-categories
npx tsx examples/skill-forge.ts --curated --category ai-ml/llm-inference
npx tsx examples/skill-forge.ts --curated --category security --limit 10
npx tsx examples/skill-forge.ts --curated --force --limit 600  # full run
```

### System PATH discovery

```bash
npx tsx examples/skill-forge.ts --system --dry-run     # preview local executables
npx tsx examples/skill-forge.ts --system --limit 20    # forge top 20
npx tsx examples/skill-forge.ts --system --limit 50 --deep
```

## Plugin system — Claude Code spec-compliant

Build self-contained plugins with hooks, multi-agents, 8 slash commands, team workflows, and multi-runtime adapters.

### Build plugins

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

### What full mode generates per plugin

| Component | Count | Description |
|-----------|-------|-------------|
| Hooks | 7 event types | PreToolUse (safety), PostToolUse (lint), Stop (quality gate), SessionStart (context), SubagentStart/Stop (audit), Notification |
| Agents | 2-5 | Expert (sonnet, user memory) + domain workers (haiku, maxTurns:3) |
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
```

### Current metrics

| Metric | Value |
|--------|-------|
| Skills generated | 396 |
| Trigger score | 1.000 avg (100% at 1.0) |
| Quality score | 9.0/10 avg |
| Plugins | 15 domains |
| Hook coverage | 97% |
| Plugin compliance | 100% |
| Unit tests | 347 |

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

## Commands reference

### Discover & install tools

```bash
agents-cli add owner/repo              # GitHub (owner/repo)
agents-cli add @scope/pkg              # npm (scoped)
agents-cli add npm:express             # npm (bare name)
agents-cli add pypi:ruff               # PyPI
agents-cli add crates:ripgrep          # crates.io
agents-cli add ./local-path            # local directory
agents-cli add owner/repo --deep       # deep-probe subcommands
agents-cli add owner/repo --skill      # auto-generate SKILL.md
agents-cli add owner/repo --dry-run    # preview
```

### Manage tools

```bash
agents-cli list                        # list all installed
agents-cli list --json --fields name,version
agents-cli describe <tool>             # detailed info
agents-cli run <tool> -- <args>        # execute
agents-cli update <tool>
agents-cli remove <tool>
```

### Schema introspection

```bash
agents-cli schema <tool>               # command tree (depth 3)
agents-cli schema <tool> --depth 5     # deeper probing
agents-cli schema <tool> --refresh     # ignore cache
```

### Skills

```bash
agents-cli init --name "my-skill"
agents-cli skills generate --from-tool <name>
agents-cli skills install SKILL.md
agents-cli skills list
agents-cli skills remove <name>
```

### Lockfile

```bash
agents-cli freeze     # generate agentcli.lock
agents-cli install    # install from lockfile
agents-cli verify     # check lockfile matches
```

### MCP bridge

```bash
agents-cli mcp start  # expose tools as MCP server
agents-cli mcp list   # list MCP-available tools
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

Bare names without `/` or prefix (e.g. `httpie`) fall back to `pypi:` then error.

## Full pipeline example

```bash
# 1. Build the project
npm run build

# 2. Forge skills from curated tools (or use existing)
npx tsx examples/skill-forge.ts --curated --category code-search --limit 5
# or regenerate from stored metadata:
npx tsx examples/regenerate-skills.ts

# 3. Build full-featured plugins
npx tsx examples/skill-forge.ts --plugin --full

# 4. Build marketplace
npx tsx examples/skill-forge.ts --marketplace

# 5. Validate everything
npx tsx examples/skill-forge.ts --benchmark --json
bash battle-test-ecosystem.sh --quick

# 6. Test a plugin in Claude Code
claude --plugin-dir ./examples/plugins/python
```

## Architecture

1. **Resolve** — detect source format (GitHub/npm/PyPI/crates.io/local), fetch metadata
2. **Install** — download, extract, install deps, auto-build (monorepo-aware)
3. **Analyze** — probe `--help` recursively, extract commands & flags (up to 500 commands, depth 3)
4. **Store** — persist metadata in `~/.agents-cli/` with JSON store + CONTEXT.md
5. **Generate** — produce rich SKILL.md with trigger-aware descriptions, domain-specific content
6. **Quality** — trigger scoring (≥ 0.80), structural quality (≥ 6/10), content scoring
7. **Plugin** — build Claude Code plugins (hooks, agents, commands, settings, CLAUDE.md)
8. **Marketplace** — generate marketplace.json + plugin distribution
9. **Expose** — MCP bridge, headless scripts, SDK examples

## Development

```bash
npm install
npm run build        # build with tsup
npm run dev          # watch mode
npm test             # run tests (vitest, 347 tests)
npm run lint         # type check (tsc --noEmit)
```

## License

MIT
