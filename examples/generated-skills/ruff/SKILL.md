---
name: ruff
version: 0.0.0
description: "An extremely fast Python linter and code formatter, written in Rust.. Use this skill whenever the user works with ruff or tasks related to an extremely fast python linter and code formatter, written in rust — even if they don't mention "ruff" by name."
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

## Overview

ruff provides an extremely fast python linter and code formatter, written in rust. Agents benefit from ruff because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add astral-sh/ruff

# Or clone from GitHub
git clone https://github.com/astral-sh/ruff.git
```

## Usage

```bash
# Show help and available options
ruff --help

# Check version
ruff --version
```

Refer to the project documentation for detailed usage:
- https://docs.astral.sh/ruff

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add astral-sh/ruff

# 2. Verify installation
agents-cli run ruff -- --version

# 3. Explore capabilities
agents-cli schema ruff --json
```

### Piping with other tools

```bash
# Chain ruff output with jq for structured processing
agents-cli run ruff -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run ruff -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run ruff -- --help --json

# Introspect full command schema
agents-cli schema ruff --json

# Dry-run before executing (safe exploration)
agents-cli run ruff -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe ruff --json
```

## When to Use This Tool

Use `ruff` when:
- Your task involves an extremely fast python linter and code formatter, written in rust
- A task requires ruff-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what ruff provides
