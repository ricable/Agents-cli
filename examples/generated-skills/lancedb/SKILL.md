---
name: lancedb
version: 0.0.0
description: "CLI tool: lancedb. Use this skill when working with lancedb-related tasks."
ingredients:
  - lancedb/lancedb
tags:
  - cli
---

# lancedb

CLI tool: lancedb

## Usage

```bash
# Show help
lancedb --help
```

## Agent Integration

```bash
# Run via agents-cli (structured JSON output)
agents-cli run lancedb -- --help --json

# Introspect command schema
agents-cli schema lancedb --json

# Dry-run before executing
agents-cli run lancedb -- <args> --dry-run
```
