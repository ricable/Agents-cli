---
name: python-dev-workflow
version: 1.0.0
description: "Complete Python development workflow using uv for package management, rg for code search, and fd for file discovery. Use this skill whenever the user needs to set up a Python project, manage dependencies, run tests, lint code, create virtual environments, or do any Python development task — even if they just say 'new python project' or 'install numpy' or 'run pytest' or 'fix imports'."
ingredients:
  - astral-sh/uv
  - BurntSushi/ripgrep
  - sharkdp/fd
  - jqlang/jq
tags:
  - workflow
  - python
  - development
  - project-setup
  - testing
---

# Python Development Workflow

This skill orchestrates a complete Python development lifecycle. Every command uses `uv` instead of pip, virtualenv, or poetry — it is faster and handles environments automatically. Use `rg` and `fd` for code navigation because they respect `.gitignore` and outperform `grep`/`find` by 10-50x.

## 1. Bootstrap a New Python Project

Start here whenever the user wants a new Python project, package, or script collection.

### Create the project

```bash
uv init my-project
cd my-project
```

This creates `pyproject.toml`, `README.md`, `.python-version`, and a `src/my_project/__init__.py` layout. The virtual environment is created lazily on first `uv run`.

### For a flat layout instead of src layout

```bash
uv init my-project --no-package
```

This creates a simpler structure with `main.py` at the root — good for scripts and small tools.

### For a library meant to be published

```bash
uv init my-library --lib
```

### Add essential dev dependencies immediately

```bash
uv add --dev pytest ruff mypy
```

### Verify everything works

```bash
uv run python -c "print('Project ready')"
uv run pytest --co -q  # dry-run: list discovered tests
```

### pyproject.toml best practices

After `uv init`, enhance the generated `pyproject.toml` with these sections:

```toml
[project]
requires-python = ">=3.11"

[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "N", "UP", "B", "SIM", "RUF"]

[tool.ruff.format]
quote-style = "double"

[tool.pytest.ini_options]
testpaths = ["tests"]
addopts = "-x --tb=short -q"

[tool.mypy]
strict = true
warn_return_any = true
```

WHY: Setting these early prevents style drift. Ruff replaces both flake8 and isort. The pytest `addopts` fail fast on first error and keep output concise.

## 2. Add, Remove, and Update Dependencies

### Add a runtime dependency

```bash
uv add requests
uv add "numpy>=2.0"
uv add "pandas>=2.0,<3.0"
```

### Add a dev-only dependency

```bash
uv add --dev pytest-cov
uv add --dev hypothesis
```

WHY: Dev dependencies are not installed when users `pip install` your package. Keep test/lint tools here.

### Add an optional/extra dependency group

```bash
uv add --optional visualization matplotlib seaborn
```

This creates `[project.optional-dependencies]` in pyproject.toml so users can `pip install my-project[visualization]`.

### Remove a dependency

```bash
uv remove requests
```

### Update all dependencies to latest compatible versions

```bash
uv lock --upgrade
uv sync
```

### Update a single package

```bash
uv lock --upgrade-package requests
uv sync
```

### See what is installed

```bash
uv pip list
uv tree  # show dependency tree
```

### Pin an exact version when stability matters

```bash
uv add "sqlalchemy==2.0.30"
```

## 3. Run Scripts and Commands

Never activate a virtualenv manually. Use `uv run` — it ensures the correct environment and installs missing deps automatically.

### Run a Python script

```bash
uv run python script.py
uv run python -m my_project.cli
```

### Run an installed entry point

```bash
uv run pytest
uv run ruff check .
uv run mypy src/
```

### Pass flags through to the underlying command

```bash
uv run -- python -m pytest -v --tb=long -k "test_auth"
```

WHY: The `--` separator prevents uv from consuming flags meant for the inner command.

### Run a script that needs an extra package not in pyproject.toml

```bash
uv run --with rich python debug_script.py
```

This temporarily makes `rich` available without adding it to your project dependencies. Ideal for one-off debugging or exploration.

### Run with a specific Python version

```bash
uv run --python 3.12 python script.py
```

## 4. Manage Python Versions

### Install a specific Python version

```bash
uv python install 3.12
uv python install 3.11 3.13  # install multiple
```

### List available and installed versions

```bash
uv python list
```

### Pin the project to a specific version

```bash
uv python pin 3.12
```

This writes `.python-version`. uv (and pyenv) both respect this file.

### Set minimum version in pyproject.toml

```toml
[project]
requires-python = ">=3.11"
```

WHY: `requires-python` is for compatibility declaration (what versions your code supports). `.python-version` is for developer experience (what version to use locally).

## 5. One-Off Tool Execution

Use `uv tool` like `npx` — run CLI tools without installing them into your project.

### Run a formatter without installing it

```bash
uv tool run black .
uv tool run ruff format .
uv tool run ruff check --fix .
```

### Run any PyPI CLI tool

```bash
uv tool run httpie GET https://api.github.com
uv tool run cookiecutter gh:audreyfeldroy/cookiecutter-pypackage
uv tool run pyright src/
```

### Install a tool globally (persists across projects)

```bash
uv tool install ruff
uv tool install httpie
```

### List globally installed tools

```bash
uv tool list
```

### Upgrade a global tool

```bash
uv tool upgrade ruff
```

WHY: `uv tool run` downloads, caches, and runs in one step. The cache is shared across projects, so repeated runs are instant.

## 6. Find and Fix Import Issues

When the user hits `ModuleNotFoundError` or import confusion, use this workflow.

### Find all imports of a module across the codebase

```bash
rg "^(from|import) requests" --type py
```

### Find unused imports (let ruff do it)

```bash
uv run ruff check --select F401 .
```

### Auto-fix unused imports

```bash
uv run ruff check --select F401 --fix .
```

### Sort and organize imports

```bash
uv run ruff check --select I --fix .
```

### Find all `__init__.py` files to understand package structure

```bash
fd __init__.py
```

### Trace a module path — find where a module actually lives

```bash
uv run python -c "import requests; print(requests.__file__)"
```

### Find circular imports

```bash
# Find files that import from each other
rg "from my_project\.models" --type py -l | while read f; do
  module=$(echo "$f" | sed 's|/|.|g; s|\.py$||; s|^src\.||')
  rg "from ${module}" --type py -l
done
```

### Check for missing dependencies — find imports not in pyproject.toml

```bash
# List all third-party imports
rg "^(from|import) " --type py -o | sort -u | \
  sed 's/^from //; s/^import //; s/\..*//; s/ .*//' | sort -u

# Compare against installed packages
uv pip list --format json | jq -r '.[].name' | sort -u
```

WHY: Most import errors are either missing `uv add`, circular imports, or wrong `__init__.py` exports. This workflow catches all three.

## 7. Test Workflow

### Run all tests

```bash
uv run pytest
```

### Run tests with useful defaults

```bash
uv run pytest -x --tb=short -q
```

- `-x` stops on first failure (fix one thing at a time)
- `--tb=short` shows concise tracebacks
- `-q` reduces noise

### Run a specific test file or function

```bash
uv run pytest tests/test_auth.py
uv run pytest tests/test_auth.py::test_login_valid
uv run pytest -k "test_login"  # pattern match
```

### Run with coverage

```bash
uv add --dev pytest-cov
uv run pytest --cov=src/my_project --cov-report=term-missing
```

### Find test files in the project

```bash
fd "test_.*\.py$"
fd "conftest.py"
```

### Find tests that match a pattern

```bash
rg "def test_" --type py -l  # files containing tests
rg "def test_.*auth" --type py  # tests related to auth
```

### Run tests in parallel

```bash
uv add --dev pytest-xdist
uv run pytest -n auto  # use all CPU cores
```

### Run tests and stop on first failure with verbose output

```bash
uv run pytest -x -v --tb=long 2>&1 | head -80
```

WHY: Piping through `head` prevents test output from flooding the terminal during debugging. Increase the line count as needed.

### Watch tests (re-run on file change)

```bash
uv add --dev pytest-watch
uv run ptw -- -x --tb=short
```

## 8. Build and Publish

### Build the package

```bash
uv build
```

This creates both sdist (`.tar.gz`) and wheel (`.whl`) in `dist/`.

### Check the build before publishing

```bash
uv tool run twine check dist/*
```

### Publish to PyPI

```bash
uv publish
```

You need a PyPI API token. Set it via environment variable:

```bash
UV_PUBLISH_TOKEN=pypi-xxxx uv publish
```

### Publish to a private registry

```bash
uv publish --publish-url https://my-registry.example.com/simple/
```

### Bump version

Edit the version in `pyproject.toml` directly:

```toml
[project]
version = "1.2.0"
```

Or use dynamic versioning with git tags:

```toml
[project]
dynamic = ["version"]

[tool.setuptools-scm]
```

Then tag and build:

```bash
git tag v1.2.0
uv build
```

### Full release workflow

```bash
# 1. Run all checks
uv run ruff check .
uv run mypy src/
uv run pytest

# 2. Build
uv build

# 3. Verify
uv tool run twine check dist/*

# 4. Publish
uv publish
```

## 9. Migration from pip / poetry / pipenv

### From pip + requirements.txt

```bash
# In an existing project directory:
uv init --no-readme
uv add $(cat requirements.txt | grep -v '^#' | grep -v '^-' | tr '\n' ' ')
```

If you have a `requirements-dev.txt`:

```bash
uv add --dev $(cat requirements-dev.txt | grep -v '^#' | grep -v '^-' | tr '\n' ' ')
```

Then delete `requirements.txt` — `pyproject.toml` and `uv.lock` replace it.

### From poetry (pyproject.toml already exists)

```bash
# Remove poetry-specific sections and regenerate lock:
uv lock
uv sync
```

uv reads `[project.dependencies]` from pyproject.toml natively. Remove `[tool.poetry]` sections after verifying `uv sync` works.

If poetry used `[tool.poetry.dependencies]` instead of PEP 621 format:

```bash
# Extract deps from poetry format
rg "^[a-zA-Z]" pyproject.toml  # inspect the format first

# Then manually convert to:
# [project]
# dependencies = ["requests>=2.28", "pydantic>=2.0"]
```

### From pipenv (Pipfile)

```bash
uv init --no-readme

# Convert Pipfile packages
jq -r '.default | keys[]' Pipfile.lock | xargs uv add

# Convert dev packages
jq -r '.develop | keys[]' Pipfile.lock | xargs uv add --dev
```

Then delete `Pipfile`, `Pipfile.lock` — `pyproject.toml` and `uv.lock` replace them.

### Post-migration verification

After any migration, verify everything works:

```bash
uv sync                     # install all deps from lock
uv run python -c "import my_project"  # basic import check
uv run pytest               # run tests
rg "pip install\|poetry\|pipenv" --type md  # update docs references
```

WHY: The last command finds stale references to the old tool in your documentation so you can update them.

## Quick Reference

| Task | Command |
|---|---|
| New project | `uv init my-project` |
| Add dep | `uv add requests` |
| Add dev dep | `uv add --dev pytest` |
| Remove dep | `uv remove requests` |
| Run script | `uv run python script.py` |
| Run tests | `uv run pytest` |
| Format code | `uv tool run ruff format .` |
| Lint code | `uv tool run ruff check --fix .` |
| Type check | `uv tool run pyright src/` |
| Install Python | `uv python install 3.12` |
| Update all deps | `uv lock --upgrade && uv sync` |
| Build package | `uv build` |
| Publish | `uv publish` |
| Find imports | `rg "^(from\|import) module" --type py` |
| Find test files | `fd "test_.*\.py$"` |
| Dep tree | `uv tree` |
