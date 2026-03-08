---
name: bun
version: 1.3.11
description: "CLI tool: bun. Use this skill when working with bun-related tasks."
ingredients:
  - oven-sh/bun
tags:
  - cli
---

# bun

CLI tool: bun

## Usage

```bash
# Show help
bun --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run bun -- --help --json

# Introspect command schema
agents-cli schema bun --json

# Dry-run before executing
agents-cli run bun -- <args> --dry-run
```
