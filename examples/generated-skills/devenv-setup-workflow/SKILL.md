---
name: devenv-setup-workflow
version: 1.0.0
description: "Development environment setup and management using mise for tool versions, just for task running, uv for Python, and zoxide for navigation. Use this skill whenever the user needs to set up a development environment, install development tools, configure project tooling, manage tool versions, create task runners, or bootstrap a new machine — even if they just say 'set up this project' or 'install the right node version' or 'create a Makefile' or 'how do I run this project'."
ingredients:
  - jdx/mise
  - casey/just
  - astral-sh/uv
  - ajeetdsouza/zoxide
tags:
  - workflow
  - dev-environment
  - setup
  - tooling
  - automation
---

# Dev Environment Setup Workflow

Set up reproducible, shareable development environments by combining four tools: **mise** (tool version manager), **just** (task runner), **uv** (Python package manager), and **zoxide** (smart directory jumper). This workflow replaces nvm/pyenv/rbenv, Makefiles, pip/poetry, and manual `cd` navigation.

## Why These Four Tools

- **mise** replaces nvm, pyenv, rbenv, goenv, and asdf. One config file pins every tool version per project. Auto-activates when you enter the directory.
- **just** replaces Makefiles. Simpler syntax, no tab sensitivity, cross-platform, supports arguments and dependencies.
- **uv** replaces pip, pip-tools, poetry, pipx, and pyenv (for Python specifically). 10-100x faster installs.
- **zoxide** replaces `cd`. Learns your habits, jumps to projects by partial name. Saves minutes per day.

## Workflow 1: Bootstrap a New Project

Set up a complete development environment from scratch. Do this whenever starting a new project or inheriting an existing repo that lacks tooling config.

### Step 1: Create the project structure

```bash
mkdir my-project && cd my-project
git init
```

### Step 2: Define tool versions with mise

Create `mise.toml` at the project root. This file tells every developer (and CI) exactly which tool versions to use.

```toml
# mise.toml
[tools]
node = "22"
python = "3.12"

[env]
PROJECT_NAME = "my-project"
```

Install the tools:

```bash
mise install
```

Verify activation:

```bash
mise current
# node   22.x.x  (from ./mise.toml)
# python 3.12.x  (from ./mise.toml)
```

### Step 3: Initialize the language-specific package manager

For Python projects, use uv:

```bash
uv init --python 3.12
uv add fastapi uvicorn
uv add --dev pytest ruff mypy
```

For Node.js projects:

```bash
npm init -y
# or: pnpm init
```

For both (multi-language):

```bash
uv init --python 3.12 --bare
npm init -y
```

### Step 4: Create a justfile for common tasks

```just
# justfile

# List available recipes
default:
    @just --list

# Install all dependencies
setup:
    mise install
    uv sync
    npm install

# Start the development server
dev:
    uv run uvicorn app.main:app --reload --port 8000

# Run tests
test *args:
    uv run pytest {{args}}

# Lint and format
lint:
    uv run ruff check .

format:
    uv run ruff format .

# Clean build artifacts
clean:
    rm -rf .venv __pycache__ .ruff_cache .pytest_cache dist build node_modules/.cache
```

### Step 5: Register with zoxide

```bash
# zoxide learns directories automatically when you cd into them.
# After visiting a directory once, jump back from anywhere:
z my-project
```

### Step 6: Verify the full setup

```bash
just setup   # installs all tools and dependencies
just test    # runs the test suite
just dev     # starts the dev server
```

## Workflow 2: Define Project Tool Versions

Use mise.toml to pin exact tool versions for the project. Do this to prevent "works on my machine" problems and to make CI reproducible.

### Node.js project

```toml
# mise.toml
[tools]
node = "22.12"

[env]
NODE_ENV = "development"
```

### Python project

```toml
# mise.toml
[tools]
python = "3.12"

[env]
PYTHONDONTWRITEBYTECODE = "1"
```

### Go project

```toml
# mise.toml
[tools]
go = "1.23"
golangci-lint = "1.62"
```

### Rust project

```toml
# mise.toml
[tools]
rust = "1.83"
```

### Full-stack project (Node + Python + misc tools)

```toml
# mise.toml
[tools]
node = "22"
python = "3.12"
just = "latest"
watchexec = "latest"

[env]
NODE_ENV = "development"
DATABASE_URL = "postgresql://localhost:5432/myapp_dev"
```

### Pin vs. latest

```toml
[tools]
# Pin to major version — gets latest 22.x.x
node = "22"

# Pin to minor — gets latest 22.12.x
node = "22.12"

# Pin to exact patch
node = "22.12.0"

# Always latest stable
just = "latest"
```

### Activate automatically

mise activates automatically when you `cd` into a directory with `mise.toml`. Ensure your shell is configured:

```bash
# Add to ~/.zshrc or ~/.bashrc (one-time setup)
eval "$(mise activate zsh)"
# or: eval "$(mise activate bash)"
```

After this, every time you enter the project directory, the correct tool versions are available without running any command.

## Workflow 3: Create a Justfile for Project Tasks

Create a justfile to give every project a consistent interface. Do this so that `just dev`, `just test`, and `just build` work the same way across all your projects.

### Basic justfile structure

```just
# justfile
# Project task runner — run `just` to see available commands.

# Show all available recipes
default:
    @just --list

# ── Setup ──────────────────────────────────────────────

# Install all tools and dependencies
setup:
    mise install
    uv sync

# ── Development ────────────────────────────────────────

# Start the dev server with hot reload
dev:
    uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# ── Quality ────────────────────────────────────────────

# Run the full test suite
test *args:
    uv run pytest {{args}}

# Run tests with coverage
test-cov:
    uv run pytest --cov=app --cov-report=term-missing

# Lint all source files
lint:
    uv run ruff check .

# Auto-format all source files
format:
    uv run ruff format .

# Type-check
typecheck:
    uv run mypy src/

# Run all quality checks (lint + typecheck + test)
check: lint typecheck test

# ── Build & Deploy ─────────────────────────────────────

# Build the production artifact
build:
    uv build

# Deploy to production (override DEPLOY_TARGET as needed)
deploy target="staging":
    @echo "Deploying to {{target}}..."
    ./scripts/deploy.sh {{target}}

# ── Cleanup ────────────────────────────────────────────

# Remove all generated files
clean:
    rm -rf dist build .venv __pycache__ .pytest_cache .mypy_cache .ruff_cache
```

### Variables and settings

```just
# justfile

# Variables
project := "my-app"
python := "uv run python"
port := "8000"

# Settings
set dotenv-load  # auto-load .env file
set positional-arguments

# Use variables in recipes
dev:
    {{python}} -m uvicorn {{project}}.main:app --port {{port}} --reload

# Positional arguments
run *args:
    {{python}} "$@"
```

### Recipe dependencies

```just
# Run `build` before `deploy`
deploy: build
    ./scripts/deploy.sh

# Run `lint` and `test` in sequence before `release`
release: lint test build
    uv publish
```

### OS-specific recipes

```just
# Different commands per OS
install-deps:
    #!/usr/bin/env bash
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install libpq
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y libpq-dev
    fi

# Or use just's built-in OS detection
[linux]
open url:
    xdg-open {{url}}

[macos]
open url:
    open {{url}}

[windows]
open url:
    start {{url}}
```

### Node.js justfile

```just
# justfile for a Node/TypeScript project

default:
    @just --list

setup:
    mise install
    pnpm install

dev:
    pnpm dev

build:
    pnpm build

test *args:
    pnpm test {{args}}

lint:
    pnpm eslint .

format:
    pnpm prettier --write .

typecheck:
    pnpm tsc --noEmit

check: lint typecheck test
```

## Workflow 4: Environment Variables Management

Manage per-project and per-environment variables using mise.toml. Do this instead of scattering `.env` files that drift between machines or get accidentally committed.

### Basic env vars in mise.toml

```toml
# mise.toml
[env]
DATABASE_URL = "postgresql://localhost:5432/myapp_dev"
REDIS_URL = "redis://localhost:6379"
LOG_LEVEL = "debug"
SECRET_KEY = "dev-only-not-secret"
```

These variables are set automatically when you enter the project directory (via mise activation).

### Load from .env files

```toml
# mise.toml
[env]
_.file = ".env"           # load .env file
_.file = [".env", ".env.local"]  # load multiple, later files override earlier
```

Keep `.env` out of git and provide a `.env.example` template:

```bash
# .env.example (committed)
DATABASE_URL=postgresql://localhost:5432/myapp_dev
SECRET_KEY=change-me

# .env (gitignored, each dev creates their own)
DATABASE_URL=postgresql://localhost:5432/myapp_dev
SECRET_KEY=my-local-secret
```

### Per-environment configuration

Use mise profiles for dev/staging/prod:

```toml
# mise.toml (default — development)
[env]
APP_ENV = "development"
DATABASE_URL = "postgresql://localhost:5432/myapp_dev"
LOG_LEVEL = "debug"
```

```toml
# mise.staging.toml
[env]
APP_ENV = "staging"
DATABASE_URL = "postgresql://staging-host:5432/myapp_staging"
LOG_LEVEL = "info"
```

Activate a profile:

```bash
# Use the staging profile
MISE_ENV=staging mise install
```

### Computed environment variables

```toml
# mise.toml
[env]
PROJECT_ROOT = "{{cwd}}"
PATH = ["{{cwd}}/bin", "{{cwd}}/node_modules/.bin"]
```

### Use env vars in justfile

```just
# justfile
set dotenv-load  # load .env automatically

# Or reference mise-set env vars directly — they're already in the environment
db-migrate:
    uv run alembic upgrade head

db-reset:
    dropdb myapp_dev || true
    createdb myapp_dev
    just db-migrate
    just db-seed

db-seed:
    uv run python scripts/seed.py
```

## Workflow 5: Multi-Language Project Setup

Set up a project that uses both Python (backend) and Node.js (frontend). Do this for full-stack apps, monorepos, or projects with mixed tooling.

### Step 1: Define all runtimes in mise.toml

```toml
# mise.toml
[tools]
node = "22"
python = "3.12"
just = "latest"

[env]
BACKEND_PORT = "8000"
FRONTEND_PORT = "3000"
```

```bash
mise install
```

### Step 2: Initialize both ecosystems

```bash
# Backend (Python)
mkdir -p backend
cd backend
uv init --python 3.12
uv add fastapi uvicorn sqlalchemy
uv add --dev pytest ruff
cd ..

# Frontend (Node.js)
mkdir -p frontend
cd frontend
pnpm init
pnpm add next react react-dom
pnpm add -D typescript @types/react
cd ..
```

### Step 3: Create a unified justfile

```just
# justfile — orchestrates the full-stack project

default:
    @just --list

# ── Setup ──────────────────────────────────────────────

# Install everything from scratch
setup:
    mise install
    cd backend && uv sync
    cd frontend && pnpm install

# ── Development ────────────────────────────────────────

# Start both backend and frontend (requires `just` concurrency or a process manager)
dev:
    #!/usr/bin/env bash
    trap 'kill 0' EXIT
    just dev-backend &
    just dev-frontend &
    wait

# Start only the backend
dev-backend:
    cd backend && uv run uvicorn app.main:app --reload --port 8000

# Start only the frontend
dev-frontend:
    cd frontend && pnpm dev

# ── Quality ────────────────────────────────────────────

# Run all tests
test:
    cd backend && uv run pytest
    cd frontend && pnpm test

# Lint everything
lint:
    cd backend && uv run ruff check .
    cd frontend && pnpm lint

# Format everything
format:
    cd backend && uv run ruff format .
    cd frontend && pnpm prettier --write .

# ── Build ──────────────────────────────────────────────

# Build for production
build:
    cd backend && uv build
    cd frontend && pnpm build

# ── Database ───────────────────────────────────────────

db-migrate:
    cd backend && uv run alembic upgrade head

db-reset:
    cd backend && uv run python scripts/reset_db.py
```

### Step 4: Verify

```bash
just setup    # installs Node 22, Python 3.12, all deps
just dev      # starts backend on :8000, frontend on :3000
just test     # runs both test suites
```

## Workflow 6: Team Onboarding

Make it so a new developer can go from git clone to running the project in three commands. Do this for every team project.

### What the new developer runs

```bash
# 1. Clone and enter the project
git clone git@github.com:myorg/my-project.git
cd my-project

# 2. Install mise (one-time, if not already installed)
curl https://mise.run | sh
eval "$(mise activate zsh)"

# 3. Set up everything
just setup

# 4. Start developing
just dev
```

That's it. Three commands after clone.

### The `just setup` recipe that makes this possible

```just
# justfile

# Complete project setup for new developers
setup:
    #!/usr/bin/env bash
    set -euo pipefail

    echo "Installing tool versions (node, python, etc.)..."
    mise install

    echo "Installing Python dependencies..."
    cd backend && uv sync && cd ..

    echo "Installing Node dependencies..."
    cd frontend && pnpm install && cd ..

    echo "Setting up the database..."
    just db-migrate
    just db-seed

    echo "Copying environment template..."
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "Created .env from template — review and update secrets."
    fi

    echo "Setup complete! Run 'just dev' to start."
```

### Document the prerequisites

Add a small section to the project README:

```
## Prerequisites

- [mise](https://mise.jdx.dev) — install with `curl https://mise.run | sh`
- [just](https://just.systems) — installed automatically by mise

## Getting Started

git clone <repo-url> && cd <project>
just setup
just dev
```

### Verify the onboarding flow works

Test the onboarding periodically by running it in a clean environment:

```bash
# In a temp directory, simulate a fresh clone
cd $(mktemp -d)
git clone git@github.com:myorg/my-project.git
cd my-project
just setup
just test
just dev
```

If any step fails, fix it immediately. A broken onboarding wastes hours per new developer.

## Workflow 7: CI/CD Integration

Use mise and just in CI to get the same tool versions and task commands as local development. Do this so your CI never drifts from local.

### GitHub Actions with mise

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install mise
        uses: jdx/mise-action@v2

      - name: Install just
        uses: extractions/setup-just@v2

      - name: Setup project
        run: just setup

      - name: Lint
        run: just lint

      - name: Test
        run: just test

      - name: Build
        run: just build
```

### Why this works

- `jdx/mise-action` reads your `mise.toml` and installs the exact same tool versions as local development.
- `just setup` / `just test` / `just build` are the same commands developers run locally.
- No separate CI-specific scripts to maintain. One source of truth.

### Cache dependencies for speed

```yaml
      - name: Cache uv
        uses: actions/cache@v4
        with:
          path: ~/.cache/uv
          key: uv-${{ runner.os }}-${{ hashFiles('**/uv.lock') }}

      - name: Cache node_modules
        uses: actions/cache@v4
        with:
          path: frontend/node_modules
          key: node-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

### Use just as the CI task runner

Define CI-specific recipes that compose existing ones:

```just
# justfile

# CI-specific: run all checks and fail fast
ci: lint typecheck test build
    @echo "All CI checks passed."

# CI-specific: run only what changed (if you have a diff-based test runner)
ci-changed:
    #!/usr/bin/env bash
    CHANGED=$(git diff --name-only origin/main...HEAD)
    if echo "$CHANGED" | grep -q "^backend/"; then
        echo "Backend changed — running backend tests"
        cd backend && uv run pytest
    fi
    if echo "$CHANGED" | grep -q "^frontend/"; then
        echo "Frontend changed — running frontend tests"
        cd frontend && pnpm test
    fi
```

## Workflow 8: Navigation with Zoxide

Set up fast project navigation so you spend zero time typing long paths. Do this on every machine you work on.

### One-time setup

```bash
# Install zoxide
brew install zoxide   # macOS
# or: curl -sSfL https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | sh

# Add to shell config (~/.zshrc or ~/.bashrc)
eval "$(zoxide init zsh)"
# or: eval "$(zoxide init bash)"
```

### Basic usage

```bash
# zoxide learns directories as you visit them.
# First visit — use cd normally:
cd /Users/cedric/dev/2026/my-project

# After that, jump from anywhere with a partial match:
z my-project

# Multiple matches? zoxide picks the most "frecent" (frequent + recent).
z project    # jumps to whichever "project" directory you visit most

# Interactive selection with fzf (if installed):
zi project   # shows a list of matching directories, pick one
```

### Common navigation patterns

```bash
# Jump to a project
z my-project

# Jump to a subdirectory you visit often
z components    # goes to e.g. ~/dev/my-project/src/components

# Jump to a project, then use just
z my-project && just dev

# Quick one-liner: jump and run
z backend && just test
```

### Integrate with fzf for interactive selection

```bash
# Install fzf if not present
brew install fzf   # macOS

# zi launches interactive mode automatically when fzf is available
zi

# Search interactively among all known directories
zi dev    # filters to directories containing "dev", pick with arrow keys
```

### Manage the zoxide database

```bash
# List all known directories (sorted by score)
zoxide query --list

# Add a directory manually (without visiting it)
zoxide add /path/to/project

# Remove a stale directory
zoxide remove /path/to/deleted-project

# See the score for a specific directory
zoxide query my-project
```

### Alias patterns for power users

```bash
# Add to ~/.zshrc for quick project access
alias dev="z dev && ls"
alias work="z work-project && just dev"

# Function to jump and immediately show project status
zj() {
    z "$@" && git status --short && just --list 2>/dev/null
}
```

## Quick Reference: File Checklist

When setting up a project with this workflow, ensure these files exist:

| File | Purpose | Committed to git? |
|------|---------|-------------------|
| `mise.toml` | Tool versions and env vars | Yes |
| `justfile` | Task definitions | Yes |
| `pyproject.toml` | Python project config (if applicable) | Yes |
| `uv.lock` | Python dependency lockfile | Yes |
| `package.json` | Node.js config (if applicable) | Yes |
| `pnpm-lock.yaml` | Node dependency lockfile | Yes |
| `.env.example` | Environment variable template | Yes |
| `.env` | Local secrets and overrides | No (gitignored) |
| `.mise.local.toml` | Per-developer mise overrides | No (gitignored) |

## Troubleshooting

### mise says "tool not installed"

```bash
# Install all tools defined in mise.toml
mise install

# If a specific version is missing
mise install node@22

# Verify activation is working
mise doctor
```

### just says "recipe not found"

```bash
# Verify you're in the right directory (justfile must be present)
ls justfile

# List available recipes
just --list

# Run from a subdirectory (just searches parent dirs)
just --justfile ../justfile test
```

### uv sync fails

```bash
# Delete venv and re-create
rm -rf .venv
uv sync

# If lockfile is stale
uv lock --upgrade
uv sync
```

### zoxide doesn't jump to the right place

```bash
# Check what it resolves to
zoxide query my-project

# If wrong, remove the stale entry and visit the correct one
zoxide remove /wrong/path
cd /correct/path  # this teaches zoxide
```
