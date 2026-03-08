---
name: kedro
version: 0.0.0
description: "CLI tool: kedro. Use this skill when working with kedro-related tasks."
ingredients:
  - kedro-org/kedro
tags:
  - cli
---

# kedro

CLI tool: kedro

## Usage

```bash
# Show help
kedro --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run kedro -- --help --json

# Introspect command schema
agents-cli schema kedro --json

# Dry-run before executing
agents-cli run kedro -- <args> --dry-run
```
