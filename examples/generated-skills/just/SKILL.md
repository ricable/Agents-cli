---
name: just
version: 1.46.0
description: "Command runner for project tasks — a modern alternative to make. Use this skill whenever the user needs to run project commands, define task recipes, automate build steps, or manage project scripts — even if they say 'make' or 'run task' or 'project commands' or 'Makefile'."
ingredients:
  - casey/just
tags:
  - task-runner
  - make
  - automation
  - cli
  - build
---

# just — Command Runner

`just` is a command runner that uses a `justfile` to define recipes — named commands with arguments, dependencies, and variables. Simpler and more portable than `make`.

**Trigger on:** "run project tasks", "list available commands", "check what tasks exist", "run make", "build", "Makefile", "project commands", "run task", "what can I run"

---

## 1. Running Recipes

```bash
just build                          # Run a recipe by name
just                                # Run the default recipe (first in file)
just deploy staging v2.1.0          # Pass positional arguments
just clean build test               # Run multiple recipes in sequence
just --justfile path/to/justfile build  # Use a specific justfile
just --working-directory ./api start   # Run from a different directory
```

Justfile with arguments:

```just
default: build test

build:
    cargo build --release

deploy target version:
    echo "Deploying {{version}} to {{target}}"
    ./scripts/deploy.sh {{target}} {{version}}

# Default argument values
serve port="8080":
    python -m http.server {{port}}

# Variadic: one or more
lint +files:
    eslint {{files}}

# Variadic: zero or more
test *args:
    pytest {{args}}
```

---

## 2. Listing and Inspecting

```bash
just --list                        # List all recipes with descriptions
just --summary                     # One-line list of recipe names
just --dump                        # Dump the parsed justfile
just --dump --dump-format json     # Dump as JSON
just --show deploy                 # Show a single recipe's definition
just --evaluate variable_name      # Print a variable's value
```

---

## 3. Justfile Syntax

```just
# Comments above recipes become descriptions in --list
# Body MUST be indented with spaces or tabs (consistently)
recipe-name: dependency1 dependency2
    command1
    command2

# Dependencies with arguments
push: (deploy "production" "latest")
    echo "Pushed"

# Post-dependencies (run after body)
post-build: && notify
    cargo build

# Private recipes (hidden from --list)
_helper:
    echo "hidden"

# Recipe attributes
[confirm("Are you sure?")]
[linux]
dangerous-recipe:
    rm -rf /tmp/build

[macos]
install-deps:
    brew install cmake

[no-cd]
info:
    pwd
```

---

## 4. Variables

```just
version := "1.0.0"
git_hash := `git rev-parse --short HEAD`          # Backtick = command substitution
home_dir := env_var("HOME")                        # Read env var (error if unset)
editor := env_var_or_default("EDITOR", "vim")      # Read env var with fallback
project := justfile_directory()                     # Built-in path function

export DATABASE_URL := "postgres://localhost/mydb"  # Export to recipe commands

# Export ALL variables to child processes
set export

build:
    echo "Building {{version}} at {{git_hash}}"
```

```bash
# Override from CLI
just --set version "2.0.0" build
just version="2.0.0" build
```

Built-in functions: `os()`, `arch()`, `os_family()`, `uppercase()`, `lowercase()`, `replace()`, `trim()`, `uuid()`, `sha256()`, `join()`, `absolute_path()`, `parent_directory()`, `file_name()`, `file_stem()`.

---

## 5. Conditionals and OS Detection

```just
lib_ext := if os() == "macos" { "dylib" } else if os() == "linux" { "so" } else { "dll" }
cc := if os() == "macos" { "clang" } else { "gcc" }

install:
    {{ if os() == "macos" { "brew install pkg" } else { "apt-get install -y pkg" } }}

system-info:
    echo "OS: {{os()}} Arch: {{arch()}} Family: {{os_family()}}"

# Regex matching
is_release := if version =~ "^[0-9]+\\.[0-9]+\\.[0-9]+$" { "yes" } else { "no" }
```

---

## 6. Dotenv Integration

```just
set dotenv-load                              # Auto-load .env file
# set dotenv-path := ".env.production"       # Or specify path

db_url := env_var("DATABASE_URL")

migrate:
    diesel migration run                     # $DATABASE_URL available

seed:
    echo "Seeding {{db_url}}"
```

```bash
just --dotenv-path .env.staging start        # Override .env path from CLI
```

---

## 7. Shell and Shebang Recipes

```just
# Set shell globally
set shell := ["bash", "-cu"]
set windows-shell := ["powershell.exe", "-NoLogo", "-Command"]

# Shebang recipes — entire body is written to a temp file and executed
analyze:
    #!/usr/bin/env python3
    import json
    with open("data.json") as f:
        data = json.load(f)
    print(f"Records: {len(data)}")

deploy:
    #!/usr/bin/env bash
    set -euo pipefail
    docker compose up -d
    until curl -sf http://localhost:8080/health; do sleep 1; done
    echo "Deployed"
```

---

## 8. Dry Run

```bash
just -n deploy production            # Preview commands without executing
just --dry-run deploy production     # Same thing
just -n --verbose build test deploy  # Maximum visibility
```

Note: Backtick expressions ARE evaluated during dry run (they run at parse time). Shebang recipes show script content but do not execute.

---

## 9. Interactive Selection

```bash
just --choose                                        # fzf picker (requires fzf)
just --chooser "fzf --preview 'just --show {}'"      # Custom chooser with preview
```

---

## 10. Modules and Imports

```just
# Imports (just 1.19+) — pull recipes from other files
import "tasks/build.just"
import "tasks/test.just"

# Modules (just 1.24+) — namespaced recipes
mod deploy                    # Looks for deploy.just or deploy/justfile
mod ci "ci/tasks.just"        # Custom path
mod? experimental             # Optional (no error if missing)
```

```bash
just deploy::staging          # Run module recipe (:: separator)
just ci::lint
just --list deploy            # List recipes in a module
```

---

## 11. Useful Patterns

```just
# Suppress command echoing with @
build:
    @echo "Building..."
    cargo build --release

# Ignore exit code with -
clean:
    -rm -rf target/
    -rm -rf node_modules/

# Logging helper
_log message:
    @echo "[$(date '+%H:%M:%S')] {{message}}"

build: (_log "starting build")
    cargo build --release

# Docker Compose wrapper
set dotenv-load
compose := "docker compose"

up *args:
    {{compose}} up {{args}}

down:
    {{compose}} down

logs *services:
    {{compose}} logs -f {{services}}

exec service +cmd:
    {{compose}} exec {{service}} {{cmd}}
```

### Full-Stack Project Example

```just
set dotenv-load
set shell := ["bash", "-cu"]

default:
    @just --list

dev:
    #!/usr/bin/env bash
    set -euo pipefail
    trap 'kill 0' EXIT
    just api-dev & just web-dev & wait

api-dev:
    cd services/api && cargo watch -x run

web-dev:
    cd apps/web && pnpm dev

test: test-api test-web
    @echo "All tests passed"

test-api:
    cd services/api && cargo test

test-web:
    cd apps/web && pnpm test

db-migrate:
    diesel migration run

db-reset: && db-migrate
    diesel database reset

[confirm("Build and push images?")]
release version: test
    docker build -t myapp:{{version}} .
    docker push myapp:{{version}}

fmt:
    cargo fmt && cd apps/web && pnpm prettier --write .

lint:
    cargo clippy -- -D warnings
    cd apps/web && pnpm eslint .

check: fmt lint test
    @echo "All checks passed"
```

---

## Agent Workflows

When the user asks to **run project tasks**, **list available commands**, or **check what tasks exist**:

1. **Check** if a `justfile` exists in the project root or current directory.
2. **List** recipes with `just --list` to show what is available.
3. **Inspect** with `just --show <name>` before running unfamiliar recipes.
4. **Preview** with `just -n <recipe>` for destructive or deployment recipes.
5. **Run** with `just <recipe> [args]`.

When the user asks to **create or edit tasks**, write or modify the `justfile` using the syntax above. Always check for an existing justfile first.
