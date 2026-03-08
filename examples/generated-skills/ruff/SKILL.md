---
name: ruff
version: 0.0.0
description: "An extremely fast Python linter and code formatter, written in Rust.. Use this skill when working with ruff-related tasks."
ingredients:
  - astral-sh/ruff
tags:
  - linter
  - pep8
  - python
  - python3
  - ruff
  - rust
  - rustpython
  - static-analysis
  - static-code-analysis
  - style-guide
  - styleguide
  - cli
# homepage: https://docs.astral.sh/ruff
# license: MIT
---

# ruff

An extremely fast Python linter and code formatter, written in Rust.

**Source**: https://docs.astral.sh/ruff

## Usage

```bash
# Show help
ruff --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run ruff -- --help --json

# Introspect command schema
agents-cli schema ruff --json

# Dry-run before executing
agents-cli run ruff -- <args> --dry-run
```
