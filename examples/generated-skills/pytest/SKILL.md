---
name: pytest
version: 0.0.0
description: "CLI tool: pytest. Use this skill whenever the user works with pytest or tasks related to cli tool: pytest — even if they don't mention "pytest" by name."
ingredients:
  - pytest-dev/pytest
tags:
  - cli
---

# pytest

CLI tool: pytest

## Overview

pytest provides cli tool: pytest. Agents benefit from pytest because it provides programmatic access to capabilities that would otherwise require manual interaction or complex scripting.

## Installation

```bash
# Install via agents-cli
agents-cli add pytest-dev/pytest

# Or clone from GitHub
git clone https://github.com/pytest-dev/pytest.git
```

## Usage

```bash
# Show help and available options
pytest --help

# Check version
pytest --version
```

Refer to the project documentation for detailed usage:
- https://github.com/pytest-dev/pytest

## Common Workflows

### Getting started

```bash
# 1. Install the tool
agents-cli add pytest-dev/pytest

# 2. Verify installation
agents-cli run pytest -- --version

# 3. Explore capabilities
agents-cli schema pytest --json
```

### Piping with other tools

```bash
# Chain pytest output with jq for structured processing
agents-cli run pytest -- <args> | jq '.'

# Use with rg for filtering output
agents-cli run pytest -- <args> | rg '<pattern>'
```

## Agent Integration

Agents should use `agents-cli` to run this tool for structured output and safety:

```bash
# Run via agents-cli (structured JSON envelope)
agents-cli run pytest -- --help --json

# Introspect full command schema
agents-cli schema pytest --json

# Dry-run before executing (safe exploration)
agents-cli run pytest -- <args> --dry-run

# Generate detailed context for agent consumption
agents-cli describe pytest --json
```

## When to Use This Tool

Use `pytest` when:
- Your task involves cli tool: pytest
- A task requires pytest-specific functionality

Consider alternatives when:
- The task can be accomplished with simpler built-in tools
- You need a different specialization than what pytest provides
