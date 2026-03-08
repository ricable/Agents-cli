---
name: jupytext
version: 0.0.0
description: "CLI tool: jupytext. Use this skill when working with jupytext-related tasks."
ingredients:
  - mwouts/jupytext
tags:
  - cli
---

# jupytext

CLI tool: jupytext

## Usage

```bash
# Show help
jupytext --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run jupytext -- --help --json

# Introspect command schema
agents-cli schema jupytext --json

# Dry-run before executing
agents-cli run jupytext -- <args> --dry-run
```
