---
name: pnpm
version: 0.0.0
description: "CLI tool: pnpm. Use this skill when working with pnpm-related tasks."
ingredients:
  - pnpm/pnpm
tags:
  - cli
---

# pnpm

CLI tool: pnpm

## Usage

```bash
# Show help
pnpm --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run pnpm -- --help --json

# Introspect command schema
agents-cli schema pnpm --json

# Dry-run before executing
agents-cli run pnpm -- <args> --dry-run
```
