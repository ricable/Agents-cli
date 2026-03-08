---
name: uv
version: 0.10.9
description: "Extremely fast Python package and project manager. Use this skill whenever the user needs to create Python projects, install Python packages, manage dependencies, run Python scripts, manage Python versions, create virtual environments, or do anything Python package-related — even if they say 'pip install' or 'python setup' or 'virtualenv'."
ingredients:
  - astral-sh/uv
tags:
  - python
  - package-manager
  - cli
  - virtual-environment
  - dependency-management
---

# uv

An extremely fast Python package and project manager, written in Rust by [Astral](https://astral.sh). Replaces pip, pip-tools, pipx, poetry, pyenv, twine, virtualenv, and more — in a single binary that's 10-100x faster.

**Source**: https://github.com/astral-sh/uv

## Project Management

### `uv init`

```bash
uv init                              # New project in current directory
uv init my-project                   # Named project in new directory
uv init --lib my-library             # Library (vs application)
uv init --python 3.12 my-project     # Specific Python version
uv init --bare my-project            # Minimal (no README, no src layout)
```

### `uv add`

Add dependencies — resolves, locks, and installs in one step.

```bash
uv add requests                      # Add a package
uv add "flask>=3.0"                  # With version constraint
uv add --dev pytest ruff mypy        # Dev dependency
uv add git+https://github.com/org/repo  # From git
uv add --group docs sphinx           # Named dependency group
uv add "fastapi[standard]"           # With extras
```

### `uv remove`

```bash
uv remove requests                   # Remove a package
uv remove --dev pytest               # Remove dev dependency
uv remove --group docs sphinx        # Remove from a group
```

### `uv sync`

Sync environment with lockfile. Creates venv if needed.

```bash
uv sync                              # Sync all (creates .venv if missing)
uv sync --all-extras                 # Include all extra groups
uv sync --no-dev                     # Production only (no dev deps)
uv sync --frozen                     # Fail if lockfile outdated
uv sync --extra docs                 # Sync a specific extra group
```

### `uv lock`

```bash
uv lock                              # Generate/update uv.lock
uv lock --verbose                    # Show resolution details
uv lock --check                      # CI: verify lockfile is current
```

### `uv tree`

```bash
uv tree                              # Full dependency tree
uv tree --all-groups                 # Include dev dependencies
uv tree --invert                     # Reverse: who depends on what
uv tree --package requests           # Tree for one package
```

## Running Python Code

### `uv run`

Run commands in the project environment — auto-creates and syncs venv.

```bash
uv run script.py                     # Run a script
uv run -m pytest                     # Run a module
uv run -- pytest -xvs tests/        # Run with args (-- separates)
uv run --with rich script.py         # Temporary dep (not saved)
uv run --with pandas --with matplotlib analysis.py
uv run --python 3.11 script.py      # Specific Python version
uv run -- python -c "import sys; print(sys.version)"
```

**Inline script metadata** (PEP 723) — uv reads deps from the script:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["requests", "rich"]
# ///
import requests
from rich import print
print(requests.get("https://httpbin.org/json").json())
```

```bash
uv run fetch_data.py                 # Auto-installs declared deps
```

## Tool Management

Like `npx` or `pipx`, but faster.

### `uv tool install`

```bash
uv tool install ruff                 # Install globally (isolated env)
uv tool install "ruff==0.8.0"       # Specific version
uv tool install "mkdocs[material]"  # With extras
uv tool upgrade ruff                 # Upgrade one tool
uv tool upgrade --all               # Upgrade all tools
uv tool list                         # List installed tools
uv tool uninstall ruff               # Remove a tool
```

### `uv tool run` (alias: `uvx`)

Run without permanent install — downloads, caches, executes.

```bash
uvx ruff check .                     # Run ephemerally
uvx ruff@0.8.0 check .              # Pin version
uvx --from "huggingface-hub" huggingface-cli download  # Different cmd name
uvx --with numpy ipython            # Extra deps available
```

## Python Version Management

### `uv python install`

```bash
uv python install 3.12               # Install a version
uv python install 3.11 3.12 3.13    # Install multiple
uv python install 3.12.7            # Specific patch
uv python install                    # Latest stable
```

### `uv python list` / `uv python pin`

```bash
uv python list                       # All available versions
uv python list --only-installed      # Only installed
uv python find 3.12                  # Find a version
uv python pin 3.12                   # Pin project (.python-version)
```

## Pip Compatibility Layer

Drop-in replacement for pip and pip-tools — same interface, 10-100x faster.

### `uv pip install`

```bash
uv pip install requests              # Install a package
uv pip install -r requirements.txt   # From requirements file
uv pip install -e .                  # Editable install
uv pip install ".[dev,test]"         # With extras
uv pip install -r requirements.txt -c constraints.txt
```

### `uv pip compile` / `uv pip sync`

```bash
# Compile (like pip-compile)
uv pip compile requirements.in -o requirements.txt
uv pip compile pyproject.toml -o requirements.txt
uv pip compile requirements.in --python-version 3.12
uv pip compile requirements.in --upgrade -o requirements.txt

# Sync environment to match requirements exactly
uv pip sync requirements.txt
```

### Other pip commands

```bash
uv pip list                          # List installed packages
uv pip show requests                 # Package info
uv pip freeze                        # Freeze environment
uv pip uninstall requests            # Remove package
uv pip check                         # Check for broken deps
```

## Virtual Environments

### `uv venv`

```bash
uv venv                              # Create .venv (default)
uv venv --python 3.12               # Specific Python version
uv venv /path/to/myenv              # Custom path
uv venv --seed                       # Pre-install pip
```

> In most workflows you never need `uv venv` explicitly. `uv run`, `uv sync`, and `uv add` create and manage the venv automatically.

## Building and Publishing

### `uv build`

```bash
uv build                             # Build sdist + wheel
uv build --wheel                     # Wheel only
uv build --sdist                     # Source dist only
uv build --python 3.12              # Specific Python
```

### `uv publish`

```bash
uv publish                           # Publish (reads UV_PUBLISH_TOKEN)
uv publish --publish-url https://upload.pypi.org/legacy/
uv publish --token pypi-xxxxxxxxxxxx
```

## Cache Management

```bash
uv cache dir                         # Show cache location and size
uv cache clean                       # Clean entire cache
uv cache clean requests              # Clean specific package
uv cache prune                       # Remove unreferenced entries (safe)
```

## Key Flags (Global)

| Flag | Description |
|------|-------------|
| `--python <VERSION>` | Use a specific Python version |
| `--no-cache` | Disable cache for this invocation |
| `--offline` | No network access (fail if not cached) |
| `--frozen` | Fail if lockfile is out of date |
| `--locked` | Assert lockfile is up to date |
| `--verbose` / `-v` | Increase verbosity |
| `--quiet` / `-q` | Suppress output |
| `--no-progress` | Disable progress bars (CI) |
| `--index-url <URL>` | Override default package index |
| `--extra-index-url <URL>` | Add additional package index |
| `--no-config` | Ignore uv.toml / pyproject.toml config |

## Configuration

```toml
# pyproject.toml
[tool.uv]
python-preference = "managed-only"
dev-dependencies = ["pytest>=8.0", "ruff>=0.8"]

[tool.uv.sources]
my-lib = { git = "https://github.com/myorg/my-lib", branch = "main" }
```

## Agent Workflows

### Create a new Python project

```bash
uv init my-service --python 3.12
cd my-service
uv add fastapi uvicorn sqlalchemy
uv add --dev pytest ruff mypy
uv run -- python -c "import fastapi; print(fastapi.__version__)"
```

### Install a dependency

```bash
uv add pandas
uv run -- python -c "import pandas; print(pandas.__version__)"
```

### Run Python scripts and tools

```bash
uv run app.py                        # Run script
uv run --with rich --with httpx debug_tool.py  # With temp deps
uv run -- pytest -xvs tests/        # Run tests
uv run -- ruff check .              # Run linter
```

### Manage Python versions

```bash
uv python install 3.13
uv python pin 3.13
uv sync
uv run -- python --version
```

### Migrate from pip/requirements.txt

```bash
# Option A: pip compat layer
uv pip install -r requirements.txt

# Option B: full migration to uv project
uv init --bare
uv add $(cat requirements.txt | grep -v '^#' | grep -v '^\s*$' | tr '\n' ' ')
uv lock
```

### CI/CD workflow

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
uv sync --frozen --no-dev
uv run -- pytest
uv build
uv publish --token "$PYPI_TOKEN"
```

### Run one-off tools (no install)

```bash
uvx ruff check .                     # Lint
uvx black .                          # Format
uvx pip-audit                        # Security audit
uvx mkdocs serve                     # Serve docs
uvx mypy src/                        # Type check
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `UV_PYTHON` | Default Python version |
| `UV_CACHE_DIR` | Override cache directory |
| `UV_INDEX_URL` | Default package index URL |
| `UV_EXTRA_INDEX_URL` | Additional package index URLs |
| `UV_PUBLISH_TOKEN` | PyPI token for `uv publish` |
| `UV_FROZEN` | Always use `--frozen` mode |
| `UV_NO_PROGRESS` | Disable progress bars |
| `UV_LINK_MODE` | Install link mode: `clone`, `copy`, `hardlink`, `symlink` |

## Troubleshooting

```bash
uv lock --verbose                    # Debug resolution conflicts
uv lock --upgrade                    # Force full re-resolve
uv cache clean                       # Fix suspected cache corruption
uv run -- python --version           # Check active Python
uv tool dir                          # Where tools are installed
rm -rf .venv && uv sync             # Recreate venv from scratch
```
