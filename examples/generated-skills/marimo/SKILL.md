---
name: marimo
version: 0.0.0
description: "CLI tool: marimo. Use this skill when working with marimo-related tasks."
ingredients:
  - marimo-team/marimo
tags:
  - cli
---

# marimo

CLI tool: marimo

## Usage

```bash
# Show help
marimo --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run marimo -- --help --json

# Introspect command schema
agents-cli schema marimo --json

# Dry-run before executing
agents-cli run marimo -- <args> --dry-run
```
