---
name: mise
version: 2026.2.21
description: "Dev tool version manager and task runner. Use this skill whenever the user needs to install or manage tool versions (Node.js, Python, Go, Rust, etc.), set up development environments, manage environment variables, or run project tasks — even if they say 'install node' or 'switch python version' or 'nvm' or 'asdf' or 'rtx'."
ingredients:
  - jdx/mise
tags:
  - version-manager
  - dev-tools
  - environment
  - task-runner
  - cli
---

# mise — Dev Tool Version Manager & Task Runner

mise replaces nvm, pyenv, rbenv, asdf, rtx, direnv, and Make. One tool to install any runtime, set per-project versions, inject environment variables, and run tasks.

---

## 1. Tool Installation

```bash
mise install node@22                          # Install Node.js 22
mise install python@3.12 go@1.23 rust@1.82   # Install multiple tools
mise install node@latest                      # Latest version

# mise use = install + write to mise.toml (preferred)
mise use node@22              # Set for this project
mise use -g python@3.12       # Set globally (~/.config/mise/config.toml)
mise use node@22.11.0         # Pin exact version

# Manage versions
mise upgrade node             # Upgrade to latest in major
mise upgrade                  # Upgrade everything
mise uninstall node@20.10.0
mise prune                    # Remove versions not in any config
```

## 2. Configuration

mise reads config in priority order: `mise.toml` > `mise.local.toml` > `.tool-versions` > `~/.config/mise/config.toml`

```toml
# mise.toml
[tools]
node = "22"
python = "3.12"
go = "1.23"

[tools.rust]
version = "1.82"
postinstall = "rustup component add clippy rustfmt"
```

asdf-compatible `.tool-versions` also works: `node 22.11.0`

```bash
mise config ls      # Show all config files in priority order
mise where node     # Show where a tool version comes from
mise config         # Show resolved config as TOML
```

## 3. Environment Variables

```bash
mise set NODE_ENV=development                  # Set in mise.toml [env]
mise set DATABASE_URL=postgres://localhost/mydb
mise set --env staging NODE_ENV=staging        # Per-environment
mise unset NODE_ENV
mise env                                       # Print all resolved env vars
mise env --shell bash                          # As export statements
```

```toml
# mise.toml
[env]
NODE_ENV = "development"
DATABASE_URL = "postgres://localhost/mydb"
_.file = [".env", ".env.local"]    # Load .env files
_.path = ["./node_modules/.bin"]   # Append to PATH
_.source = "./setup-env.sh"        # Source a script
```

## 4. Task Runner

### Define tasks in mise.toml

```toml
[tasks.build]
description = "Build the project"
run = "npm run build"

[tasks.test]
description = "Run tests"
run = "npm test"
depends = ["build"]

[tasks.lint]
description = "Lint all files"
run = ["eslint .", "prettier --check ."]

[tasks.deploy]
description = "Deploy to production"
run = "scripts/deploy.sh"
depends = ["build", "test", "lint"]
env = { NODE_ENV = "production" }

[tasks."db:migrate"]
run = "prisma migrate dev"

[tasks."db:seed"]
run = "prisma db seed"
depends = ["db:migrate"]
```

### File-based tasks

Create executable scripts in `mise-tasks/` or `.mise/tasks/`:

```bash
#!/usr/bin/env bash
# mise-tasks/deploy
# mise description="Deploy to production"
# mise depends=["build", "test"]
set -euo pipefail
rsync -avz dist/ server:/app/
```

### Run tasks

```bash
mise run build                       # Run a task
mise r test                          # Short alias
mise run test -- --coverage --watch  # Pass arguments through
mise run lint test                   # Run multiple sequentially
mise run --parallel lint test        # Run in parallel
mise tasks ls                        # List available tasks
mise tasks info build                # Show task details
```

## 5. Listing & Searching Tools

```bash
mise ls                    # All installed tool versions
mise ls node               # Only node versions
mise ls --current          # Currently active (from config)
mise ls --json             # JSON output for scripting

mise ls-remote node        # All available Node.js versions
mise ls-remote python 3.12 # Filter by prefix
mise registry              # List all tools in the registry

mise search terraform      # Search by name (500+ tools)
mise search aws            # Finds awscli, aws-vault, etc.
mise outdated              # Tools with newer versions available
mise outdated node         # Check specific tool
```

**Popular tools:** node, python, go, rust, ruby, java, deno, bun, terraform, kubectl, helm, jq, ripgrep, gh, shellcheck, and 500+ more.

## 6. Shell Integration

```bash
# Add to ~/.bashrc or ~/.zshrc (required for auto-switching on cd)
eval "$(mise activate zsh)"     # or bash, fish

# One-off execution (useful in CI, no shell hooks needed)
mise exec node@20 -- node --version
mise exec -- npm test
mise exec python@3.12 -- python script.py

# Shims (alternative for IDEs and non-interactive contexts)
mise reshim
export PATH="$HOME/.local/share/mise/shims:$PATH"

# Resolve paths
mise which node     # Full path to binary
mise where node@22  # Install directory
```

> Prefer `mise activate` over shims. Activate is faster and handles edge cases better.

## 7. Plugins & Backends

```bash
mise plugins ls           # List installed plugins
mise plugins ls-remote    # All available asdf plugins
mise plugins install elixir
mise plugins update
```

mise supports multiple backends:

```toml
[tools]
node = "22"                                    # core (built-in, fastest)
"npm:prettier" = "3"                           # npm packages as tools
"npm:eslint" = "9"
"cargo:ripgrep" = "14"                         # Rust crates
"go:golang.org/x/tools/gopls" = "latest"       # Go modules
"pipx:black" = "latest"                        # Python CLI tools
"ubi:junegunn/fzf" = "latest"                  # GitHub release binaries
```

Backends: **core**, **aqua**, **asdf**, **cargo**, **go**, **npm**, **pipx**, **ubi**, **vfox**, **spm**

## 8. Diagnostics

```bash
mise doctor          # Check shell integration, config, PATH, installations
mise version         # Show mise version
mise self-update     # Update mise itself
mise settings        # Show all settings
mise settings set experimental true
mise cache clear     # Clear download cache

# Debug mode
mise install node@22 --verbose
MISE_DEBUG=1 mise install node@22
```

## 9. Agent Workflows

### Install a tool / switch versions

```bash
mise use node@22        # Install + activate in project
node --version          # Verify
mise use python@3.12    # Switch Python version
```

### Set up dev environment

```bash
mise install             # Install everything from mise.toml
mise trust               # Trust project config (first time)
mise use node@22 python@3.12
mise set NODE_ENV=development
```

### Run project tasks

```bash
mise tasks ls            # See what's available
mise run build test lint # Run tasks
```

### Diagnose problems

```bash
mise doctor              # Full diagnostic check
mise which node          # Check binary resolution
mise uninstall node@22 && mise install node@22  # Reinstall
mise cache clear
```

### CI setup

```bash
mise install              # Install from config
mise exec -- npm test     # Run without shell hooks
# Or: uses: jdx/mise-action@v2
```

### Complete project config

```toml
# mise.toml
min_version = "2025.1.0"

[tools]
node = "22"
python = "3.12"
"npm:prettier" = "3"
"npm:eslint" = "9"

[env]
NODE_ENV = "development"
DATABASE_URL = "postgres://localhost:5432/myapp_dev"
_.file = [".env", ".env.local"]
_.path = ["./node_modules/.bin"]

[tasks.setup]
description = "Initial project setup"
run = "npm install && mise run db:migrate"

[tasks.dev]
run = "npm run dev"

[tasks.test]
run = ["npm test", "pytest"]
depends = ["build"]

[tasks.build]
run = "npm run build"
env = { NODE_ENV = "production" }

[tasks.lint]
run = ["eslint .", "prettier --check ."]

[tasks."db:migrate"]
run = "prisma migrate dev"

[tasks.clean]
run = "rm -rf dist .next node_modules/.cache __pycache__"
```

## Quick Reference

| Action | Command |
|---|---|
| Install a tool | `mise install node@22` |
| Use in project | `mise use node@22` |
| Use globally | `mise use -g node@22` |
| List installed | `mise ls` |
| List remote versions | `mise ls-remote node` |
| Check outdated | `mise outdated` |
| Search tools | `mise search terraform` |
| Run a task | `mise run build` |
| List tasks | `mise tasks ls` |
| Set env var | `mise set KEY=value` |
| View env | `mise env` |
| Exec one-off | `mise exec node@20 -- node -e "1+1"` |
| Diagnose | `mise doctor` |
| Install all from config | `mise install` |
| Trust config | `mise trust` |
| Prune unused | `mise prune` |
