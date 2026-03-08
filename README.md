# agents-cli

A package manager for AI agent tools — like npm but for CLI tools that agents use.

Any GitHub repo or npm package with a CLI becomes a managed, analyzable, MCP-exposable tool in one command.

Built on the ["Rewrite Your CLI for AI Agents"](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/) philosophy — structured JSON output, schema introspection, context window discipline, input hardening, dry-run safety, and rich skill generation.

## What it does

```
You (or an agent) finds a useful CLI on GitHub/npm
        |
        v
  agents-cli add owner/repo
        |
        |-- resolves source (GitHub API / npm registry)
        |-- downloads & extracts
        |-- installs deps, auto-builds (monorepo-aware)
        |-- probes --help -> extracts commands & flags recursively
        '-- stores metadata in ~/.agents-cli/
        |
        v
  agents-cli run <tool> -- <args>    <- you run it
  agents-cli schema <tool> --json    <- introspect command tree
  agents-cli mcp start               <- expose to AI agents
  agents-cli freeze                   <- lock for reproducibility
```

## Install

```bash
npm install -g agents-cli
# or use directly
npx agents-cli
```

## Quick start

```bash
# Install a tool from GitHub
agents-cli add astral-sh/ruff

# Introspect its command tree
agents-cli schema ruff --json

# See what was discovered
agents-cli describe ruff

# Run it
agents-cli run ruff -- check .

# Expose all tools to AI agents via MCP
agents-cli mcp start
```

## Agent-first design

Every command supports `--json` for structured output (or set `OUTPUT_FORMAT=json`):

```bash
agents-cli list --json
# {"ok":true,"command":"list","data":[...],"meta":{"version":"0.1.0","duration":12,"timestamp":"..."}}
```

Context window discipline with `--fields`:

```bash
agents-cli list --json --fields name,version
# Returns only the fields you need — saves tokens
```

Dry-run on all mutating commands:

```bash
agents-cli add owner/repo --dry-run --json
# Shows what would be installed without doing it
```

Schema introspection — get a machine-readable command tree:

```bash
agents-cli schema ruff --json --depth 3
# Returns full command tree with flags, subcommands, examples
```

Input hardening — rejects control characters, path traversals, embedded params, and percent-encoding from agent inputs.

## Commands

### Discover & install tools

```bash
agents-cli add ruvnet/ruflo            # from GitHub (owner/repo)
agents-cli add @ruvnet/agentic-flow    # from npm (@scope/pkg)
agents-cli add ./local-tool            # from local path
agents-cli add owner/repo --deep       # deep-probe subcommands recursively
agents-cli add owner/repo --skill      # auto-generate rich SKILL.md
agents-cli add owner/repo --dry-run    # preview without installing
```

### Manage installed tools

```bash
agents-cli list                        # list all installed
agents-cli list --json --fields name,version  # only specific fields
agents-cli describe ruflo              # detailed info + help output
agents-cli run ruflo -- status         # execute a tool
agents-cli run ruflo --dry-run -- args # preview execution
agents-cli update ruflo                # update to latest
agents-cli remove ruflo                # uninstall
```

### Schema introspection

```bash
agents-cli schema <tool>               # get command tree (default depth 3)
agents-cli schema <tool> --depth 5     # deeper probing
agents-cli schema <tool> --refresh     # re-probe, ignore cache
agents-cli schema <tool> --json        # structured JSON output
```

### Skills (bundles of tools)

```bash
agents-cli init                        # scaffold SKILL.md
agents-cli skills generate --from-tool ruff  # generate rich SKILL.md from installed tool
agents-cli skills install SKILL.md     # install a skill bundle
agents-cli skills list                 # list installed skills
agents-cli skills remove my-skill      # remove a skill
```

### Lockfile (reproducible installs)

```bash
agents-cli freeze                      # generate agentcli.lock
agents-cli install                     # install from lockfile
agents-cli verify                      # check lockfile matches
```

### Registry & discovery

```bash
agents-cli search "agent"              # search for tools
agents-cli scan ./some-dir             # scan a directory for CLIs
agents-cli scan ./dir --deep           # deep-probe discovered CLIs
agents-cli info <name>                 # show registry info
```

### MCP bridge

```bash
agents-cli mcp start                   # expose tools as MCP server
agents-cli mcp list                    # list MCP-available tools
```

## Real-world examples

```bash
# Install popular CLI tools from GitHub
agents-cli add charmbracelet/glow       # Markdown renderer
agents-cli add junegunn/fzf             # Fuzzy finder
agents-cli add jesseduffield/lazygit    # Git TUI
agents-cli add astral-sh/ruff           # Python linter
agents-cli add sharkdp/bat              # Better cat
agents-cli add BurntSushi/ripgrep       # Fast grep
agents-cli add sharkdp/fd              # Better find

# Install from npm
agents-cli add @anthropic-ai/sdk
agents-cli add prettier

# Deep-probe and auto-generate skill
agents-cli add astral-sh/uv --deep --skill --json

# Use them
agents-cli run glow -- README.md
agents-cli run ruff -- check .
agents-cli run prettier -- --check .

# Bundle tools into a "skill" for a project
agents-cli init --name "python-dev"
agents-cli skills install SKILL.md
agents-cli freeze
```

## Pipeline: GitHub Trending -> Skills

The included pipeline script scrapes GitHub trending repos, installs each one, analyzes CLI capabilities, and generates SKILL.md files automatically:

```bash
npx tsx examples/trending-pipeline.ts --limit 25
npx tsx examples/trending-pipeline.ts --language rust --since weekly
npx tsx examples/trending-pipeline.ts --dry-run  # preview only
```

Generated skills for 23 tools are in `examples/generated-skills/` including ripgrep, fd, jq, fzf, uv, ruff, bat, eza, delta, biome, glow, lazygit, zoxide, and more.

## Architecture

1. **Resolve** — detect source format (GitHub repo, npm package, local path) and fetch metadata
2. **Install** — download, extract, install deps, auto-build if needed (monorepo-aware)
3. **Analyze** — probe each tool's `--help` recursively to extract commands, flags, examples (up to 500 commands, depth 3)
4. **Store** — persist tool metadata in `~/.agents-cli/` with a JSON store + CONTEXT.md per tool
5. **Expose** — make tools available to AI agents via MCP bridge or direct execution
6. **Bundle** — group tools into rich "skills" (SKILL.md) with lockfiles for reproducibility

### Structured output envelope

Every command returns a `CliOutput<T>`:

```json
{
  "ok": true,
  "command": "list",
  "data": [...],
  "meta": {
    "version": "0.1.0",
    "duration": 12,
    "timestamp": "2026-03-08T..."
  }
}
```

On error:

```json
{
  "ok": false,
  "command": "add",
  "error": {
    "code": "RESOLVE_FAILED",
    "message": "Could not resolve source: foo/bar"
  },
  "meta": { ... }
}
```

## Development

```bash
npm install
npm run build        # build with tsup
npm run dev          # watch mode
npm test             # run tests (vitest)
npm run lint         # type check
```

## License

MIT
