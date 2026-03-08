---
name: nomic
version: 0.0.0
description: "CLI tool: nomic. Use this skill when working with nomic-related tasks."
ingredients:
  - nomic-ai/nomic
tags:
  - cli
---

# nomic

CLI tool: nomic

## Usage

```bash
# Show help
nomic --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run nomic -- --help --json

# Introspect command schema
agents-cli schema nomic --json

# Dry-run before executing
agents-cli run nomic -- <args> --dry-run
```
