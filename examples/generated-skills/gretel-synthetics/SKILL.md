---
name: gretel-synthetics
version: 0.0.0
description: "CLI tool: gretel-synthetics. Use this skill when working with gretel-synthetics-related tasks."
ingredients:
  - gretelai/gretel-synthetics
tags:
  - cli
---

# gretel-synthetics

CLI tool: gretel-synthetics

## Usage

```bash
# Show help
gretel-synthetics --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run gretel-synthetics -- --help --json

# Introspect command schema
agents-cli schema gretel-synthetics --json

# Dry-run before executing
agents-cli run gretel-synthetics -- <args> --dry-run
```
